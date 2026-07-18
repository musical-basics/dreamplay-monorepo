import Link from "next/link";
import { getAdminDb } from "@/lib/db";
import { EmailNav } from "../../EmailNav";
import { saveCampaign } from "../../actions";
import { CampaignEditor } from "./CampaignEditor";

/** /admin/email/campaigns/[id] — edit a campaign ("new" creates one). */
export const dynamic = "force-dynamic";

export default async function CampaignEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const db = getAdminDb();

    let campaign = {
        id: "new",
        name: "",
        subject_line: "",
        preview_text: "",
        html_content: "",
    };
    let status: string | null = null;
    let sentCount = 0;

    if (id !== "new") {
        const { data, error } = await db
            .from("campaigns")
            .select("id,name,subject_line,html_content,variable_values,status,total_recipients,total_opens,total_clicks")
            .eq("id", id)
            .maybeSingle();
        if (error || !data) {
            return (
                <div>
                    <EmailNav active="campaigns" />
                    <p className="font-sans text-sm text-red-400">Campaign not found.</p>
                </div>
            );
        }
        const vv = (data.variable_values ?? {}) as Record<string, unknown>;
        campaign = {
            id: data.id,
            name: data.name,
            subject_line: data.subject_line ?? "",
            preview_text: typeof vv.preview_text === "string" ? vv.preview_text : "",
            html_content: data.html_content ?? "",
        };
        status = data.status;

        const { count } = await db
            .from("sent_history")
            .select("id", { count: "exact", head: true })
            .eq("campaign_id", id);
        sentCount = count ?? 0;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="font-serif text-3xl tracking-tight">
                    {id === "new" ? "New campaign" : campaign.name}
                </h1>
                <Link href="/admin/email" className="font-sans text-xs text-white/50 hover:text-white">
                    Back to list
                </Link>
            </div>
            <EmailNav active="campaigns" />

            {status ? (
                <div className="mb-6 border border-white/10 bg-white/[0.03] px-4 py-3 font-sans text-xs text-white/60 flex gap-6">
                    <span>
                        Status: <span className="text-white">{status}</span>
                    </span>
                    <span>
                        Confirmed sends (sent_history): <span className="text-white">{sentCount}</span>
                    </span>
                </div>
            ) : null}

            <CampaignEditor campaign={campaign} action={saveCampaign} />
        </div>
    );
}
