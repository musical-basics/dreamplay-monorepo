/**
 * 09-backfill-buyer-order-details.mjs — populate buyers.kind + order details
 * + est_ship_date from the Shopify Admin API (source of truth), falling back
 * to preorder_orders (the 2026-04 CSV rescue) for size/finish when Shopify
 * variant titles are missing.
 *
 * Classification (kind):
 *   - test:     probe rows, "Test Account" notes, internal/owned addresses
 *   - founder:  best order total == $0 (Founders reservations)
 *   - waitlist: best order total <= $5 (the ~$1 waitlist deposits)
 *   - buyer:    everything else with a real order
 *   - unknown:  no order found anywhere (e.g. "Purchased tag" backfills from
 *               the pre-Shopify Wix era) — review by hand on /admin/buyers
 *
 * No-email orders: Shopify allows phone-only checkout (orders #1117, #1121).
 * Those buyers get a placeholder address `order-<n>@no-email.invalid` (.invalid
 * is the RFC-reserved TLD — undeliverable by construction, and the send
 * pipeline targets subscribers so it can never be emailed), phone + name in
 * notes, and are matched on re-runs via shopify_order_number.
 *
 * est_ship_date policy (Lionel, 2026-08-06): purchase_date + 12 months,
 * floored at 2027-01-31 (the date promised to early backers in the June
 * update). Manual per-buyer overrides are allowed afterwards; re-running with
 * --execute recomputes ONLY rows whose est_ship_date is currently null unless
 * --recompute-ship-dates is passed.
 *
 * Env (root .env.local): SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_CLIENT_ID/SECRET,
 * NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 * Usage: node --env-file=../../.env.local 09-backfill-buyer-order-details.mjs [--execute] [--recompute-ship-dates]
 */

const EXECUTE = process.argv.includes("--execute");
const RECOMPUTE = process.argv.includes("--recompute-ship-dates");
const store = process.env.SHOPIFY_STORE_DOMAIN;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!store || !url || !svc) {
  console.error("Missing env — run with: node --env-file=../../.env.local 09-backfill-buyer-order-details.mjs");
  process.exit(1);
}
console.log(`>>> MODE: ${EXECUTE ? "EXECUTE" : "DRY-RUN (pass --execute to write)"}`);

const TEST_EMAILS = new Set([
  "lionel@musicalbasics.com",
  "musicalbasics@gmail.com",
  "support@musicalbasics.com",
  "yu_lionel@yahoo.com",
  "yulionel829@gmail.com",
  "hello@5ave.studio",
  "dreamplaypianos@loadaccumulator.co",
  "dreamplaypianos@loadaccumulator.com",
]);

const H = { apikey: svc, Authorization: `Bearer ${svc}`, "Content-Type": "application/json" };
async function rest(path, init) {
  const res = await fetch(`${url}/rest/v1/${path}`, { headers: H, ...init });
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// --- Shopify: all orders with line-item variants ------------------------------
const tr = await fetch(`https://${store}/admin/oauth/access_token`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    client_id: process.env.SHOPIFY_ADMIN_CLIENT_ID,
    client_secret: process.env.SHOPIFY_ADMIN_CLIENT_SECRET,
    grant_type: "client_credentials",
  }),
});
const token = (await tr.json()).access_token;
if (!token) { console.error("Shopify token failed"); process.exit(1); }

const orders = [];
let cursor = null;
for (;;) {
  const q = `{ orders(first: 100, sortKey: CREATED_AT${cursor ? `, after: "${cursor}"` : ""}) {
    pageInfo { hasNextPage endCursor }
    nodes { name email phone createdAt cancelledAt displayFinancialStatus
      totalPriceSet { shopMoney { amount } }
      customer { email phone displayName }
      shippingAddress { phone name }
      lineItems(first: 10) { nodes { title variantTitle quantity } } } } }`;
  const r = await fetch(`https://${store}/admin/api/2025-10/graphql.json`, {
    method: "POST",
    headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
    body: JSON.stringify({ query: q }),
  });
  const j = await r.json();
  if (j.errors) { console.error("GraphQL errors:", JSON.stringify(j.errors)); process.exit(1); }
  orders.push(...j.data.orders.nodes);
  if (!j.data.orders.pageInfo.hasNextPage) break;
  cursor = j.data.orders.pageInfo.endCursor;
}
console.log(`Shopify orders: ${orders.length}`);

const byEmail = new Map();
const byName = new Map();
const payingNoEmail = [];
for (const o of orders) {
  const email = (o.email || o.customer?.email || "").toLowerCase().trim();
  const status = o.cancelledAt ? "CANCELLED" : o.displayFinancialStatus;
  if (!["PAID", "PARTIALLY_REFUNDED", "AUTHORIZED"].includes(status)) continue;
  byName.set(o.name, o);
  if (!email) {
    payingNoEmail.push(o);
    continue;
  }
  if (!byEmail.has(email)) byEmail.set(email, []);
  byEmail.get(email).push(o);
}

// --- preorder_orders fallback (size/finish from the CSV rescue) ----------------
const csvOrders = await rest("preorder_orders?select=email,size_variant,finish,product_line,lineitem_name&limit=5000");
const csvByEmail = new Map();
for (const o of csvOrders) {
  const e = o.email.toLowerCase().trim();
  if (!csvByEmail.has(e)) csvByEmail.set(e, []);
  csvByEmail.get(e).push(o);
}

// --- classify + compute ---------------------------------------------------------
const buyers = await rest("buyers?select=id,email,notes,shopify_order_number,est_ship_date&order=created_at.asc&limit=1000");
console.log(`buyers: ${buyers.length}`);

const FLOOR = "2027-01-31";
function estShip(purchaseIso) {
  const d = new Date(purchaseIso);
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  const iso = d.toISOString().slice(0, 10);
  return iso < FLOOR ? FLOOR : iso;
}

function parseVariant(vt) {
  // variantTitle like "DS6.0 / White" or "White / DS6.0" (order varies)
  if (!vt) return { size: null, finish: null };
  const parts = vt.split("/").map((s) => s.trim()).filter((s) => s && s.toLowerCase() !== "default title");
  let size = null, finish = null;
  for (const p of parts) {
    if (/^ds\s*\d/i.test(p)) size = p.toUpperCase().replace(/\s+/, "");
    else finish = p;
  }
  return { size, finish };
}

const counts = {};
const updates = [];
for (const b of buyers) {
  const email = b.email.toLowerCase().trim();
  const notes = b.notes || "";
  let kind, purchase_date = null, price = null, product = null, size = null, finish = null, source = null;

  let os = byEmail.get(email) || [];
  // no-email buyers (placeholder address) match via their Shopify order number
  if (!os.length && b.shopify_order_number && byName.has(b.shopify_order_number)) {
    os = [byName.get(b.shopify_order_number)];
  }
  if (os.length) {
    // best = highest-value order (deposit vs full payment: the real product order wins)
    const best = os.reduce((a, o) => (+o.totalPriceSet.shopMoney.amount > +a.totalPriceSet.shopMoney.amount ? o : a));
    const total = os.reduce((s, o) => s + +o.totalPriceSet.shopMoney.amount, 0);
    const bestAmt = +best.totalPriceSet.shopMoney.amount;
    purchase_date = best.createdAt;
    price = Math.round(total * 100) / 100;
    const li = best.lineItems.nodes.find((n) => /dreamplay|piano|keyboard/i.test(n.title)) || best.lineItems.nodes[0];
    product = li?.title ?? null;
    const v = parseVariant(li?.variantTitle);
    size = v.size; finish = v.finish;
    source = `shopify ${best.name}`;
    kind = bestAmt === 0 ? "founder" : bestAmt <= 5 ? "waitlist" : "buyer";
  }
  if (!size || !finish) {
    const csv = (csvByEmail.get(email) || []).find((o) => o.size_variant || o.finish);
    if (csv) {
      size = size || csv.size_variant;
      finish = finish || csv.finish;
      product = product || csv.lineitem_name;
      source = source ? `${source} + csv` : "preorder_orders csv";
    }
  }
  if (/__webhook_.*_probe__/.test(email) || /test account/i.test(notes) || TEST_EMAILS.has(email)) {
    kind = "test"; // test overrides everything, even if they have real orders
  } else if (!os.length) {
    kind = "unknown";
  }

  const est = kind === "buyer" && purchase_date ? estShip(purchase_date) : null;
  const est_ship_date = RECOMPUTE ? est : (b.est_ship_date ?? est);

  counts[kind] = (counts[kind] || 0) + 1;
  updates.push({ id: b.id, email, kind, purchase_date, price_paid_usd: price, product_line: product, size_variant: size, finish, est_ship_date, order_details_source: source });
}

console.log("\nkind counts:", counts);
console.log("\nemail                                         | kind     | purchased  | paid    | est ship   | product (size / finish)");
for (const u of updates) {
  console.log(
    `${u.email.padEnd(45)} | ${u.kind.padEnd(8)} | ${(u.purchase_date || "").slice(0, 10).padEnd(10)} | ${String(u.price_paid_usd ?? "").padStart(7)} | ${(u.est_ship_date || "").padEnd(10)} | ${[u.product_line, u.size_variant, u.finish].filter(Boolean).join(" / ")}`,
  );
}

if (EXECUTE) {
  for (const u of updates) {
    const { id, email, ...fields } = u;
    await rest(`buyers?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(fields) });
  }
  console.log(`\nupdated ${updates.length} buyers`);
}

// --- paying orders with NO buyers row at all -----------------------------------
const knownOrderNums = new Set(buyers.map((b) => b.shopify_order_number).filter(Boolean));
const missingNoEmail = payingNoEmail.filter((o) => !knownOrderNums.has(o.name));
for (const o of missingNoEmail) {
  const amt = +o.totalPriceSet.shopMoney.amount;
  const name = o.customer?.displayName || o.shippingAddress?.name || "Unknown";
  const phone = o.phone || o.customer?.phone || o.shippingAddress?.phone || null;
  const li = o.lineItems.nodes.find((n) => /dreamplay|piano|keyboard/i.test(n.title)) || o.lineItems.nodes[0];
  const v = parseVariant(li?.variantTitle);
  const kind = amt === 0 ? "founder" : amt <= 5 ? "waitlist" : "buyer";
  const row = {
    email: `order-${o.name.replace("#", "")}@no-email.invalid`,
    notes: `${name} | NO EMAIL - phone ${phone ?? "unknown"} | phone-only checkout, Shopify ${o.name}`,
    source: "backfill",
    shopify_order_number: o.name,
    kind,
    purchase_date: o.createdAt,
    price_paid_usd: Math.round(amt * 100) / 100,
    product_line: li?.title ?? null,
    size_variant: v.size,
    finish: v.finish,
    est_ship_date: kind === "buyer" ? estShip(o.createdAt) : null,
    order_details_source: `shopify ${o.name} (no email)`,
  };
  console.log(`\nNO-EMAIL ORDER, creating buyers row: ${o.name} ${name} $${amt} ${[row.product_line, row.size_variant, row.finish].filter(Boolean).join(" / ")} est_ship=${row.est_ship_date}`);
  if (EXECUTE) {
    await rest("buyers?on_conflict=email", {
      method: "POST",
      headers: { ...H, Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify([row]),
    });
    console.log("   inserted");
  }
}

// paying orders with an email that still is not in buyers: 07's territory
for (const [email, os] of byEmail.entries()) {
  const inBuyers = buyers.some((b) => b.email.toLowerCase().trim() === email);
  if (!inBuyers && !os.every((o) => knownOrderNums.has(o.name))) {
    console.warn(`!! paying order(s) for ${email} have no buyers row — run 07-shopify-reconcile.mjs`);
  }
}
console.log("done.");
