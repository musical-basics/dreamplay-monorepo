"use client";

import { useState } from "react";

/**
 * Basic HTML campaign editor (the essentials of the legacy editor: subject,
 * preview text, raw HTML with live preview). Not pixel-perfect by design —
 * the drag-and-drop editor + AI copilot are Phase 8.
 */
export function CampaignEditor({
    campaign,
    action,
}: {
    campaign: {
        id: string;
        name: string;
        subject_line: string;
        preview_text: string;
        html_content: string;
    };
    action: (formData: FormData) => Promise<void>;
}) {
    const [html, setHtml] = useState(campaign.html_content);
    const [showPreview, setShowPreview] = useState(true);

    return (
        <form action={action} className="space-y-5 font-sans">
            <input type="hidden" name="id" value={campaign.id} />

            <div className="grid md:grid-cols-2 gap-4">
                <label className="block">
                    <span className="block text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Name</span>
                    <input
                        name="name"
                        defaultValue={campaign.name}
                        className="w-full bg-black/40 border border-white/15 px-3 py-2 text-sm text-white focus:border-white/50 outline-none"
                    />
                </label>
                <label className="block">
                    <span className="block text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Subject</span>
                    <input
                        name="subject_line"
                        defaultValue={campaign.subject_line}
                        className="w-full bg-black/40 border border-white/15 px-3 py-2 text-sm text-white focus:border-white/50 outline-none"
                    />
                </label>
            </div>

            <label className="block">
                <span className="block text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">
                    Preview text (preheader)
                </span>
                <input
                    name="preview_text"
                    defaultValue={campaign.preview_text}
                    className="w-full bg-black/40 border border-white/15 px-3 py-2 text-sm text-white focus:border-white/50 outline-none"
                />
            </label>

            <div>
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                        HTML — {"{{variables}}"} and {"{{#if tag_X}}...{{/endif}}"} supported
                    </span>
                    <button
                        type="button"
                        onClick={() => setShowPreview((v) => !v)}
                        className="text-[10px] uppercase tracking-[0.2em] text-white/50 hover:text-white"
                    >
                        {showPreview ? "Hide preview" : "Show preview"}
                    </button>
                </div>
                <div className={showPreview ? "grid md:grid-cols-2 gap-4" : ""}>
                    <textarea
                        name="html_content"
                        value={html}
                        onChange={(e) => setHtml(e.target.value)}
                        rows={24}
                        spellCheck={false}
                        className="w-full bg-black/40 border border-white/15 px-3 py-2 text-xs font-mono text-emerald-200/90 focus:border-white/50 outline-none leading-relaxed"
                    />
                    {showPreview ? (
                        <iframe
                            title="Preview"
                            sandbox=""
                            srcDoc={html}
                            className="w-full min-h-[500px] bg-white border border-white/15"
                        />
                    ) : null}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    type="submit"
                    className="bg-white text-black px-6 py-2 text-xs uppercase tracking-widest hover:bg-white/80 transition-colors"
                >
                    Save
                </button>
                <span className="text-xs text-white/30">
                    Sends go through the agent API (safety gates apply) — not from this screen.
                </span>
            </div>
        </form>
    );
}
