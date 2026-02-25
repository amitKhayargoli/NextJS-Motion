"use client";

import { useEffect, useRef, useState } from "react";
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
  const { loading: authLoading, isAuthenticated } = useAuth();

  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);

  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const didRedirectRef = useRef(false);
  const shouldShowOnboarding = !loadingWorkspaces && workspaces.length === 0;

  // 0) if auth finished and not logged in -> go home (login modal)
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) router.replace("/");
  }, [authLoading, isAuthenticated, router]);

  // 1) fetch workspaces only when auth is ready AND logged in
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setLoadingWorkspaces(false);
      setWorkspaces([]);
      return;
    }

    let cancelled = false;

    const fetchWorkspaces = async () => {
      setLoadingWorkspaces(true);
      try {
        const res = await handleGetWorkspaces();
        if (cancelled) return;

        if (res?.success) setWorkspaces(res.data ?? []);
        else {
          console.error("Failed to fetch workspaces:", res?.message);
          setWorkspaces([]);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch workspaces:", err);
          setWorkspaces([]);
        }
      } finally {
        if (!cancelled) setLoadingWorkspaces(false);
      }
    };

    fetchWorkspaces();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated]);

  // 1.5) open onboarding modal when needed
  useEffect(() => {
    if (shouldShowOnboarding) setOnboardingOpen(true);
  }, [shouldShowOnboarding]);

  // 2) redirect once to last opened workspace or first workspace
  useEffect(() => {
    if (loadingWorkspaces) return;
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
  }, [loadingWorkspaces, workspaces, router]);

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

      {(authLoading || loadingWorkspaces) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="h-12 w-12 rounded-full border-4 border-[#d2ff89] border-t-transparent animate-spin" />
        </div>
      )}
    </>
  );
}
