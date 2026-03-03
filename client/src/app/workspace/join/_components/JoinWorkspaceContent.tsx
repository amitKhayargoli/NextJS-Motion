"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { handleJoinWorkspace } from "@/lib/actions/workspace-action";
import { useAuth } from "../../../../../context/AuthContext";

const PENDING_INVITE_KEY = "motionai_pending_invite";

export default function JoinWorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading: authLoading, isAuthenticated } = useAuth();

  const inviteCode = (searchParams.get("inviteLink") || "").trim();
  const didRunRef = React.useRef(false);

  React.useEffect(() => {
    if (didRunRef.current) return;
    if (authLoading) return;

    if (!inviteCode) {
      didRunRef.current = true;
      toast.error("Invite code missing.");
      router.replace("/workspace");
      return;
    }

    // Not logged in -> store invite & go to "/" (login modal page)
    if (!isAuthenticated) {
      didRunRef.current = true;
      try {
        localStorage.setItem(PENDING_INVITE_KEY, inviteCode);
      } catch {}
      toast("Please login to join the workspace.");
      router.replace("/");
      return;
    }

    didRunRef.current = true;

    (async () => {
      try {
        toast.loading("Joining workspace...", { id: "join" });

        // IMPORTANT: send ONLY code, not full URL
        const res = await handleJoinWorkspace(inviteCode);

        if (!res?.success) {
          toast.error(res?.message || "Failed to join workspace", {
            id: "join",
          });
          router.replace("/workspace");
          return;
        }

        const wsId = res.data?.id || res.data?._id;
        if (!wsId) {
          toast.error("Joined but workspace id missing", { id: "join" });
          router.replace("/workspace");
          return;
        }

        try {
          localStorage.removeItem(PENDING_INVITE_KEY);
        } catch {}

        toast.success("Joined workspace!", { id: "join" });
        router.replace(`/workspace/${wsId}`);
      } catch (e: any) {
        toast.error(e?.message || "Failed to join workspace", { id: "join" });
        router.replace("/workspace");
      }
    })();
  }, [authLoading, isAuthenticated, inviteCode, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#131313] text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 rounded-full border-4 border-[#d2ff89] border-t-transparent animate-spin" />
        <p className="text-white/70 text-sm">Joining workspace...</p>
      </div>
    </div>
  );
}
