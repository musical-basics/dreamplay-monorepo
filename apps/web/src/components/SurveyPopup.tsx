"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { subscribeToNewsletter } from "@/actions/email-actions";
import { trackEmailConversion } from "@/components/EmailTracker";
import { useAnalytics } from "@dreamplay/analytics/react";

type DreamPlayAnalyticsWindow = Window & {
    dreamplay?: {
        track?: (eventName: string, properties?: Record<string, unknown>) => void;
    };
};

/** Safe analytics wrapper — won't crash if tracker is blocked or hasn't loaded */
const trackPopup = (action: "yes" | "no", popupName: string) => {
    if (typeof window !== "undefined") {
        const dreamplay = (window as DreamPlayAnalyticsWindow).dreamplay;
        dreamplay?.track?.(`click_popup_${action}`, { popup: popupName });
    }
};

interface SurveyPopupProps {
    onClose: () => void;
}

type SurveyPage = "survey" | "email" | "success";

const STRUGGLE_OPTIONS = [
    { emoji: "🎹", label: "Hard to reach chords" },
    { emoji: "🎵", label: "Difficult passages (fast notes)" },
    { emoji: "😣", label: "Feeling strain due to hand size" },
    { emoji: "📖", label: "Reading Sheet Music" },
];

export default function SurveyPopup({ onClose }: SurveyPopupProps) {
    const analytics = useAnalytics();
    const [page, setPage] = useState<SurveyPage>("survey");
    const [selectedStruggle, setSelectedStruggle] = useState("");
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleSelectStruggle = (label: string) => {
        setSelectedStruggle(label);
        setPage("email");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg("");

        try {
            const tempSession =
                localStorage.getItem("dp_temp_session") || undefined;

            const res = await subscribeToNewsletter({
                email,
                first_name: "",
                tags: ["5% Off Survey Lead", `Struggle: ${selectedStruggle}`],
                temp_session_id: tempSession,
            });

            if (!res.success) {
                throw new Error(res.error || "Failed to subscribe");
            }

            localStorage.setItem("dp_v2_subscribed", "true");
            localStorage.setItem("dp_v2_survey_5off_seen", "true");
            localStorage.setItem("dp_user_email", email);
            if (res.id) localStorage.setItem("dp_subscriber_id", res.id);

            void analytics.track('email_signup', { source: 'survey_popup', email });
            trackEmailConversion("conversion_t1", window.location.pathname);
            trackPopup("yes", "survey_5off");

            setPage("success");
        } catch (error: unknown) {
            console.error(error);
            setErrorMsg(
                error instanceof Error && error.message
                    ? error.message
                    : "Something went wrong. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        trackPopup("no", "survey_5off");
        localStorage.setItem("dp_v2_survey_5off_seen", "true");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
            <div
                className="relative w-full max-w-md overflow-hidden shadow-2xl"
                style={{
                    borderRadius: "16px",
                    animation: "surveyPopupIn 0.35s cubic-bezier(0.16,1,0.3,1)",
                }}
            >
                {/* Gradient background */}
                <div
                    style={{
                        background:
                            "linear-gradient(180deg, #dbeafe 0%, #e8d5f5 50%, #f3e8ff 100%)",
                        minHeight: "100%",
                    }}
                >
                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="absolute right-4 top-4 z-10 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                        style={{
                            width: "32px",
                            height: "32px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "50%",
                            backgroundColor: "rgba(255,255,255,0.6)",
                        }}
                    >
                        <X size={18} />
                    </button>

                    {/* ── PAGE 1: Survey ── */}
                    {page === "survey" && (
                        <div style={{ padding: "48px 28px 36px" }}>
                            {/* Logo / brand */}
                            <div
                                style={{
                                    textAlign: "center",
                                    marginBottom: "8px",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    letterSpacing: "0.12em",
                                    color: "#64748b",
                                    textTransform: "uppercase",
                                }}
                            >
                                DreamPlay
                            </div>

                            {/* Headline */}
                            <h2
                                style={{
                                    textAlign: "center",
                                    fontSize: "clamp(32px, 8vw, 42px)",
                                    fontWeight: 800,
                                    lineHeight: 1.05,
                                    color: "#0f172a",
                                    margin: "0 0 4px",
                                }}
                            >
                                Unlock 5% OFF
                            </h2>
                            <p
                                style={{
                                    textAlign: "center",
                                    fontSize: "clamp(18px, 5vw, 22px)",
                                    fontWeight: 700,
                                    color: "#0f172a",
                                    margin: "0 0 16px",
                                }}
                            >
                                + FREE Gifts
                            </p>

                            {/* Subtext */}
                            <p
                                style={{
                                    textAlign: "center",
                                    fontSize: "14px",
                                    color: "#475569",
                                    margin: "0 0 28px",
                                    lineHeight: 1.5,
                                }}
                            >
                                To claim, please share what you struggle with on
                                the piano:
                            </p>

                            {/* Options */}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "12px",
                                }}
                            >
                                {STRUGGLE_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.label}
                                        onClick={() =>
                                            handleSelectStruggle(opt.label)
                                        }
                                        className="cursor-pointer"
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "10px",
                                            width: "100%",
                                            padding: "16px 20px",
                                            fontSize: "15px",
                                            fontWeight: 600,
                                            color: "#1e293b",
                                            background: "rgba(255,255,255,0.85)",
                                            border: "2px solid rgba(99,102,241,0.25)",
                                            borderRadius: "12px",
                                            transition: "all 0.2s ease",
                                            backdropFilter: "blur(4px)",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor =
                                                "#6366f1";
                                            e.currentTarget.style.background =
                                                "rgba(255,255,255,1)";
                                            e.currentTarget.style.transform =
                                                "translateY(-1px)";
                                            e.currentTarget.style.boxShadow =
                                                "0 4px 12px rgba(99,102,241,0.15)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor =
                                                "rgba(99,102,241,0.25)";
                                            e.currentTarget.style.background =
                                                "rgba(255,255,255,0.85)";
                                            e.currentTarget.style.transform =
                                                "translateY(0)";
                                            e.currentTarget.style.boxShadow =
                                                "none";
                                        }}
                                    >
                                        <span style={{ fontSize: "18px" }}>
                                            {opt.emoji}
                                        </span>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── PAGE 2: Email Capture ── */}
                    {page === "email" && (
                        <div style={{ padding: "48px 28px 36px" }}>
                            {/* Brand */}
                            <div
                                style={{
                                    textAlign: "center",
                                    marginBottom: "8px",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    letterSpacing: "0.12em",
                                    color: "#64748b",
                                    textTransform: "uppercase",
                                }}
                            >
                                DreamPlay
                            </div>

                            {/* Headline */}
                            <h2
                                style={{
                                    textAlign: "center",
                                    fontSize: "clamp(32px, 8vw, 42px)",
                                    fontWeight: 800,
                                    lineHeight: 1.05,
                                    color: "#0f172a",
                                    margin: "0 0 4px",
                                }}
                            >
                                Unlock 5% OFF
                            </h2>
                            <p
                                style={{
                                    textAlign: "center",
                                    fontSize: "clamp(18px, 5vw, 22px)",
                                    fontWeight: 700,
                                    color: "#0f172a",
                                    margin: "0 0 16px",
                                }}
                            >
                                + FREE Gifts
                            </p>

                            {/* Subtext */}
                            <p
                                style={{
                                    textAlign: "center",
                                    fontSize: "14px",
                                    color: "#475569",
                                    margin: "0 0 28px",
                                    lineHeight: 1.5,
                                }}
                            >
                                Add your email so we can send you your offer:
                            </p>

                            {/* Error */}
                            {errorMsg && (
                                <div
                                    style={{
                                        marginBottom: "16px",
                                        padding: "12px",
                                        border: "1px solid rgba(239,68,68,0.3)",
                                        backgroundColor: "rgba(239,68,68,0.08)",
                                        color: "#dc2626",
                                        fontSize: "13px",
                                        textAlign: "center",
                                        borderRadius: "8px",
                                    }}
                                >
                                    {errorMsg}
                                </div>
                            )}

                            {/* Form */}
                            <form
                                onSubmit={handleSubmit}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "14px",
                                }}
                            >
                                <input
                                    type="email"
                                    required
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "16px 20px",
                                        fontSize: "15px",
                                        border: "2px solid rgba(99,102,241,0.25)",
                                        borderRadius: "12px",
                                        background: "rgba(255,255,255,0.9)",
                                        color: "#1e293b",
                                        outline: "none",
                                        transition: "border-color 0.2s",
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor =
                                            "#6366f1";
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor =
                                            "rgba(99,102,241,0.25)";
                                    }}
                                />

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="cursor-pointer"
                                    style={{
                                        width: "100%",
                                        padding: "16px",
                                        fontSize: "16px",
                                        fontWeight: 700,
                                        color: "#fff",
                                        background:
                                            "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
                                        border: "none",
                                        borderRadius: "12px",
                                        transition: "all 0.2s",
                                        opacity: isLoading ? 0.7 : 1,
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isLoading) {
                                            e.currentTarget.style.transform =
                                                "translateY(-1px)";
                                            e.currentTarget.style.boxShadow =
                                                "0 4px 16px rgba(99,102,241,0.4)";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform =
                                            "translateY(0)";
                                        e.currentTarget.style.boxShadow =
                                            "none";
                                    }}
                                >
                                    {isLoading
                                        ? "Processing..."
                                        : "Get 5% OFF"}
                                </button>
                            </form>

                            {/* Privacy line */}
                            <p
                                style={{
                                    textAlign: "center",
                                    fontSize: "11px",
                                    color: "#94a3b8",
                                    marginTop: "16px",
                                    lineHeight: 1.5,
                                    fontStyle: "italic",
                                }}
                            >
                                By submitting your email, you agree to receiving
                                promotional content. You can unsubscribe at any
                                time.
                            </p>
                        </div>
                    )}

                    {/* ── PAGE 3: Success ── */}
                    {page === "success" && (
                        <div style={{ padding: "56px 28px 40px", textAlign: "center" }}>
                            {/* Brand */}
                            <div
                                style={{
                                    marginBottom: "8px",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    letterSpacing: "0.12em",
                                    color: "#64748b",
                                    textTransform: "uppercase",
                                }}
                            >
                                DreamPlay
                            </div>

                            {/* Success icon */}
                            <div
                                style={{
                                    width: "64px",
                                    height: "64px",
                                    borderRadius: "50%",
                                    background:
                                        "linear-gradient(135deg, #6366f1, #7c3aed)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    margin: "0 auto 20px",
                                    fontSize: "28px",
                                }}
                            >
                                ✓
                            </div>

                            <h3
                                style={{
                                    fontSize: "24px",
                                    fontWeight: 700,
                                    color: "#0f172a",
                                    margin: "0 0 12px",
                                }}
                            >
                                Check your inbox!
                            </h3>
                            <p
                                style={{
                                    fontSize: "14px",
                                    color: "#475569",
                                    lineHeight: 1.6,
                                    margin: "0 0 28px",
                                    maxWidth: "280px",
                                    marginLeft: "auto",
                                    marginRight: "auto",
                                }}
                            >
                                We just sent you an email with your exclusive 5%
                                discount code. Use it at checkout to save on
                                your DreamPlay keyboard!
                            </p>

                            <button
                                onClick={() => onClose()}
                                className="cursor-pointer"
                                style={{
                                    width: "100%",
                                    padding: "16px",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    color: "#6366f1",
                                    background: "rgba(255,255,255,0.8)",
                                    border: "2px solid rgba(99,102,241,0.25)",
                                    borderRadius: "12px",
                                    transition: "all 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor =
                                        "#6366f1";
                                    e.currentTarget.style.background =
                                        "rgba(255,255,255,1)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor =
                                        "rgba(99,102,241,0.25)";
                                    e.currentTarget.style.background =
                                        "rgba(255,255,255,0.8)";
                                }}
                            >
                                Continue Exploring
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Keyframe animation */}
            <style jsx>{`
                @keyframes surveyPopupIn {
                    0% {
                        opacity: 0;
                        transform: scale(0.92) translateY(16px);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
