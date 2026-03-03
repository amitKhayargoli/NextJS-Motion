import Navbar from "@/app/_components/Navbar";

export default function ProductPage() {
  return (
    <div className="min-h-screen bg-home-gradient text-white">
      <Navbar />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-10 pb-12 text-center">
        <div className="bg-[#003600]/20 backdrop-blur-md border border-[#375506] rounded-full w-fit mx-auto px-4 py-2 mb-6">
          <span className="text-white text-sm">What MotionAI can do</span>
        </div>
        <h1 className="text-6xl font-bold text-[#D2FF89] mb-5 leading-tight">
          Everything you need,
          <br />
          in one place
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Notes, transcription, AI summaries, and team collaboration.
          <br />
          All AI-native, all connected.
        </p>
      </section>

      {/* Stats bar */}
      <section className="max-w-4xl mx-auto px-6 mb-12">
        <div className="grid grid-cols-3 divide-x divide-[#375506] border border-[#375506] rounded-2xl overflow-hidden bg-[#003600]/20 backdrop-blur-md">
          {[
            { value: "6", label: "Core features" },
            { value: "1", label: "Unified platform" },
            { value: "AI", label: "Native from day one" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center py-6">
              <span className="text-3xl font-bold text-[#D2FF89]">
                {stat.value}
              </span>
              <span className="text-gray-400 text-sm mt-1">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Bento grid */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:auto-rows-[1fr]">
          {/* 01 */}
          <div className="md:col-span-2 h-full bg-[#003600]/20 backdrop-blur-md border border-[#375506] rounded-2xl p-8 hover:bg-[#003600]/40 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#70AA12]/20 border border-[#70AA12]/30 flex items-center justify-center mb-5">
                <span className="text-[#70AA12] font-bold text-sm">01</span>
              </div>
              <h3 className="text-[#D2FF89] font-bold text-xl mb-2">
                AI-Powered Note Taking
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Rich text editor with auto-save. Never lose a thought,
                everything is captured as you type.
              </p>
            </div>
          </div>

          {/* 02 */}
          <div className="h-full bg-[#70AA12]/10 backdrop-blur-md border border-[#70AA12]/40 rounded-2xl p-8 hover:bg-[#70AA12]/20 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#70AA12]/20 border border-[#70AA12]/30 flex items-center justify-center mb-5">
                <span className="text-[#70AA12] font-bold text-sm">02</span>
              </div>
              <h3 className="text-[#D2FF89] font-bold text-xl mb-2">
                Smart Summaries
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                One click. The AI condenses any note into a crisp summary.
              </p>
            </div>
          </div>

          {/* 03 */}
          <div className="h-full bg-[#003600]/20 backdrop-blur-md border border-[#375506] rounded-2xl p-8 hover:bg-[#003600]/40 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#70AA12]/20 border border-[#70AA12]/30 flex items-center justify-center mb-5">
                <span className="text-[#70AA12] font-bold text-sm">03</span>
              </div>
              <h3 className="text-[#D2FF89] font-bold text-xl mb-2">
                Audio Transcription
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Upload a recording. MotionAI transcribes it into a structured
                note instantly.
              </p>
            </div>
          </div>

          {/* 04 */}
          <div className="md:col-span-2 h-full bg-[#003600]/20 backdrop-blur-md border border-[#375506] rounded-2xl p-8 hover:bg-[#003600]/40 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#70AA12]/20 border border-[#70AA12]/30 flex items-center justify-center mb-5">
                <span className="text-[#70AA12] font-bold text-sm">04</span>
              </div>
              <h3 className="text-[#D2FF89] font-bold text-xl mb-2">
                RAG Chat
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Ask anything in natural language. The AI retrieves answers
                directly from your notes, not generic training data.
              </p>
            </div>
          </div>

          {/* 05 */}
          <div className="h-full bg-[#003600]/20 backdrop-blur-md border border-[#375506] rounded-2xl p-8 hover:bg-[#003600]/40 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#70AA12]/20 border border-[#70AA12]/30 flex items-center justify-center mb-5">
                <span className="text-[#70AA12] font-bold text-sm">05</span>
              </div>
              <h3 className="text-[#D2FF89] font-bold text-xl mb-2">
                Team Workspaces
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Shared spaces for your team. Invite collaborators and keep notes
                organised by project.
              </p>
            </div>
          </div>

          {/* 06 */}
          <div className="md:col-span-2 h-full bg-[#003600]/20 backdrop-blur-md border border-[#375506] rounded-2xl p-8 hover:bg-[#003600]/40 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#70AA12]/20 border border-[#70AA12]/30 flex items-center justify-center mb-5">
                <span className="text-[#70AA12] font-bold text-sm">06</span>
              </div>
              <h3 className="text-[#D2FF89] font-bold text-xl mb-2">
                Role-Based Access
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Owners control editing permissions. Editors can request elevated
                access and owners approve or deny from the workspace panel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#375506] py-10 text-center">
        <h2 className="text-3xl font-bold text-[#D2FF89] mb-4">
          Ready to get started?
        </h2>
        <p className="text-gray-400 mb-8">
          Join teams already using MotionAI to move faster.
        </p>
        <a
          href="/"
          className="bg-[#70AA12] hover:bg-[#5a8a0e] text-white font-semibold px-8 py-3 rounded-full transition-colors duration-200"
        >
          Get Started Free
        </a>
      </section>
    </div>
  );
}
