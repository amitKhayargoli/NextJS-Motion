"use client";

import { useEffect, useState } from "react";
import {
  handleGetWorkspaces,
  handleCreateWorkspace,
  handleJoinWorkspace,
} from "@/lib/actions/workspace-action";

import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import WorkspaceOnboardingModal from "./_components/WorkspaceOnboardingModal";

const LAST_WORKSPACE_KEY = "lastOpenedWorkspaceId";

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

  // Redirect to last opened workspace or first workspace
  useEffect(() => {
    if (loadingWorkspaces || workspaces.length === 0) return;

    const lastWorkspaceId = localStorage.getItem(LAST_WORKSPACE_KEY);

    const lastWorkspace = lastWorkspaceId
      ? workspaces.find((w) => w.id === lastWorkspaceId)
      : null;

    const targetWorkspace = lastWorkspace || workspaces[0];

    router.replace(`/workspace/${targetWorkspace.id}`);
  }, [loadingWorkspaces, workspaces, router]);

  const handleCreate = async (name: string) => {
    try {
      const res = await handleCreateWorkspace({ name });
      if (res.success) {
        const newWorkspace = res.data;

        localStorage.setItem(LAST_WORKSPACE_KEY, newWorkspace.id);
        router.push(`/workspace/${newWorkspace.id}`);
      } else {
        alert(res.message || "Failed to create workspace");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleJoin = async (inviteLink: string) => {
    try {
      const res = await handleJoinWorkspace(inviteLink);

      if (res.success) {
        const updated = await handleGetWorkspaces();
        if (updated.success) {
          setWorkspaces(updated.data);

          localStorage.setItem(LAST_WORKSPACE_KEY, res.data.id);
          router.push(`/workspace/${res.data.id}`);
        }
      } else {
        alert(res.message || "Failed to join workspace");
      }
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="h-12 w-12 rounded-full border-4 border-[#d2ff89] border-t-transparent animate-spin" />
        </div>
      )}
    </>
  );
}
