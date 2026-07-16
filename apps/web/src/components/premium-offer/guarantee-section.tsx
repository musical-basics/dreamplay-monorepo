"use client"

import { useState } from "react"
import { ShieldCheck, ArrowRight, X, CheckCircle2, Mail } from "lucide-react"
import { subscribeToNewsletter } from "@/actions/email-actions"
import { WAITLIST_OFFER_BODY, WAITLIST_OFFER_HEADLINE, WAITLIST_OFFER_TAGS, WAITLIST_OFFER_TERMS } from "@/lib/waitlist-offer"

export function GuaranteeSection() {
  const [showModal, setShowModal] = useState(false)
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg("")

    try {
      const tempSession = typeof window !== "undefined"
        ? localStorage.getItem("dp_temp_session") || undefined
        : undefined

      const res = await subscribeToNewsletter({
        email,
        first_name: "",
        tags: WAITLIST_OFFER_TAGS,
        temp_session_id: tempSession,
      })

      if (!res.success) {
        throw new Error(res.error || "Failed to subscribe")
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("dp_user_email", email)
        localStorage.setItem("dp_v2_subscribed", "true")
        if (res.id) localStorage.setItem("dp_subscriber_id", res.id)
      }

      setIsSubmitted(true)
    } catch (error) {
      console.error(error)
      setErrorMsg(error instanceof Error && error.message ? error.message : "Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setShowModal(false)
    setEmail("")
    setErrorMsg("")
    // Keep submitted state so re-opening shows success
  }

  const handleOpen = () => {
    setShowModal(true)
    setIsSubmitted(false)
  }

  return (
    <>
      <section id="guarantee" className="relative overflow-hidden bg-background">
        <div className="mx-auto max-w-4xl px-6 py-20 md:py-28 lg:py-32">
          <div className="flex flex-col items-center text-center">
            <ShieldCheck
              className="h-10 w-10 text-foreground/80 md:h-12 md:w-12"
              strokeWidth={1}
            />
            <h2 className="mt-6 font-serif text-3xl leading-tight text-foreground md:text-4xl lg:text-5xl text-balance">
              The {'"'}No-Risk{'"'} Guarantee
            </h2>
            <p className="mt-8 max-w-2xl font-sans text-sm leading-relaxed text-muted-foreground md:text-base">
              Your pre-order is held in a separate account until production
              begins. If we do not hit our production minimums to maintain our
              quality standards, you get a 100% refund immediately.
            </p>
            <p className="mt-6 max-w-xl font-serif text-lg italic text-foreground md:text-xl text-balance">
              You either get the piano of your dreams, or you get your money back.
              You risk nothing.
            </p>

            <div className="mt-6 max-w-xl font-sans text-sm leading-relaxed text-muted-foreground">
              <p>
                We are working overtime to make sure you get your DreamPlay One
                within the estimated time frame. If we cannot hit the deadline, you
                have the option of getting 100% of your money back, or keeping your
                reservation spot.
              </p>
            </div>

            <div className="mt-12 flex flex-col gap-4 sm:flex-row">
              <a
                href="/customize"
                className="group flex items-center justify-center gap-2 border border-foreground bg-foreground px-8 py-4 font-sans text-xs uppercase tracking-widest text-background transition-colors hover:bg-foreground/90"
              >
                Reserve Now
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </a>
              <button
                onClick={handleOpen}
                className="group flex items-center justify-center gap-2 border border-foreground px-8 py-4 font-sans text-xs uppercase tracking-widest text-foreground transition-colors hover:bg-foreground hover:text-background cursor-pointer"
              >
                Join the Waitlist
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist Email Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="relative w-full max-w-md bg-[#050505] border border-white/10 rounded-none shadow-2xl p-8 md:p-10 animate-in fade-in zoom-in-95 duration-300">
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            {!isSubmitted ? (
              <>
                <div className="mb-8 text-center">
                  <div className="mx-auto bg-white/5 border border-white/10 w-14 h-14 rounded-none flex items-center justify-center mb-6">
                    <Mail className="text-white" size={24} strokeWidth={1.5} />
                  </div>
                  <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-3">
                    DreamPlay Waitlist
                  </p>
                  <h2 className="text-2xl md:text-3xl font-serif text-white tracking-tight leading-tight mb-4">
                    {WAITLIST_OFFER_HEADLINE}
                  </h2>
                  <p className="text-white/60 font-sans text-sm leading-relaxed">
                    {WAITLIST_OFFER_BODY}
                  </p>
                </div>

                {errorMsg && (
                  <div className="mb-4 p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-sans text-center">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    className="w-full px-4 py-4 rounded-none border border-white/20 bg-transparent placeholder-white/40 text-white focus:ring-1 focus:ring-white focus:border-white outline-none transition-all font-sans text-sm"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-white text-black font-sans text-xs uppercase tracking-widest font-bold py-4 rounded-none hover:bg-white/90 transition-colors disabled:opacity-70 cursor-pointer"
                  >
                    {isLoading ? "Processing..." : "Join the Waitlist"}
                  </button>
                  <p className="text-[10px] text-center text-white/40 uppercase tracking-widest mt-2">
                    No spam. Unsubscribe anytime.
                  </p>
                  <p className="text-[10px] text-center text-white/35 leading-relaxed mt-3">
                    {WAITLIST_OFFER_TERMS}
                  </p>
                </form>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="mx-auto bg-white border border-white/20 w-16 h-16 rounded-none flex items-center justify-center mb-6">
                  <CheckCircle2 className="text-black" size={32} strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-serif text-white mb-3">
                  You&apos;re on the list!
                </h3>
                <p className="text-white/60 font-sans text-sm mb-8 max-w-xs mx-auto leading-relaxed">
                  We&apos;ll email production updates,
                  preorder availability, and launch details.
                </p>
                <button
                  onClick={handleClose}
                  className="bg-transparent border border-white/30 text-white font-sans text-xs uppercase tracking-widest font-bold py-4 px-8 w-full rounded-none hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Continue Exploring
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
