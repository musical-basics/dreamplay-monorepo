import {
  CircleDot, Music, Radio,
  Cpu, Volume2, Monitor, PianoIcon,
  Headphones, Bluetooth, Lightbulb
} from "lucide-react"

function MetronomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="27" width="16" height="2" rx="0.5" fill="currentColor" />
      <path d="M11 27L14 8H18L21 27" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
      <rect x="13" y="7" width="6" height="3" rx="1" fill="currentColor" />
      <line x1="16" y1="24" x2="11" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="10" r="2" fill="currentColor" />
    </svg>
  )
}

function PianoKeysIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="28" height="24" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="8" y="4" width="1" height="24" fill="currentColor" opacity="0.3" />
      <rect x="15.5" y="4" width="1" height="24" fill="currentColor" opacity="0.3" />
      <rect x="23" y="4" width="1" height="24" fill="currentColor" opacity="0.3" />
      <rect x="6" y="4" width="4" height="14" rx="0.5" fill="currentColor" />
      <rect x="14" y="4" width="4" height="14" rx="0.5" fill="currentColor" />
      <rect x="22" y="4" width="4" height="14" rx="0.5" fill="currentColor" />
    </svg>
  )
}

const features = [
  { icon: MetronomeIcon, label: "Built-in Metronome" },
  { icon: CircleDot, label: "Recording & Playback" },
  { icon: Music, label: "256-note Polyphony" },
  { icon: Radio, label: "Dual-Sensor Velocity Keys" },
  { icon: Cpu, label: "MIDI Sequencing" },
  { icon: Volume2, label: "18 Essential Presets" },
  { icon: Monitor, label: "Backlit LCD Screen" },
  { icon: PianoIcon, label: "Grand Piano Sound" },
  { icon: Headphones, label: "High-fidelity Speakers and Headphone Audio" },
  { icon: PianoKeysIcon, label: "88 Graded, Weighted Keys" },
  { icon: Bluetooth, label: "Bluetooth Connectivity" },
  { icon: Lightbulb, label: "LED Lighting For Every Key" },
]

export function FeaturesSection() {
  return (
    <section id="features" className="relative">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-28 lg:py-32">
        <div className="mb-16 text-center">
          <h2 className="font-sans text-3xl leading-tight text-white md:text-4xl lg:text-5xl text-balance">
            Everything You Need, Built In
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-y-12 gap-x-6 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.label}
              className="flex flex-col items-center gap-4 text-center"
            >
              <feature.icon
                className="h-8 w-8 text-white"
                strokeWidth={1.5}
              />
              <p className="font-sans text-sm font-semibold text-white/90 md:text-base max-w-[180px]">
                {feature.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
