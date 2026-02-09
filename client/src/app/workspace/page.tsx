"use client";

import { useEffect, useState } from "react";
import {
  handleGetWorkspaces,
  handleCreateWorkspace,
  handleJoinWorkspace,
} from "@/lib/actions/workspace-action";

import { useRouter } from "next/navigation";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useAuth } from "../../../context/AuthContext";
import WorkspaceOnboardingModal from "./_components/WorkspaceOnboardingModal";

export default function Page() {
  const router = useRouter();
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);

  const shouldShowOnboarding = !loadingWorkspaces && workspaces.length === 0;

  // Fetch user workspaces
  useEffect(() => {
    if (!user) return;

    const fetchWorkspaces = async () => {
      setLoadingWorkspaces(true);
      try {
        const res = await handleGetWorkspaces();
        if (res.success) setWorkspaces(res.data);
        else console.error("Failed to fetch workspaces:", res.message);
      } catch (err) {
        console.error("Failed to fetch workspaces:", err);
      } finally {
        setLoadingWorkspaces(false);
      }
    };

    fetchWorkspaces();
  }, [user]);

  // Redirect if the workspaces exist
  useEffect(() => {
    if (loadingWorkspaces) return;
    console.log("workspaces: " + workspaces);
    if (workspaces.length > 0) {
      router.replace(`/workspace/${workspaces[0].id}`);
    }
  }, [loadingWorkspaces, workspaces, router]);

  const handleCreate = async (name: string) => {
    try {
      const res = await handleCreateWorkspace({ name });
      if (res.success) {
        const newWorkspace = res.data;

        // Redirect to the new workspace page
        router.push(`/workspace/${newWorkspace.id}`);
      } else {
        alert(res.message || "Failed to create workspace");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Join workspace handler
  const handleJoin = async (inviteLink: string) => {
    try {
      const res = await handleJoinWorkspace(inviteLink);
      if (res.success) {
        const updated = await handleGetWorkspaces();
        if (updated.success) setWorkspaces(updated.data);
      } else alert(res.message || "Failed to join workspace");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <>
      {shouldShowOnboarding && (
        <WorkspaceOnboardingModal onCreate={handleCreate} onJoin={handleJoin} />
      )}

      {loadingWorkspaces && (
        <DotLottieReact src="/Loading.lottie" loop autoplay />
      )}
    </>
  );
}
