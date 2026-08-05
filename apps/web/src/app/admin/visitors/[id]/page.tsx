import Link from "next/link";
import { getVisitorHistory } from "@dreamplay/analytics/queries";
import type { EventRow } from "@dreamplay/analytics/queries";
import { getAdminDb } from "@/lib/db";

/**
 * /admin/visitors/[id] — the full chronological event journey for one visit
 * (session id or visitor id), the port of the legacy visitor-history view.
 */

export const dynamic = "force-dynamic";

function metaOf(row: EventRow): Record<string, unknown> {
  const m = row.metadata;
  return m && typeof m === "object" && !Array.isArray(m) ? (m as Record<string, unknown>) : {};
}

/** The metadata keys worth showing inline per event. */
const DETAIL_KEYS = [
  "ab_variant",
  "cta",
  "href",
  "checkout_source",
  "tier",
  "size",
  "color",
  "product_name",
  "order_number",
  "total_price",
  "click_count",
  "source",
  "email",
  "utm_source",
  "utm_campaign",
  "referrer",
] as const;

export default async function AdminVisitorJourneyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  let events: EventRow[] = [];
  let loadError: string | null = null;
  try {
    events = await getVisitorHistory(decodedId, { client: getAdminDb() });
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load journey.";
  }

  const first = events[0];

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/visitors"
          className="font-sans text-xs uppercase tracking-widest text-white/50 hover:text-white"
        >
          ← All visitors
        </Link>
        <h1 className="font-serif text-3xl tracking-tight mt-2">Visitor journey</h1>
        <p className="font-sans text-sm text-white/40 mt-1">
          <code>{decodedId}</code>
          {first ? (
            <>
              {" · "}
              {first.ip_address ?? "unknown ip"}
              {first.email ? ` · ${first.email}` : ""}
              {[first.city, first.country].filter(Boolean).length > 0
                ? ` · ${[first.city, first.country].filter(Boolean).join(", ")}`
                : ""}
            </>
          ) : null}
          {" · "}
          {events.length} events
        </p>
      </div>

      {loadError ? (
        <div className="border border-red-500/30 bg-red-500/10 p-6 font-sans text-sm text-red-300 mb-8">
          Could not load journey: {loadError}
        </div>
      ) : null}

      <section className="border border-white/10 bg-white/[0.03] p-6 overflow-x-auto">
        <table className="w-full font-sans text-sm min-w-[700px]">
          <thead>
            <tr className="text-left text-white/40 text-xs uppercase tracking-widest">
              <th className="pb-2 font-normal">When</th>
              <th className="pb-2 font-normal">Event</th>
              <th className="pb-2 font-normal">Path</th>
              <th className="pb-2 font-normal text-right">Duration</th>
              <th className="pb-2 font-normal">Details</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              const meta = metaOf(event);
              const details = DETAIL_KEYS.filter(
                (key) => meta[key] !== undefined && meta[key] !== null && meta[key] !== ""
              ).map((key) => `${key}: ${String(meta[key])}`);
              return (
                <tr key={event.id} className="border-t border-white/5 align-top">
                  <td className="py-2 whitespace-nowrap text-white/60">
                    {new Date(event.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="py-2 text-white/80">
                    <code>{event.event_name}</code>
                  </td>
                  <td className="py-2 text-white/60 break-all max-w-[260px]">{event.path ?? "—"}</td>
                  <td className="py-2 text-right text-white/60 whitespace-nowrap">
                    {event.duration_seconds != null ? `${Math.round(Number(event.duration_seconds))}s` : "—"}
                  </td>
                  <td className="py-2 text-white/40 text-xs max-w-[380px] break-words">
                    {details.join(" · ") || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {events.length === 0 && !loadError ? (
          <p className="font-sans text-sm text-white/40 mt-4">
            No events for this id (it may have aged out of the range, or the id is a visitor id
            with events only under its session id).
          </p>
        ) : null}
      </section>
    </div>
  );
}
