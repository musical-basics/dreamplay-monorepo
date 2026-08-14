#!/usr/bin/env bash
# Compare loaded row counts against the backup manifests.
set -euo pipefail
cd "$(dirname "$0")"
python3 - <<'PY'
import json, subprocess
pairs = [("tqhf","legacy-tqhf","../tqhfpcdqxylrknwbrqqi/2026-08-04-full/manifest.json"),
         ("quyq","legacy-quyq","../quyqwdjygzalqqmrgkfk/2026-08-04/manifest.json")]
for label, container, manp in pairs:
    man = json.load(open(manp))["tables"]
    out = subprocess.run(["docker","exec",container,"psql","-U","postgres","-d",label,"-At","-F","\t","-c",
        "select schemaname||'.'||relname, n_live_tup from pg_stat_user_tables"],
        capture_output=True, text=True).stdout.strip()
    live = {}
    for line in out.split("\n"):
        if not line.strip(): continue
        k, v = line.split("\t"); live[k] = int(v)
    print(f"=== {label} ===")
    bad = 0
    for key, expected in sorted(man.items()):
        if not isinstance(expected, int): continue
        norm = key if "." in key else f"public.{key}"
        got = live.get(norm, 0)
        if got != expected:
            bad += 1
            print(f"  MISMATCH {norm}: backup={expected} loaded={got}")
    print(f"  {'ALL MATCH' if bad==0 else str(bad)+' mismatches'} ({sum(v for v in man.values() if isinstance(v,int)):,} rows expected)")
PY
