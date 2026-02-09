"use client";

import { useEffect, useState, use } from "react"; // 1. Import 'use'
import { useRouter } from "next/navigation";
import { handleJoinWorkspace } from "@/lib/actions/workspace-action";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useAuth } from "../../../../../context/AuthContext";

interface JoinWorkspacePageProps {
  // 2. Update type to reflect that params is a Promise
  params: Promise<{ inviteLink: string }>;
}

export default function JoinWorkspacePage(props: JoinWorkspacePageProps) {
  // 3. Unwrap params using React.use()
  const params = use(props.params);
  const inviteLink = params.inviteLink;

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    const joinWorkspace = async () => {
      try {
        setLoading(true);
        setError(null);

        // 4. Now inviteLink is a standard string
        const res = await handleJoinWorkspace(inviteLink);

        if (res.success && res.data?.id) {
          router.replace(`/workspace/${res.data.id}`);
        } else {
          setError(res.message || "Failed to join workspace");
          setTimeout(() => router.replace("/workspace"), 3000);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Something went wrong");
        setTimeout(() => router.replace("/workspace"), 3000);
      } finally {
        setLoading(false);
      }
    };

    joinWorkspace();
  }, [user, authLoading, inviteLink, router]); // 5. Depend on inviteLink directly

  return (
    <div className="flex items-center justify-center h-screen w-full bg-[#131313] text-white flex-col gap-4">
      {loading && <DotLottieReact src="/Loading.lottie" loop autoplay />}
      {loading && <p className="text-lg">Joining workspace...</p>}

      {!loading && error && (
        <div className="text-center p-6 bg-[#1F1F1F] rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-2">Failed to join workspace</h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            className="px-4 py-2 bg-black text-white rounded-md"
            onClick={() => router.replace("/workspace")}
          >
            Go Back
          </button>
        </div>
      )}
    </div>
  );
}
