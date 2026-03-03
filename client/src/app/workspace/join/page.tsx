import { Suspense } from "react";
import JoinWorkspaceContent from "./_components/JoinWorkspaceContent";

function JoinFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#131313] text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 rounded-full border-4 border-[#d2ff89] border-t-transparent animate-spin" />
        <p className="text-white/70 text-sm">Loading...</p>
      </div>
    </div>
  );
}

export default function JoinWorkspacePage() {
  return (
    <Suspense fallback={<JoinFallback />}>
      <JoinWorkspaceContent />
    </Suspense>
  );
}
