import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Mock data for your accessory lineup - using the "Point of View" copy strategy
const ACCESSORIES = [
  {
    id: "hydraulic-bench",
    name: "Premium Hydraulic Bench",
    price: "$239",
    status: "Ready to Ship",
    description: "An ergonomically calibrated hydraulic lift designed to align your posture perfectly with the keybed, eliminating lower-back fatigue during multi-hour practice sessions.",
    image: "/images/accessories/bench-placeholder.jpg", // Replace with your actual image path
    cta: "Shop Now",
  },
  {
    id: "studio-hoodie",
    name: "DreamPlay Heavyweight Hoodie",
    price: "$85",
    status: "Ready to Ship",
    description: "Ultra-thick 400gsm cotton engineered for warmth and freedom of movement. Because your flow state shouldn't be broken by a freezing cold studio.",
    image: "/images/accessories/hoodie-placeholder.jpg", 
    cta: "Shop Now",
  },
  {
    id: "signature-bear",
    name: "The Signature DreamPlay Bear",
    price: "$35",
    status: "Low Stock",
    description: "The legacy companion that started it all. A reminder on your desk that playing the piano is supposed to be joyful, not painful.",
    image: "/images/accessories/bear-placeholder.jpg", 
    cta: "Shop Now",
  },
  {
    id: "masterclass-access",
    name: "Lionel's Piano Masterclass",
    price: "$199",
    status: "Instant Delivery",
    description: "Lifetime access to the biomechanics, techniques, and practice frameworks required to safely unlock advanced Romantic repertoire.",
    image: "/images/accessories/masterclass-placeholder.jpg", 
    cta: "Get Access",
  }
];

export default function AccessoriesPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-32">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 mb-20 text-center">
        <h1 className="font-serif text-5xl md:text-7xl mb-6 tracking-tight">
          Complete the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Ecosystem</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto font-sans">
          The DreamPlay One Pro takes six months to hand-build. But you can upgrade your studio posture, workflow, and comfort today. 
        </p>
      </section>

      {/* Products Grid - The "Boring but Profitable" Layout */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-12 lg:gap-16">
          {ACCESSORIES.map((product) => (
            <div key={product.id} className="group flex flex-col">
              {/* Product Image Box */}
              <div className="relative aspect-[4/3] bg-zinc-900 rounded-2xl overflow-hidden mb-6">
                {/* Replace with next/image when you have the actual photos */}
                <div className="absolute inset-0 flex items-center justify-center text-zinc-600 font-sans">
                  [Image: {product.name}]
                </div>
                {/* Status Badge */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium tracking-wide border border-white/10">
                  {product.status}
                </div>
              </div>

              {/* Product Info */}
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-2xl font-serif text-gray-100">{product.name}</h2>
                <span className="text-xl font-sans text-gray-300">{product.price}</span>
              </div>
              
              <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-grow font-sans">
                {product.description}
              </p>

              {/* CTA Button */}
              <Link 
                href={`/shop/${product.id}`} // Placeholder: Will eventually link to Shopify
                className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-colors duration-300"
              >
                {product.cta}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
