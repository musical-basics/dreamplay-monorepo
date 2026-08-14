/**
 * build-sql.mjs — generate DDL + COPY-ready data for a local Postgres replica
 * of a backed-up Supabase project.
 *
 * Reads a snapshot dir (schema.json + <schema>.<table>.jsonl) and writes:
 *   out/<ref>/01-schema.sql   schemas, enums, tables, PK/unique constraints, indexes
 *   out/<ref>/02-data/<schema>.<table>.tsv   one file per table (COPY format)
 *   out/<ref>/03-load.sql     \copy commands, run inside psql
 *
 * Types: information_schema reports ARRAY/USER-DEFINED without the underlying
 * type, so those are inferred from the data (see ARRAY_HINTS / enum collection).
 * FKs are intentionally NOT recreated: this is an archival replica and legacy
 * rows can reference deleted parents. PK/unique/indexes ARE recreated so queries
 * behave.
 *
 * Usage: node build-sql.mjs <snapshotDir> <outLabel>
 *   node build-sql.mjs ../tqhfpcdqxylrknwbrqqi/2026-08-04-full tqhf
 */
import fs from "node:fs";
import path from "node:path";

const [snapDir, label] = process.argv.slice(2);
if (!snapDir || !label) {
  console.error("usage: node build-sql.mjs <snapshotDir> <outLabel>");
  process.exit(1);
}
const here = import.meta.dirname;
const outDir = path.join(here, "out", label);
const dataDir = path.join(outDir, "02-data");
fs.mkdirSync(dataDir, { recursive: true });

const schema = JSON.parse(fs.readFileSync(path.join(snapDir, "schema.json"), "utf8"));

// uuid-looking arrays vs text arrays — decided by sampling below
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fileFor(sch, tbl) {
  for (const cand of [`${sch}.${tbl}.jsonl`, `public.${tbl}.jsonl`, `${tbl}.jsonl`]) {
    const p = path.join(snapDir, cand);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function* readRows(file, limit = Infinity) {
  const fd = fs.readFileSync(file, "utf8");
  let n = 0;
  for (const line of fd.split("\n")) {
    if (!line.trim()) continue;
    if (n++ >= limit) return;
    try { yield JSON.parse(line); } catch { /* skip malformed */ }
  }
}

// ---- group columns by table -------------------------------------------------
const tables = new Map(); // "schema.table" -> [colmeta]
for (const c of schema.columns) {
  const sch = c.table_schema || "public";
  const key = `${sch}.${c.table_name}`;
  if (!tables.has(key)) tables.set(key, []);
  tables.get(key).push({ ...c, table_schema: sch });
}

// ---- infer ARRAY element types + enum value sets ----------------------------
const enums = new Map(); // typename -> Set(values)
const arrayType = new Map(); // "schema.table.col" -> 'text[]' | 'uuid[]'

for (const [key, cols] of tables) {
  const [sch, tbl] = key.split(/\.(.+)/);
  const file = fileFor(sch, tbl);
  const ambiguous = cols.filter((c) => c.data_type === "ARRAY" || c.data_type === "USER-DEFINED");
  if (!ambiguous.length || !file) continue;
  for (const c of ambiguous) {
    if (c.data_type === "ARRAY") {
      let t = "text[]";
      for (const row of readRows(file, 500)) {
        const v = row[c.column_name];
        if (Array.isArray(v) && v.length) { t = v.every((x) => typeof x === "string" && UUID_RE.test(x)) ? "uuid[]" : "text[]"; break; }
      }
      arrayType.set(`${key}.${c.column_name}`, t);
    } else {
      // enum: name comes from the default (e.g. 'x'::workspace) else synthesize
      const m = /::"?([a-zA-Z_][a-zA-Z0-9_]*)"?/.exec(c.column_default || "");
      const typeName = m ? m[1] : `${tbl}_${c.column_name}_enum`;
      c._enumType = typeName;
      if (!enums.has(typeName)) enums.set(typeName, new Set());
      for (const row of readRows(file)) {   // full scan: rare enum values appear late
        const v = row[c.column_name];
        if (typeof v === "string" && v !== "") enums.get(typeName).add(v);
      }
    }
  }
}

function pgType(c) {
  const key = `${c.table_schema}.${c.table_name}.${c.column_name}`;
  switch (c.data_type) {
    case "ARRAY": return arrayType.get(key) || "text[]";
    case "USER-DEFINED": return `"${c._enumType}"`;
    case "timestamp with time zone": return "timestamptz";
    case "timestamp without time zone": return "timestamp";
    default: return c.data_type; // text, uuid, jsonb, integer, bigint, boolean, numeric, real, date
  }
}

function cleanDefault(c) {
  let d = c.column_default;
  if (!d) return "";
  if (/nextval\(/i.test(d)) return "";              // sequences handled by identity below
  if (/^gen_random_uuid\(\)/i.test(d)) return " default gen_random_uuid()";
  if (/^now\(\)|CURRENT_TIMESTAMP/i.test(d)) return " default now()";
  if (c.data_type === "USER-DEFINED") {
    const m = /^'([^']*)'/.exec(d);
    return m ? ` default '${m[1]}'::"${c._enumType}"` : "";
  }
  return ` default ${d}`;
}

// ---- emit schema SQL --------------------------------------------------------
const L = [];
L.push(`-- Local replica DDL generated from ${snapDir}`);
L.push(`-- FKs intentionally omitted (archival copy); PK/unique/indexes preserved.`);
L.push(`create extension if not exists pgcrypto;`);
L.push(`create extension if not exists "uuid-ossp";`);
L.push(``);
const schemasUsed = [...new Set([...tables.keys()].map((k) => k.split(".")[0]))];
for (const s of schemasUsed) if (s !== "public") L.push(`create schema if not exists "${s}";`);
L.push(``);
for (const [name, vals] of enums) {
  if (!vals.size) continue;
  const list = [...vals].map((v) => `'${v.replace(/'/g, "''")}'`).join(", ");
  L.push(`do $$ begin create type "${name}" as enum (${list}); exception when duplicate_object then null; end $$;`);
}
L.push(``);

const manifest = JSON.parse(fs.readFileSync(path.join(snapDir, "manifest.json"), "utf8"));
const emitted = [];
for (const [key, cols] of tables) {
  const [sch, tbl] = key.split(/\.(.+)/);
  const file = fileFor(sch, tbl);
  const defs = cols.map((c) => {
    const nn = c.is_nullable === "NO" ? " not null" : "";
    return `  "${c.column_name}" ${pgType(c)}${cleanDefault(c)}${nn}`;
  });
  L.push(`create table if not exists "${sch}"."${tbl}" (\n${defs.join(",\n")}\n);`);
  emitted.push({ sch, tbl, file, cols: cols.map((c) => c.column_name), arrayCols: new Set(cols.filter((c) => c.data_type === 'ARRAY').map((c) => c.column_name)) });
}
L.push(``);
// PK / unique constraints + indexes (public schema only in the captured metadata)
for (const c of schema.constraints || []) {
  if (!/PRIMARY KEY|UNIQUE/i.test(c.def)) continue;   // skip FK/check: archival copy
  // c.table arrives as regclass text: may be `public.foo`, `foo`, or `public."Customer"`
  let tbl = String(c.table).replace(/^public\./, "");
  const quoted = tbl.startsWith('"') ? tbl : `"${tbl}"`;   // already-quoted names keep their case
  L.push(`do $$ begin alter table "public".${quoted} add constraint "${c.conname}" ${c.def}; exception when others then null; end $$;`);
}
for (const i of schema.indexes || []) {
  if (/CREATE UNIQUE INDEX .*_pkey/i.test(i.indexdef)) continue;
  L.push(`do $$ begin ${i.indexdef.replace(/;$/, "")}; exception when others then null; end $$;`);
}
fs.writeFileSync(path.join(outDir, "01-schema.sql"), L.join("\n") + "\n");

// ---- emit TSV data + \copy script ------------------------------------------
// isArrayCol: true only for real Postgres ARRAY columns. A jsonb column can also
// hold a JS array — that must be written as JSON, not as a {…} array literal.
function tsv(v, isArrayCol) {
  if (v === null || v === undefined) return "\\N";
  if (Array.isArray(v) && !isArrayCol) {
    return JSON.stringify(v).replace(/\\/g, "\\\\").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r");
  }
  if (Array.isArray(v)) {
    const inner = v.map((x) => `"${String(x).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",");
    return `{${inner}}`.replace(/\\/g, "\\\\").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r");
  }
  if (typeof v === "object") v = JSON.stringify(v);
  return String(v).replace(/\\/g, "\\\\").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r");
}

const loads = [`\\set ON_ERROR_STOP on`, `-- run from the 02-data directory's parent`];
let totalRows = 0;
for (const t of emitted) {
  if (!t.file) continue;
  const outFile = path.join(dataDir, `${t.sch}.${t.tbl}.tsv`);
  const ws = fs.createWriteStream(outFile);
  let n = 0;
  for (const row of readRows(t.file)) {
    ws.write(t.cols.map((c) => tsv(row[c], t.arrayCols.has(c))).join("\t") + "\n");
    n++;
  }
  ws.end();
  totalRows += n;
  if (n > 0) {
    const collist = t.cols.map((c) => `"${c}"`).join(", ");
    loads.push(`\\copy "${t.sch}"."${t.tbl}" (${collist}) from '02-data/${t.sch}.${t.tbl}.tsv' with (format text, null '\\N')`);
  }
}
fs.writeFileSync(path.join(outDir, "03-load.sql"), loads.join("\n") + "\n");

console.log(`[${label}] ${emitted.length} tables, ${totalRows.toLocaleString()} rows -> ${outDir}`);
console.log(`[${label}] enums: ${[...enums.keys()].join(", ") || "none"}`);
