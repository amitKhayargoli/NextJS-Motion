import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="bg-[#003600]/20 backdrop-blur-md border border-[#375506] rounded-2xl p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-[#70AA12]/20 border border-[#70AA12] flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl font-bold text-[#D2FF89]">?</span>
        </div>

        <h1 className="text-5xl font-bold text-[#D2FF89] mb-2">404</h1>
        <h2 className="text-xl font-bold text-white mb-2">
          Workspace not found
        </h2>
        <p className="text-gray-400 mb-6 text-sm leading-relaxed">
          This workspace doesn&apos;t exist or you don&apos;t have access to it.
        </p>

        <Link
          href="/workspace"
          className="inline-block bg-[#70AA12] hover:bg-[#5a8a0e] text-white font-semibold px-6 py-2.5 rounded-full transition-colors duration-200 text-sm"
        >
          Go to workspaces
        </Link>
      </div>
    </div>
  );
}
