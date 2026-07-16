import Image from "next/image"
import { Music, Sparkles, Bluetooth, Lightbulb } from "lucide-react"

const features = [
  {
    icon: Music,
    title: "88 Weighted Keys",
    description:
      "It feels like a real acoustic piano. The keys have weight and resistance, allowing for full emotional expression.",
  },
  {
    icon: Sparkles,
    title: "Pain-Free Geometry",
    description:
      "Designed to match the natural span of the human hand. Play longer practice sessions without fatigue.",
  },
  {
    icon: Bluetooth,
    title: "Pro Connectivity",
    description:
      "Bluetooth Audio & MIDI built-in. Connect to your iPad, computer, or wireless headphones instantly.",
  },
  {
    icon: Lightbulb,
    title: "Light-Up Keys",
    description:
      "LED lights above every key make learning songs fast and fun. Want a classic look? They toggle off completely.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="relative overflow-hidden bg-foreground">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28 lg:py-32">
        <div className="mb-16 max-w-2xl">
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-background/50">
            Key Features
          </p>
          <h2 className="mt-4 font-serif text-3xl leading-tight text-background md:text-4xl lg:text-5xl text-balance">
            Everything you need. Nothing you don{"'"}t.
          </h2>
        </div>

        <div className="grid gap-px bg-background/10 md:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-4 bg-foreground p-8 md:p-10 lg:p-12"
            >
              <feature.icon
                className="h-6 w-6 text-background/70"
                strokeWidth={1.5}
              />
              <h3 className="font-serif text-xl text-background md:text-2xl">
                {feature.title}
              </h3>
              <p className="font-sans text-sm leading-relaxed text-background/60 md:text-base">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
