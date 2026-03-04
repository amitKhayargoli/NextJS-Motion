"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  handleCreateWorkspace,
  handleGetWorkspaces,
  handleJoinWorkspace,
} from "@/lib/actions/workspace-action";
import WorkspaceOnboardingModal from "./WorkspaceOnboardingModal";

const LAST_WORKSPACE_KEY = "lastOpenedWorkspaceId";

type Workspace = {
  id: string;
  name: string;
  [key: string]: any;
};

export default function WorkspaceRedirectClient({
  initialWorkspaces,
}: {
  initialWorkspaces: Workspace[];
}) {
  const router = useRouter();

  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const didRedirectRef = useRef(false);
  const shouldShowOnboarding = workspaces.length === 0;

  // Open onboarding when there are no workspaces
  useEffect(() => {
    if (shouldShowOnboarding) setOnboardingOpen(true);
  }, [shouldShowOnboarding]);

  // Redirect to last opened or first workspace
  useEffect(() => {
    if (didRedirectRef.current) return;
    if (workspaces.length === 0) return;

    didRedirectRef.current = true;

    let lastWorkspaceId: string | null = null;
    try {
      lastWorkspaceId = localStorage.getItem(LAST_WORKSPACE_KEY);
    } catch {}

    const lastWorkspace = lastWorkspaceId
      ? workspaces.find((w) => String(w.id) === String(lastWorkspaceId))
      : null;

    const targetWorkspace = lastWorkspace || workspaces[0];
    router.replace(`/workspace/${targetWorkspace.id}`);
  }, [workspaces, router]);

  const handleCreate = async (name: string) => {
    try {
      const res = await handleCreateWorkspace({ name });
      if (!res?.success)
        return alert(res?.message || "Failed to create workspace");

      const newWorkspace = res.data;

      try {
        localStorage.setItem(LAST_WORKSPACE_KEY, newWorkspace.id);
      } catch {}

      setOnboardingOpen(false);
      router.push(`/workspace/${newWorkspace.id}`);
    } catch (err: any) {
      alert(err?.message || "Failed to create workspace");
    }
  };

  const handleJoin = async (inviteLink: string) => {
    try {
      const res = await handleJoinWorkspace(inviteLink);
      if (!res?.success)
        return alert(res?.message || "Failed to join workspace");

      const updated = await handleGetWorkspaces();
      if (updated?.success) setWorkspaces(updated.data ?? []);

      try {
        localStorage.setItem(LAST_WORKSPACE_KEY, res.data.id);
      } catch {}

      setOnboardingOpen(false);
      router.push(`/workspace/${res.data.id}`);
    } catch (err: any) {
      alert(err?.message || "Failed to join workspace");
    }
  };

  return (
    <>
      <WorkspaceOnboardingModal
        onCreate={handleCreate}
        onJoin={handleJoin}
        open={onboardingOpen}
        onOpenChange={() => {}} // Prevent closing by clicking outside or pressing Esc
      />

      {workspaces.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="h-12 w-12 rounded-full border-4 border-[#d2ff89] border-t-transparent animate-spin" />
        </div>
      )}
    </>
  );
}
