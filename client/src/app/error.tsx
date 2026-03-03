"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-home-gradient text-white flex items-center justify-center px-6">
      <div className="bg-[#003600]/20 backdrop-blur-md border border-[#375506] rounded-2xl p-12 max-w-lg w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl text-red-400">!</span>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-400 mb-8 text-sm leading-relaxed">
          {error.message || "An unexpected error occurred."}
        </p>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="bg-[#70AA12] hover:bg-[#5a8a0e] text-white font-semibold px-8 py-3 rounded-full transition-colors duration-200"
          >
            Try again
          </button>
          <Link
            href="/"
            className="border border-[#375506] hover:bg-[#003600]/40 text-white font-semibold px-8 py-3 rounded-full transition-colors duration-200"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
