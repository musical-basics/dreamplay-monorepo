"use client";

import { useMemo, useState, useTransition } from "react";
import { saveMarketingEmail } from "@/actions/marketing-calendar-actions";

export interface CalendarEmail {
    id: string;
    topic: string;
    subject: string;
    previewText: string;
    html: string;
    status: string;
    /** ET wall-clock date "YYYY-MM-DD". */
    date: string;
    /** ET wall-clock time "HH:mm". */
    time: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function dayMs(dateIso: string): number {
    return new Date(`${dateIso}T00:00:00Z`).getTime();
}

function isoFromMs(ms: number): string {
    return new Date(ms).toISOString().slice(0, 10);
}

/** Sunday-aligned grid of days covering every scheduled email. */
function buildGrid(dates: string[]): string[][] {
    const ms = dates.map(dayMs);
    const min = Math.min(...ms);
    const max = Math.max(...ms);
    const start = min - new Date(min).getUTCDay() * 864e5;
    const end = max + (6 - new Date(max).getUTCDay()) * 864e5;
    const weeks: string[][] = [];
    for (let w = start; w <= end; w += 7 * 864e5) {
        weeks.push(Array.from({ length: 7 }, (_, i) => isoFromMs(w + i * 864e5)));
    }
    return weeks;
}

function prettyDate(dateIso: string): string {
    const d = new Date(`${dateIso}T00:00:00Z`);
    return `${WEEKDAYS[d.getUTCDay()]} ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function prettyTime(time: string): string {
    const h = Number(time.slice(0, 2));
    const m = time.slice(3, 5);
    const hour12 = ((h + 11) % 12) + 1;
    return `${hour12}:${m} ${h < 12 ? "AM" : "PM"}`;
}

function Editor({ email, onSaved }: { email: CalendarEmail; onSaved: (e: CalendarEmail) => void }) {
    const [subject, setSubject] = useState(email.subject);
    const [previewText, setPreviewText] = useState(email.previewText);
    const [html, setHtml] = useState(email.html);
    const [date, setDate] = useState(email.date);
    const [time, setTime] = useState(email.time);
    const [showPreview, setShowPreview] = useState(true);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    const dirty =
        subject !== email.subject ||
        previewText !== email.previewText ||
        html !== email.html ||
        date !== email.date ||
        time !== email.time;

    const previewHtml = useMemo(() => html.replaceAll("{{first_name}}", "Alex"), [html]);

    function save() {
        setError(null);
        startTransition(async () => {
            const result = await saveMarketingEmail(email.id, { subject, html, previewText, date, time });
            if (result.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
                onSaved({ ...email, subject, previewText, html, date, time });
            } else setError(result.error ?? "Save failed");
        });
    }

    return (
        <div className="border border-amber-300/30 bg-white/[0.02] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                    <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-amber-300/80">{email.topic}</p>
                    <h2 className="font-sans text-sm font-bold text-white">Editing: {prettyDate(date)} · {prettyTime(time)} ET</h2>
                </div>
                <button
                    type="button"
                    onClick={() => setShowPreview((v) => !v)}
                    className="font-sans text-[10px] uppercase tracking-widest text-white/50 hover:text-white border border-white/20 px-2 py-1"
                >
                    {showPreview ? "Edit HTML" : "Preview"}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 mb-3">
                <div>
                    <label className="block font-sans text-[10px] uppercase tracking-widest text-white/40 mb-1">Subject line</label>
                    <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full border border-white/15 bg-black/40 rounded px-3 py-2 font-sans text-sm text-white focus:border-amber-300 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="block font-sans text-[10px] uppercase tracking-widest text-white/40 mb-1">Send date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="border border-white/15 bg-black/40 rounded px-3 py-2 font-sans text-sm text-white focus:border-amber-300 focus:outline-none [color-scheme:dark]"
                    />
                </div>
                <div>
                    <label className="block font-sans text-[10px] uppercase tracking-widest text-white/40 mb-1">Time (ET)</label>
                    <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="border border-white/15 bg-black/40 rounded px-3 py-2 font-sans text-sm text-white focus:border-amber-300 focus:outline-none [color-scheme:dark]"
                    />
                </div>
            </div>

            <label className="block font-sans text-[10px] uppercase tracking-widest text-white/40 mb-1">
                Preview text (hidden preheader)
            </label>
            <input
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                className="w-full border border-white/15 bg-black/40 rounded px-3 py-2 font-sans text-sm text-white mb-3 focus:border-amber-300 focus:outline-none"
            />

            {showPreview ? (
                <iframe
                    srcDoc={previewHtml}
                    title="Email preview"
                    sandbox=""
                    className="w-full h-[560px] bg-black border border-white/10"
                />
            ) : (
                <textarea
                    value={html}
                    onChange={(e) => setHtml(e.target.value)}
                    rows={24}
                    spellCheck={false}
                    className="w-full border border-white/15 bg-black/60 rounded p-3 font-mono text-[11px] leading-relaxed text-emerald-100/90 focus:border-amber-300 focus:outline-none"
                />
            )}

            <div className="flex items-center gap-3 mt-3">
                <button
                    type="button"
                    onClick={save}
                    disabled={pending || !dirty}
                    className="border border-white bg-white px-5 py-2 font-sans text-[11px] font-bold uppercase tracking-widest text-black hover:bg-neutral-200 disabled:opacity-40"
                >
                    {pending ? "Saving..." : "Save email"}
                </button>
                {dirty && !pending && <span className="font-sans text-xs text-amber-300">Unsaved changes</span>}
                {saved && !dirty && <span className="font-sans text-xs text-emerald-400">Saved.</span>}
                {error && <span className="font-sans text-xs text-red-400">{error}</span>}
            </div>
        </div>
    );
}

export function CalendarBoard({ initialEmails }: { initialEmails: CalendarEmail[] }) {
    const [emails, setEmails] = useState(initialEmails);
    const [selectedId, setSelectedId] = useState<string | null>(initialEmails[0]?.id ?? null);

    const weeks = useMemo(() => buildGrid(emails.map((e) => e.date)), [emails]);
    const byDate = useMemo(() => {
        const map = new Map<string, CalendarEmail[]>();
        for (const e of emails) {
            const list = map.get(e.date) ?? [];
            list.push(e);
            map.set(e.date, list);
        }
        for (const list of map.values()) list.sort((a, b) => a.time.localeCompare(b.time));
        return map;
    }, [emails]);
    const selected = emails.find((e) => e.id === selectedId) ?? null;

    function onSaved(updated: CalendarEmail) {
        setEmails((all) => all.map((e) => (e.id === updated.id ? updated : e)));
    }

    return (
        <div className="space-y-8">
            <div className="overflow-x-auto border border-white/10">
                <div className="min-w-[840px]">
                    <div className="grid grid-cols-7 border-b border-white/10">
                        {WEEKDAYS.map((d) => (
                            <div
                                key={d}
                                className="px-2 py-2 font-sans text-[10px] uppercase tracking-[0.2em] text-white/40 text-center"
                            >
                                {d}
                            </div>
                        ))}
                    </div>
                    {weeks.map((week) => (
                        <div key={week[0]} className="grid grid-cols-7 border-b border-white/10 last:border-b-0">
                            {week.map((day) => {
                                const d = new Date(`${day}T00:00:00Z`);
                                const dayEmails = byDate.get(day) ?? [];
                                return (
                                    <div key={day} className="min-h-[104px] border-r border-white/10 last:border-r-0 p-1.5">
                                        <p className="font-sans text-[11px] text-white/35 mb-1 px-0.5">
                                            {d.getUTCDate() === 1 || day === weeks[0]?.[0]
                                                ? `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`
                                                : d.getUTCDate()}
                                        </p>
                                        <div className="space-y-1">
                                            {dayEmails.map((e) => (
                                                <button
                                                    key={e.id}
                                                    type="button"
                                                    onClick={() => setSelectedId(e.id)}
                                                    className={`block w-full text-left border px-2 py-1.5 transition-colors ${
                                                        e.id === selectedId
                                                            ? "border-amber-300/70 bg-amber-300/10"
                                                            : "border-white/15 bg-white/[0.04] hover:border-white/40"
                                                    }`}
                                                >
                                                    <p className="font-sans text-[10px] text-amber-300/90">
                                                        {prettyTime(e.time)} ET · {e.status}
                                                    </p>
                                                    <p className="font-sans text-[11px] text-white/85 leading-snug">{e.subject}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {selected && <Editor key={selected.id} email={selected} onSaved={onSaved} />}
        </div>
    );
}
