"use client";

import { useMemo, useState, useTransition } from "react";
import { saveAbTestTemplate, saveArmOverrides } from "@/actions/buyer-research-actions";
import type { ResearchArm } from "@/lib/buyer-research";

export interface EditorTemplate {
    arm: ResearchArm;
    title: string;
    subject: string;
    html: string;
}

export interface EditorBuyer {
    id: string;
    email: string;
    name: string;
    product: string;
    paid: string;
    date: string;
    arm: ResearchArm;
}

const ARM_TINT: Record<ResearchArm, string> = {
    A1: "border-blue-400/40",
    A2: "border-blue-400/20",
    B1: "border-purple-400/40",
    B2: "border-purple-400/20",
};

function TemplateCard({ tpl }: { tpl: EditorTemplate }) {
    const [subject, setSubject] = useState(tpl.subject);
    const [html, setHtml] = useState(tpl.html);
    const [showPreview, setShowPreview] = useState(true);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    const previewHtml = useMemo(
        () =>
            html
                .replaceAll("{{first_name}}", "Alex")
                .replaceAll("{{research_url}}", "#preview")
                .replaceAll("{{survey_url}}", "#preview"),
        [html],
    );

    function save() {
        setError(null);
        startTransition(async () => {
            const result = await saveAbTestTemplate(tpl.arm, subject, html);
            if (result.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
            } else setError(result.error ?? "Save failed");
        });
    }

    return (
        <div className={`border ${ARM_TINT[tpl.arm]} bg-white/[0.02] p-4`}>
            <div className="flex items-center justify-between mb-3">
                <h2 className="font-sans text-sm font-bold text-white">{tpl.title}</h2>
                <button
                    type="button"
                    onClick={() => setShowPreview((v) => !v)}
                    className="font-sans text-[10px] uppercase tracking-widest text-white/50 hover:text-white border border-white/20 px-2 py-1"
                >
                    {showPreview ? "Edit HTML" : "Preview"}
                </button>
            </div>
            <label className="block font-sans text-[10px] uppercase tracking-widest text-white/40 mb-1">Subject line</label>
            <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border border-white/15 bg-black/40 rounded px-3 py-2 font-sans text-sm text-white mb-3 focus:border-blue-400 focus:outline-none"
            />
            {showPreview ? (
                <iframe
                    srcDoc={previewHtml}
                    title={`${tpl.arm} preview`}
                    sandbox=""
                    className="w-full h-[420px] bg-black border border-white/10"
                />
            ) : (
                <textarea
                    value={html}
                    onChange={(e) => setHtml(e.target.value)}
                    rows={18}
                    spellCheck={false}
                    className="w-full border border-white/15 bg-black/60 rounded p-3 font-mono text-[11px] leading-relaxed text-emerald-100/90 focus:border-blue-400 focus:outline-none"
                />
            )}
            <div className="flex items-center gap-3 mt-3">
                <button
                    type="button"
                    onClick={save}
                    disabled={pending}
                    className="border border-white bg-white px-4 py-2 font-sans text-[11px] font-bold uppercase tracking-widest text-black hover:bg-neutral-200 disabled:opacity-40"
                >
                    {pending ? "Saving..." : "Save wording"}
                </button>
                {saved && <span className="font-sans text-xs text-emerald-400">Saved.</span>}
                {error && <span className="font-sans text-xs text-red-400">{error}</span>}
            </div>
        </div>
    );
}

export function AbTestEditor({ templates, buyers }: { templates: EditorTemplate[]; buyers: EditorBuyer[] }) {
    const [assignment, setAssignment] = useState<Record<string, ResearchArm>>(
        Object.fromEntries(buyers.map((b) => [b.id, b.arm])),
    );
    const [dirty, setDirty] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    const byArm = (arm: ResearchArm) => buyers.filter((b) => assignment[b.id] === arm);

    function onDrop(e: React.DragEvent, arm: ResearchArm) {
        e.preventDefault();
        const buyerId = e.dataTransfer.getData("text/buyer-id");
        if (!buyerId || assignment[buyerId] === arm) return;
        setAssignment((a) => ({ ...a, [buyerId]: arm }));
        setDirty(true);
        setSaved(false);
    }

    function saveGroups() {
        setError(null);
        startTransition(async () => {
            const result = await saveArmOverrides(assignment);
            if (result.ok) {
                setDirty(false);
                setSaved(true);
            } else setError(result.error ?? "Save failed");
        });
    }

    return (
        <div>
            {/* Sticky save bar for the group assignment */}
            <div className="sticky top-0 z-10 flex items-center gap-4 bg-[#0b0b0d]/95 backdrop-blur border-b border-white/10 py-3 mb-6">
                <p className="font-sans text-sm text-white/60">
                    Groups: {(["A1", "A2", "B1", "B2"] as const).map((a) => `${a} ${byArm(a).length}`).join(" · ")}
                </p>
                <button
                    type="button"
                    onClick={saveGroups}
                    disabled={pending || !dirty}
                    className="border border-white bg-white px-5 py-2 font-sans text-[11px] font-bold uppercase tracking-widest text-black hover:bg-neutral-200 disabled:opacity-40"
                >
                    {pending ? "Saving..." : "Save groups"}
                </button>
                {dirty && <span className="font-sans text-xs text-amber-300">Unsaved changes</span>}
                {saved && !dirty && <span className="font-sans text-xs text-emerald-400">Groups saved.</span>}
                {error && <span className="font-sans text-xs text-red-400">{error}</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {templates.map((tpl) => (
                    <div key={tpl.arm} className="min-w-0">
                        <TemplateCard tpl={tpl} />

                        {/* Buyer group under its variant; drag chips between columns */}
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => onDrop(e, tpl.arm)}
                            className={`mt-3 border border-dashed ${ARM_TINT[tpl.arm]} bg-white/[0.01] p-2 min-h-[240px]`}
                        >
                            <p className="font-sans text-[10px] uppercase tracking-widest text-white/40 mb-2 px-1">
                                {tpl.arm} buyers · {byArm(tpl.arm).length}
                            </p>
                            <div className="space-y-1.5">
                                {byArm(tpl.arm).map((b) => (
                                    <div
                                        key={b.id}
                                        draggable
                                        onDragStart={(e) => e.dataTransfer.setData("text/buyer-id", b.id)}
                                        className="border border-white/10 bg-white/[0.04] px-2.5 py-2 cursor-grab active:cursor-grabbing hover:border-white/30"
                                    >
                                        <p className="font-sans text-xs text-white/90 truncate" title={b.email}>{b.email}</p>
                                        <p className="font-sans text-[11px] text-white/45 truncate">
                                            {b.name && <span>{b.name} · </span>}
                                            {b.paid} · {b.date}
                                        </p>
                                        <p className="font-sans text-[11px] text-white/35 truncate" title={b.product}>{b.product}</p>
                                    </div>
                                ))}
                                {byArm(tpl.arm).length === 0 && (
                                    <p className="font-sans text-xs text-white/30 px-1 py-4 text-center">Drop buyers here</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
