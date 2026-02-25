"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import { useAuth } from "../../../../context/AuthContext";

import { handleGetWorkspaces } from "@/lib/actions/workspace-action";
import { useWorkspaceStore } from "@/store/workspace.store";
import { useNotesStore } from "@/store/note.store";

import {
  ONBOARDING_KEYS,
  getUserId,
  isOnboardingDone,
  setOnboardingDone,
} from "@/lib/onboarding";
import NotesCommandPopup from "./NotesCommandPallete";

export default function WorkspaceShell({
  workspaceId,
  children,
}: {
  workspaceId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user } = useAuth();

  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const setActiveWorkspaceId = useWorkspaceStore((s) => s.setActiveWorkspaceId);

  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const userId = useMemo(() => getUserId(user), [user]);

  const effectiveWorkspaceId = String(activeWorkspaceId || workspaceId);

  const onOpenNote = useCallback(
    (noteId: string) => {
      router.push(`/workspace/${effectiveWorkspaceId}/note/${noteId}`);
    },
    [router, effectiveWorkspaceId],
  );

  // 1) Load workspaces when user exists
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    (async () => {
      setLoadingWorkspaces(true);
      try {
        const res = await handleGetWorkspaces();
        if (!cancelled && res?.success) setWorkspaces(res.data ?? []);
      } finally {
        if (!cancelled) setLoadingWorkspaces(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, setWorkspaces]);

  // 2) Set active workspace from URL (guarded)
  useEffect(() => {
    if (loadingWorkspaces) return;
    if (!workspaceId) return;

    const exists = workspaces.some((w) => String(w.id) === String(workspaceId));
    if (!exists && workspaces[0]?.id) {
      router.replace(`/workspace/${workspaces[0].id}`);
      return;
    }

    if (activeWorkspaceId !== workspaceId) {
      setActiveWorkspaceId(workspaceId);
    }
  }, [
    loadingWorkspaces,
    workspaceId,
    workspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    router,
  ]);

  // 3) Fetch notes on workspace change
  useEffect(() => {
    if (!activeWorkspaceId) return;
    useNotesStore.getState().fetchNotes(activeWorkspaceId);
  }, [activeWorkspaceId]);

  // 4) Show onboarding only for new users
  useEffect(() => {
    if (loadingWorkspaces) return;
    if (!userId) return;
    if (!activeWorkspaceId) return;

    const done = isOnboardingDone(ONBOARDING_KEYS.workspaceLanding, { userId });
    if (!done) setOnboardingOpen(true);
  }, [loadingWorkspaces, userId, activeWorkspaceId]);

  const finishOnboarding = () => {
    if (!userId) return;
    setOnboardingDone(ONBOARDING_KEYS.workspaceLanding, { userId });
    setOnboardingOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar loadingWorkspaces={loadingWorkspaces} />
      <main className="flex-1 h-screen overflow-hidden relative">
        {children}

        <NotesCommandPopup
          workspaceId={effectiveWorkspaceId}
          onOpenNote={onOpenNote}
        />

        {/*
        <WorkspaceLandingOnboarding
          open={onboardingOpen}
          onOpenChange={setOnboardingOpen}
          username={user?.username}
          onCreateFirstNote={() => finishOnboarding()}
        />
        */}
      </main>

      {loadingWorkspaces && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="h-12 w-12 rounded-full border-4 border-[#d2ff89] border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
}
