import Navbar from "@/app/_components/Navbar";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for individuals getting started.",
    features: [
      "1 workspace",
      "Up to 20 notes",
      "Basic rich-text editor",
      "Community support",
    ],
    cta: "Start for free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "per month",
    description: "For power users who need AI features.",
    features: [
      "Unlimited workspaces",
      "Unlimited notes",
      "AI summaries",
      "Audio transcription",
      "RAG chat",
      "Priority support",
    ],
    cta: "Start Pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    description: "For large teams with advanced needs.",
    features: [
      "Everything in Pro",
      "SSO / SAML",
      "Advanced role management",
      "Audit logs",
      "Dedicated support",
      "SLA guarantees",
    ],
    cta: "Contact sales",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-home-gradient text-white">
      <Navbar />

      <section className="max-w-5xl mx-auto px-6 py-10 text-center">
        <div className="bg-[#003600]/20 backdrop-blur-md border border-[#375506] rounded-full w-fit mx-auto px-4 py-2 mb-6">
          <span className="text-white text-sm">
            Simple, transparent pricing
          </span>
        </div>
        <h1 className="text-5xl font-bold text-[#D2FF89] mb-6">
          Choose your plan
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Start free. Upgrade when you need more. No hidden fees.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl p-8 border flex flex-col transition-all duration-300 ${
                tier.highlighted
                  ? "bg-[#70AA12]/20 border-[#70AA12] scale-[1.02]"
                  : "bg-[#003600]/20 border-[#375506] hover:bg-[#003600]/40"
              }`}
            >
              <div className="mb-6">
                <h3 className="text-[#D2FF89] font-bold text-xl">
                  {tier.name}
                </h3>
                <div className="mt-3">
                  <span className="text-4xl font-bold text-white">
                    {tier.price}
                  </span>
                  <span className="text-gray-400 text-sm ml-2">
                    / {tier.period}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-3">{tier.description}</p>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {tier.features.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-center gap-2 text-sm text-gray-300"
                  >
                    <span className="text-[#70AA12]">✓</span>
                    {feat}
                  </li>
                ))}
              </ul>

              <a
                href="/"
                className={`text-center font-semibold px-6 py-3 rounded-full transition-colors duration-200 ${
                  tier.highlighted
                    ? "bg-[#70AA12] hover:bg-[#5a8a0e] text-white"
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-[#375506] py-10 text-center">
        <h2 className="text-2xl font-bold text-[#D2FF89] mb-3">
          Not sure which plan is right for you?
        </h2>
        <p className="text-gray-400 mb-8">
          Talk to us and we'll help you find the best fit.
        </p>
        <a
          href="mailto:khayargoliamit99@gmail.com"
          className="border border-[#375506] hover:bg-[#003600]/40 text-white font-semibold px-8 py-3 rounded-full transition-colors duration-200"
        >
          Contact us
        </a>
      </section>
    </div>
  );
}
