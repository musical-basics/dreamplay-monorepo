export function SocialProofBar() {
  return (
    <div className="bg-foreground">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-4 px-6 py-5 sm:gap-8 md:gap-12">
        <Stat value="$124,000+" label="Reserved" />
        <Divider />
        <Stat value="208" label="Backers" />
        <Divider />
        <Stat value="Batch 1" label="Aug 2026" />
        <Divider />
        <Stat value="100%" label="Refundable" />
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="font-serif text-xl text-background md:text-2xl">
        {value}
      </span>
      <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-background/40 md:text-xs">
        {label}
      </span>
    </div>
  )
}

function Divider() {
  return (
    <span
      className="hidden h-8 w-px bg-background/10 sm:block"
      aria-hidden="true"
    />
  )
}
