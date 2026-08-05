/**
 * 08-backfill-buyer-update-emails.mjs — seed the curated buyer_update_emails
 * log from the historical campaign data already migrated into the new DB.
 *
 * Waves are defined by subject line (the campaigns table stores one child
 * campaign per recipient batch, so a "wave" = every campaign sharing the
 * update's subject variants). For each wave this script computes, live from
 * campaigns + sent_history + buyers:
 *   - campaign_ids (every campaign row in the wave)
 *   - sent_first_at / sent_last_at (min/max sent_history.sent_at)
 *   - recipient_count (unique recipient emails that are in buyers)
 * and upserts on update_key. Re-runnable; additive only.
 *
 * Verified 2026-08-05 before writing: every recipient of these subjects is in
 * buyers (April: 60 unique, the 6-recipient first batch is a subset; June: 68).
 *
 * Env (root .env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 * Usage: node --env-file=../../.env.local 08-backfill-buyer-update-emails.mjs [--execute]
 */

const EXECUTE = process.argv.includes("--execute");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !svc) {
  console.error("Missing env — run with: node --env-file=../../.env.local 08-backfill-buyer-update-emails.mjs");
  process.exit(1);
}
console.log(`>>> MODE: ${EXECUTE ? "EXECUTE" : "DRY-RUN (pass --execute to write)"}`);

const UPDATES = [
  {
    update_key: "april-2026-reservation-update",
    title: "April 2026: reservation update (timeline + options)",
    subject_lines: [
      "Important update on your DreamPlay reservation",
      "Important update on your DreamPlay One reservation",
    ],
    website_url: null,
    video_url: null,
    summary:
      "First buyer-wide reservation update: revised timeline and the keep / upgrade / refund options. Sent in two batches (subject refined after the first 6 recipients).",
  },
  {
    update_key: "june-2026-progress-update",
    title: "June 2026: first prototype being built",
    subject_lines: ["Your DreamPlay One: a June progress update"],
    website_url: "https://www.dreamplaypianos.com/june-update",
    video_url: null,
    summary:
      "First full prototype under construction (oversized internals on purpose), Belgium concert note, road-to-delivery roadmap (Jan 2027 estimate), keep / upgrade / refund options.",
  },
];

const headers = {
  apikey: svc,
  Authorization: `Bearer ${svc}`,
  "Content-Type": "application/json",
};

async function rest(path, init) {
  const res = await fetch(`${url}/rest/v1/${path}`, { headers, ...init });
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const buyers = await rest("buyers?select=email&limit=10000");
const buyerEmails = new Set(buyers.map((b) => b.email.toLowerCase()));
console.log(`buyers: ${buyerEmails.size}`);

for (const u of UPDATES) {
  const subjFilter = `(${u.subject_lines.map((s) => `"${s}"`).join(",")})`;
  const camps = await rest(
    `campaigns?select=id&subject_line=in.${encodeURIComponent(subjFilter)}&limit=1000`,
  );
  const campaignIds = camps.map((c) => c.id);
  if (!campaignIds.length) {
    console.warn(`!! no campaigns found for ${u.update_key} — skipping`);
    continue;
  }
  const sh = await rest(
    `sent_history?select=sent_at,subscribers(email)&campaign_id=in.(${encodeURIComponent(campaignIds.join(","))})&limit=10000`,
  );
  const recipients = new Set(
    sh.map((r) => r.subscribers?.email?.toLowerCase()).filter(Boolean),
  );
  const buyerRecipients = [...recipients].filter((e) => buyerEmails.has(e));
  const dates = sh.map((r) => r.sent_at).sort();
  const row = {
    update_key: u.update_key,
    title: u.title,
    status: "sent",
    subject_lines: u.subject_lines,
    campaign_ids: campaignIds,
    sent_first_at: dates[0] ?? null,
    sent_last_at: dates[dates.length - 1] ?? null,
    recipient_count: buyerRecipients.length,
    audience: "buyers",
    website_url: u.website_url,
    video_url: u.video_url,
    summary: u.summary,
  };
  console.log(
    `${u.update_key}: campaigns=${campaignIds.length} sends=${sh.length} unique=${recipients.size} buyers=${buyerRecipients.length} ${row.sent_first_at?.slice(0, 10)}..${row.sent_last_at?.slice(0, 10)}`,
  );
  if (recipients.size !== buyerRecipients.length) {
    console.warn(`   note: ${recipients.size - buyerRecipients.length} recipients not in buyers`);
  }
  if (EXECUTE) {
    await rest("buyer_update_emails?on_conflict=update_key", {
      method: "POST",
      headers: { ...headers, Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify([row]),
    });
    console.log(`   upserted`);
  }
}
console.log("done.");
