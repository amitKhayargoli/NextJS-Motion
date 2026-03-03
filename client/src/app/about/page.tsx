import Navbar from "@/app/_components/Navbar";

const values = [
  {
    emoji: "🧠",
    title: "AI-first",
    description:
      "We build every feature with AI at the core, not as an afterthought.",
  },
  {
    emoji: "🤝",
    title: "Collaboration",
    description:
      "The best ideas emerge from teams. We make it easy for people to think together.",
  },
  {
    emoji: "🔓",
    title: "Transparency",
    description:
      "Open source, clear pricing, no dark patterns. We say what we mean.",
  },
  {
    emoji: "🚀",
    title: "Speed",
    description:
      "Fast product, fast iteration. We ship, learn, and improve constantly.",
  },
];

const team = [
  { initials: "AM", name: "Amit", role: "Founder & Full-Stack Engineer" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-home-gradient text-white">
      <Navbar />

      <section className="max-w-4xl mx-auto px-6 py-10 text-center">
        <div className="bg-[#003600]/20 backdrop-blur-md border border-[#375506] rounded-full w-fit mx-auto px-4 py-2 mb-6">
          <span className="text-white text-sm">Our story</span>
        </div>
        <h1 className="text-5xl font-bold text-[#D2FF89] mb-6">
          About MotionAI
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
          MotionAI was built out of frustration with fragmented productivity
          tools, one app for notes, another for meetings, another for chat. We
          believe a single, AI-native platform should handle all of it.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-[#003600]/20 backdrop-blur-md border border-[#375506] rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl font-bold text-[#D2FF89] mb-4">
            Our mission
          </h2>
          <p className="text-gray-300 text-lg leading-relaxed">
            To give every individual and team a single place to capture,
            organise, and understand their knowledge , powered by AI that works
            quietly in the background, so humans can focus on what matters.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">
          What we value
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {values.map((v) => (
            <div
              key={v.title}
              className="bg-[#003600]/20 backdrop-blur-md border border-[#375506] rounded-2xl p-6 hover:bg-[#003600]/40 transition-all duration-300 flex gap-4"
            >
              <span className="text-3xl">{v.emoji}</span>
              <div>
                <h3 className="text-[#D2FF89] font-semibold mb-1">{v.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {v.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">Team</h2>
        <div className="flex flex-wrap justify-center gap-6">
          {team.map((member) => (
            <div
              key={member.name}
              className="bg-[#003600]/20 backdrop-blur-md border border-[#375506] rounded-2xl p-6 flex flex-col items-center gap-3 w-52"
            >
              <div className="w-16 h-16 rounded-full bg-[#70AA12]/30 border border-[#70AA12] flex items-center justify-center text-[#D2FF89] font-bold text-xl">
                {member.initials}
              </div>
              <div className="text-center">
                <p className="text-white font-semibold">{member.name}</p>
                <p className="text-gray-400 text-xs mt-1">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-[#375506] py-10 text-center">
        <h2 className="text-2xl font-bold text-[#D2FF89] mb-4">
          Want to work with us?
        </h2>
        <p className="text-gray-400 mb-8">
          We're always looking for people who want to build the future of
          productivity.
        </p>
        <a
          href="mailto:khayargoliamit99@gmail.com"
          className="border border-[#375506] hover:bg-[#003600]/40 text-white font-semibold px-8 py-3 rounded-full transition-colors duration-200"
        >
          Get in touch
        </a>
      </section>
    </div>
  );
}
