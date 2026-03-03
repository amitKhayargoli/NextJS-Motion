import Navbar from "@/app/_components/Navbar";

const steps = [
  {
    number: "01",
    title: "Create your account",
    description:
      "Click Get Started, fill in your email, username, and password, then hit Sign Up.",
    tips: ["Already registered? Use Sign In instead."],
  },
  {
    number: "02",
    title: "Create or join a workspace",
    description:
      "On first login an onboarding dialog appears , create a new workspace or paste an invite code to join an existing one.",
    tips: [
      "Owners control roles and access.",
      "You can belong to multiple workspaces.",
    ],
  },
  {
    number: "03",
    title: "Create your first note",
    description:
      "Hit CTRL+K for New Note in the workspace page, give it a title, and start writing.",
    tips: [
      "Notes auto-save as you type.",
      "VIEWERs can read but not edit notes.",
    ],
  },
  {
    number: "04",
    title: "Format with the rich text editor",
    description:
      "Use the Quill toolbar to apply bold, headings, lists, links, and more.",
    tips: [
      "H1/H2 headings help structure long notes.",
      "Lists are great for action items.",
    ],
  },
  {
    number: "05",
    title: "Transcribe an audio file",
    description:
      "Upload a recording from the mobile app, MotionAI transcribes it and saves it as a new note.",
    tips: [
      "Transcription runs in the background.",
      "The note is fully editable after processing.",
    ],
  },
  {
    number: "06",
    title: "Summarise a note with AI",
    description:
      "Open a note and click Summarise , the AI generates a short summary beneath the title.",
    tips: [
      "Summaries are visible to all workspace members.",
      "You can re-summarise after editing.",
    ],
  },
  {
    number: "07",
    title: "Ask questions with RAG Chat",
    description:
      "Open the Chat panel and ask anything , the AI answers directly from your notes.",
    tips: [
      "Answers are grounded in your notes only.",
      "Each workspace has its own chat thread.",
    ],
  },
  {
    number: "08",
    title: "Invite teammates",
    description:
      "Copy your workspace invite code and share it , teammates paste it in Join Workspace to get added.",
    tips: [
      "New members join as EDITOR by default.",
      "Roles can be changed any time.",
    ],
  },
  {
    number: "09",
    title: "Manage roles and access",
    description:
      "Owners open Manage Roles to change member roles, remove members, or approve access requests.",
    tips: [
      "VIEWERs can request edit access.",
      "Role changes take effect immediately.",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-home-gradient text-white">
      <Navbar />

      <section className="max-w-3xl mx-auto px-6 py-10 text-center">
        <div className="bg-[#003600]/20 backdrop-blur-md border border-[#375506] rounded-full w-fit mx-auto px-4 py-2 mb-6">
          <span className="text-white text-sm">Full walkthrough</span>
        </div>
        <h1 className="text-5xl font-bold text-[#D2FF89] mb-5">How it Works</h1>
        <p className="text-gray-400 text-lg leading-relaxed">
          A complete step-by-step guide from signing up to collaborating with
          your team using AI-powered notes, transcription, and chat.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-24">
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-px bg-[#375506]" />

          <div className="space-y-10">
            {steps.map((step) => (
              <div key={step.number} className="relative flex gap-8">
                <div className="relative z-10 flex-shrink-0 w-16 h-16 rounded-full bg-[#003600] border-2 border-[#375506] flex items-center justify-center">
                  <span className="text-[#70AA12] font-bold text-sm">
                    {step.number}
                  </span>
                </div>

                <div className="flex-1 pb-2">
                  <div className="bg-[#003600]/20 backdrop-blur-md border border-[#375506] rounded-2xl p-6 hover:bg-[#003600]/40 transition-all duration-300">
                    <h3 className="text-[#D2FF89] font-bold text-xl mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed mb-4">
                      {step.description}
                    </p>

                    {step.tips.length > 0 && (
                      <div className="border-t border-[#375506] pt-4 mt-4">
                        <p className="text-[#70AA12] text-xs font-semibold uppercase tracking-wide mb-2">
                          Tips
                        </p>
                        <ul className="space-y-1">
                          {step.tips.map((tip) => (
                            <li
                              key={tip}
                              className="flex items-start gap-2 text-sm text-gray-400"
                            >
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#375506] py-16 text-center">
        <h2 className="text-2xl font-bold text-[#D2FF89] mb-4">
          Ready to try it yourself?
        </h2>
        <p className="text-gray-400 mb-8">
          Sign up for free and go through the whole flow in under 5 minutes.
        </p>
        <a
          href="/"
          className="bg-[#393f39] hover:bg-[#5a8a0e] text-white font-semibold px-8 py-3 rounded-full transition-colors duration-200"
        >
          Get Started Free
        </a>
      </section>
    </div>
  );
}
