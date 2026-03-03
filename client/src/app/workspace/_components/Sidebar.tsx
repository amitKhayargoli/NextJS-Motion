"use client";

import React, { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import AccountMenu from "@/app/_components/AccountMenu";
import { useWorkspaceStore } from "@/store/workspace.store";
import { useNotesStore } from "@/store/note.store";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  FolderOpen,
  UserPlus,
  LogOut,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useShallow } from "zustand/react/shallow";
import { useUIStore } from "@/store/ui.store";
import InviteCollaboratorsModal from "./WorkspaceInviteModal";
import toast from "react-hot-toast";

const EMPTY_NOTES: { id: string; title: string }[] = [];

function getInitials(name?: string, email?: string) {
  const src = (name || email || "U").trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function Sidebar({
  loadingWorkspaces = false,
}: {
  loadingWorkspaces?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore(
    useShallow((s) => ({
      sidebarCollapsed: s.sidebarCollapsed,
      toggleSidebarCollapsed: s.toggleSidebarCollapsed,
    })),
  );

  const { workspaces, activeWorkspaceId, setActiveWorkspaceId } =
    useWorkspaceStore(
      useShallow((s) => ({
        workspaces: s.workspaces,
        activeWorkspaceId: s.activeWorkspaceId,
        setActiveWorkspaceId: s.setActiveWorkspaceId,
      })),
    );

  const { notesByWorkspaceId, loadingByWorkspace } = useNotesStore(
    useShallow((s) => ({
      notesByWorkspaceId: s.notesByWorkspaceId ?? {},
      loadingByWorkspace: s.loadingByWorkspace ?? {},
    })),
  );

  const activeWorkspace = useMemo(() => {
    if (!activeWorkspaceId) return null;
    return workspaces.find((w) => w.id === activeWorkspaceId) ?? null;
  }, [workspaces, activeWorkspaceId]);

  const notes = useMemo(() => {
    if (!activeWorkspaceId) return EMPTY_NOTES;
    return notesByWorkspaceId?.[activeWorkspaceId] ?? EMPTY_NOTES;
  }, [activeWorkspaceId, notesByWorkspaceId]);

  const loadingNotes = useMemo(() => {
    if (!activeWorkspaceId) return false;
    return !!loadingByWorkspace?.[activeWorkspaceId];
  }, [activeWorkspaceId, loadingByWorkspace]);

  const [collapsedWorkspaces, setCollapsedWorkspaces] = useState<
    Record<string, boolean>
  >({});

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteNoteId, setPendingDeleteNoteId] = useState<string | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);

  const activeNoteId = useMemo(() => {
    const m = pathname?.match(/\/workspace\/[^/]+\/note\/([^/]+)/);
    return m?.[1] ?? null;
  }, [pathname]);

  const toggleWorkspaceCollapse = (workspaceId: string) => {
    setCollapsedWorkspaces((prev) => ({
      ...prev,
      [workspaceId]: !prev[workspaceId],
    }));
  };

  const handleWorkspaceClick = (wsId: string) => {
    if (activeWorkspaceId !== wsId) setActiveWorkspaceId(wsId);

    // open that workspace notes list (Slack-like)
    setCollapsedWorkspaces((prev) => ({
      ...prev,
      [wsId]: true,
    }));

    router.push(`/workspace/${wsId}`);
  };

  const canDeleteNotes =
    activeWorkspace?.userRole === "OWNER" ||
    activeWorkspace?.userRole === "EDITOR";

  const requestDelete = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    setPendingDeleteNoteId(noteId);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteNoteId || !activeWorkspaceId) return;

    try {
      setDeleting(true);

      if (activeNoteId === pendingDeleteNoteId) {
        router.push(`/workspace/${activeWorkspaceId}`);
      }

      const res = await useNotesStore.getState().deleteNoteOptimistic({
        workspaceId: activeWorkspaceId,
        noteId: pendingDeleteNoteId,
      });

      if (!res.success) {
        toast.error(res.message || "Failed to delete note");
      }

      setConfirmOpen(false);
      setPendingDeleteNoteId(null);
    } finally {
      setDeleting(false);
    }
  };

  const pendingNoteTitle =
    pendingDeleteNoteId &&
    notes.find((n) => n.id === pendingDeleteNoteId)?.title;

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      router.push("/");
    } catch (e: any) {
      toast.error(e?.message || "Logout failed");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <div
        className={`bg-[#1F1F1F] text-white min-h-screen border-r border-white/10
        flex flex-col transition-[width] duration-200 ease-out
        ${sidebarCollapsed ? "w-[72px]" : "w-68"} `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-white/10">
          {!sidebarCollapsed ? (
            <div className="text-md font-semibold truncate">Workspaces</div>
          ) : (
            <div className="text-sm font-semibold"> </div>
          )}

          <button
            onClick={toggleSidebarCollapsed}
            className="p-2 rounded-md hover:bg-white/10 transition"
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen size={20} className="text-white/70" />
            ) : (
              <PanelLeftClose size={20} className="text-white/70" />
            )}
          </button>
        </div>

        {/* Workspaces list */}
        <div className={`py-3 ${sidebarCollapsed ? "px-2" : "px-2"} flex-1`}>
          {/* 🔥 WORKSPACE SKELETON */}
          {loadingWorkspaces ? (
            <div className="space-y-2 px-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2 rounded-md animate-pulse"
                >
                  {/* Icon skeleton */}
                  <div className="h-5 w-5 bg-white/10 rounded-md shrink-0" />

                  {!sidebarCollapsed && (
                    <div className="h-4 w-32 rounded-md bg-white/10" />
                  )}
                </div>
              ))}
            </div>
          ) : workspaces.length === 0 ? (
            <div className="px-3 text-sm text-white/40">No workspaces</div>
          ) : (
            workspaces.map((workspace) => {
              const isActiveWs = activeWorkspaceId === workspace.id;
              const wsOpen = !!collapsedWorkspaces[workspace.id];

              return (
                <div key={workspace.id} className="mb-1">
                  {/* Workspace Row */}
                  <div
                    onClick={() => handleWorkspaceClick(workspace.id)}
                    className={`flex items-center gap-3 cursor-pointer rounded-md p-2 
            transition-colors duration-150 ease-out hover:bg-white/10
            ${isActiveWs ? "bg-[#141414]" : ""}`}
                    title={sidebarCollapsed ? workspace.name : undefined}
                  >
                    <FolderOpen
                      size={20}
                      className={`text-white/70 shrink-0 ${
                        sidebarCollapsed ? "mx-auto" : ""
                      }`}
                    />

                    {!sidebarCollapsed && (
                      <>
                        <span className="truncate">{workspace.name}</span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWorkspaceCollapse(workspace.id);
                          }}
                          className="ml-auto p-1 rounded-md hover:bg-white/10 transition"
                          aria-label={
                            wsOpen ? "Collapse notes" : "Expand notes"
                          }
                          title={wsOpen ? "Collapse notes" : "Expand notes"}
                        >
                          <ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${
                              wsOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Notes under workspace */}
                  {!sidebarCollapsed && wsOpen && isActiveWs && (
                    <div className="ml-6 mt-2 flex flex-col gap-1">
                      {/* 🔥 NOTES SKELETON */}
                      {loadingNotes ? (
                        <div className="space-y-2">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div
                              key={i}
                              className="h-8 rounded-md bg-white/10 animate-pulse"
                            />
                          ))}
                        </div>
                      ) : notes.length === 0 ? (
                        <span className="text-gray-500 text-sm">No notes</span>
                      ) : (
                        notes.map((n) => {
                          const isActive = activeNoteId === n.id;

                          return (
                            <div
                              key={n.id}
                              onClick={() =>
                                router.push(
                                  `/workspace/${workspace.id}/note/${n.id}`,
                                )
                              }
                              className={`group flex items-center justify-between gap-2 cursor-pointer rounded-md px-3 py-2 
                      transition-all duration-150 ease-out hover:bg-white/10
                      ${
                        isActive
                          ? "bg-white/10 border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
                          : "border border-transparent"
                      }`}
                            >
                              <div className="min-w-0">
                                <div className="truncate text-sm">
                                  {n.title || "Untitled"}
                                </div>
                              </div>

                              {canDeleteNotes && (
                                <button
                                  onClick={(e) => requestDelete(e, n.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 rounded-md hover:bg-red-500/10"
                                  title="Delete note"
                                  aria-label="Delete note"
                                >
                                  <Trash2
                                    size={16}
                                    className="text-white/60 hover:text-red-400 transition-colors"
                                  />
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="px-2 pb-4 space-y-2">
          {/* Invite */}
          <div
            className={`flex items-center gap-2 cursor-pointer hover:bg-white/10 rounded-md py-2 transition-colors ${
              sidebarCollapsed ? "px-2 justify-center" : "px-8"
            }`}
            onClick={() => setInviteOpen(true)}
            title={sidebarCollapsed ? "Invite Collaborators" : undefined}
          >
            <UserPlus size={20} className="text-white/70 shrink-0" />
            {!sidebarCollapsed && (
              <span className="ml-2">Invite Collaborators</span>
            )}
          </div>

          <InviteCollaboratorsModal
            open={inviteOpen}
            onOpenChange={setInviteOpen}
            inviteLink={activeWorkspace?.inviteLink!}
          />

          {/* Profile row (opens modal) */}
          <div
            onClick={() => setIsProfileOpen(true)}
            className={`flex items-center gap-2 cursor-pointer hover:bg-white/10 rounded-md mt-1 transition-colors ${
              sidebarCollapsed ? "px-2 justify-center" : "px-4"
            }`}
            title={sidebarCollapsed ? (user?.email ?? "Profile") : undefined}
          >
            <div className="flex items-center gap-3 rounded-xl px-3 py-2">
              <Avatar className="h-9 w-9 shrink-0 overflow-hidden rounded-full">
                <AvatarImage
                  src={
                    user?.profilePicture
                      ? `${process.env.NEXT_PUBLIC_API_BASE}${user.profilePicture}`
                      : ""
                  }
                  className="aspect-square object-cover"
                />
                <AvatarFallback className="bg-white/10 text-white">
                  {getInitials(user?.username, user?.email)}
                </AvatarFallback>
              </Avatar>

              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {user?.username || "User"}
                  </div>
                  <div className="text-xs text-white/50 truncate">
                    {user?.email || "No email"}
                  </div>
                </div>
              )}

              {/* Keep AccountMenu mounted (modal only) */}
              <AccountMenu
                hideTrigger
                isModalOpen={isProfileOpen}
                setIsModalOpen={setIsProfileOpen}
              />
            </div>
          </div>

          {/*  Logout button */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className={`w-full flex items-center gap-2 hover:bg-white/10 rounded-md py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              sidebarCollapsed ? "px-2 justify-center" : "px-8"
            }`}
            title={sidebarCollapsed ? "Logout" : undefined}
          >
            <LogOut size={20} className="text-white/70 shrink-0" />
            {!sidebarCollapsed && (
              <span className="ml-2">
                {loggingOut ? "Logging out..." : "Logout"}
              </span>
            )}
          </button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-[#121212] text-white border border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete note?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              This will permanently delete{" "}
              <span className="text-white/90 font-medium">
                {pendingNoteTitle || "this note"}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-transparent border border-white/10 text-white hover:bg-white/10"
              disabled={deleting}
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-500/20 text-red-200 border border-red-400/30 hover:bg-red-500/30"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
