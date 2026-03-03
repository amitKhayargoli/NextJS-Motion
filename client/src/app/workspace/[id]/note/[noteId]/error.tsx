"use client";

import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="bg-[#003600]/20 backdrop-blur-md border border-[#375506] rounded-2xl p-10 max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto mb-5">
          <span className="text-2xl text-red-400">!</span>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-400 mb-6 text-sm leading-relaxed">
          {error.message || "An unexpected error occurred."}
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="bg-[#70AA12] hover:bg-[#5a8a0e] text-white font-semibold px-6 py-2.5 rounded-full transition-colors duration-200 text-sm"
          >
            Try again
          </button>
          <button
            onClick={() => router.back()}
            className="border border-[#375506] hover:bg-[#003600]/40 text-white font-semibold px-6 py-2.5 rounded-full transition-colors duration-200 text-sm"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
