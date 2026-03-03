"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { Search, MessageSquarePlus, Plus } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { handleCreateRagThread } from "@/lib/actions/rag-action";
import { useNotesStore } from "@/store/note.store";

import {
  handleCreateWorkspace,
  handleGetWorkspaces,
  handleJoinWorkspace,
} from "@/lib/actions/workspace-action";

import WorkspaceOnboardingModal from "../_components/WorkspaceOnboardingModal";

type NoteCard = {
  id: string;
  title: string;
  updatedAt?: string | Date;
  type?: string;
  status?: string;
};

const EMPTY_NOTES: NoteCard[] = [];

function formatDate(d?: string | Date) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return "";
  }
}

const LAST_WORKSPACE_KEY = "lastOpenedWorkspaceId";

export default function WorkspaceHomePage() {
  const router = useRouter();
  const params = useParams();

  const workspaceId = React.useMemo(() => {
    const raw = params?.id;
    return Array.isArray(raw) ? raw[0] : (raw as string | undefined);
  }, [params]);

  const { notesByWorkspaceId, loadingByWorkspace } = useNotesStore(
    useShallow((s) => ({
      notesByWorkspaceId: s.notesByWorkspaceId ?? {},
      loadingByWorkspace: s.loadingByWorkspace ?? {},
    })),
  );

  const notes = React.useMemo(() => {
    if (!workspaceId) return EMPTY_NOTES;
    return (notesByWorkspaceId?.[workspaceId] ?? EMPTY_NOTES) as NoteCard[];
  }, [workspaceId, notesByWorkspaceId]);

  const loading = React.useMemo(() => {
    if (!workspaceId) return false;
    return !!loadingByWorkspace?.[workspaceId];
  }, [workspaceId, loadingByWorkspace]);

  const [query, setQuery] = React.useState("");

  // chat box
  const [chatText, setChatText] = React.useState("");
  const [creatingChat, setCreatingChat] = React.useState(false);

  const [onboardingOpen, setOnboardingOpen] = React.useState(false);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => (n.title ?? "").toLowerCase().includes(q));
  }, [notes, query]);

  const openNote = (noteId: string) => {
    if (!workspaceId) return;
    router.push(`/workspace/${workspaceId}/note/${noteId}`);
  };

  const goToChat = () => {
    if (!workspaceId) return;
    router.push(`/workspace/${workspaceId}/chat`);
  };

  const startNewChat = async () => {
    if (!workspaceId) return;
    if (creatingChat) return;

    const firstMsg = chatText.trim();
    setCreatingChat(true);

    try {
      const threadRes = await handleCreateRagThread({
        workspaceId,
        title: firstMsg ? firstMsg.slice(0, 40) : "New chat",
      });

      if (!threadRes?.success) {
        alert(threadRes?.message || "Failed to create chat");
        return;
      }

      const threadId = threadRes.data?.id || threadRes.data?._id;
      if (!threadId) {
        alert("Thread created but id is missing");
        return;
      }

      const url = firstMsg
        ? `/workspace/${workspaceId}/chat?q=${encodeURIComponent(firstMsg)}`
        : `/workspace/${workspaceId}/chat`;

      setChatText("");
      router.push(url);
    } finally {
      setCreatingChat(false);
    }
  };

  const onCreateWorkspace = async (name: string) => {
    const res = await handleCreateWorkspace({ name });
    if (!res?.success)
      throw new Error(res?.message || "Failed to create workspace");

    const id = res.data?.id;
    if (!id) throw new Error("Workspace id missing");

    try {
      localStorage.setItem(LAST_WORKSPACE_KEY, String(id));
    } catch {}

    setOnboardingOpen(false);
    router.push(`/workspace/${id}`);
  };

  const onJoinWorkspace = async (inviteCodeOrLink: string) => {
    const res = await handleJoinWorkspace(inviteCodeOrLink);
    if (!res?.success)
      throw new Error(res?.message || "Failed to join workspace");

    const id = res.data?.id;
    if (!id) throw new Error("Workspace id missing");

    // optional refresh
    await handleGetWorkspaces().catch(() => {});

    try {
      localStorage.setItem(LAST_WORKSPACE_KEY, String(id));
    } catch {}

    setOnboardingOpen(false);
    router.push(`/workspace/${id}`);
  };

  if (!workspaceId) {
    return <div className="p-6 text-white/60">Loading workspace…</div>;
  }

  return (
    <>
      <WorkspaceOnboardingModal
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        onCreate={onCreateWorkspace}
        onJoin={onJoinWorkspace}
      />

      <div className="h-full flex flex-col bg-[#121212] text-white">
        {/* Top header */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold">Workspace</h1>
              <p className="text-sm text-white/60 mt-1">
                Select a note from below, or create a new one (⌘K).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setOnboardingOpen(true)}
                className="rounded-xl border border-white/10 bg-black/20 hover:bg-white/5 transition px-3 py-2 text-sm flex items-center gap-2"
                title="Create / Join Workspace"
              >
                <Plus size={16} className="text-white/70" />
                Workspace
              </button>

              {/* Go to chat */}
              <button
                onClick={goToChat}
                className="rounded-xl border border-white/10 bg-black/20 hover:bg-white/5 transition px-3 py-2 text-sm"
              >
                Mindspace Chat 🤖
              </button>

              {/* Search (desktop) */}
              <div className="hidden sm:flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 w-[320px]">
                <Search size={16} className="text-white/50" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search notes..."
                  className="bg-transparent outline-none text-sm w-full placeholder:text-white/40"
                />
              </div>
            </div>
          </div>

          {/* Mobile search */}
          <div className="sm:hidden mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <Search size={16} className="text-white/50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes..."
              className="bg-transparent outline-none text-sm w-full placeholder:text-white/40"
            />
          </div>
        </div>

        {/* Notes grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="text-sm text-white/60">Loading notes…</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-base font-medium">No notes found</p>
              <p className="text-sm text-white/60 mt-1">
                Create a note using ⌘K or try a different search.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openNote(n.id)}
                  className="text-left rounded-2xl border border-white/10 bg-black/20 hover:bg-white/5 transition p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">
                        {n.title || "Untitled"}
                      </div>
                      <div className="text-xs text-white/60 mt-1">
                        {n.type ? `${n.type} • ` : ""}
                        {n.status ? `${n.status} • ` : ""}
                        {formatDate(n.updatedAt)}
                      </div>
                    </div>
                    <div className="text-xs text-white/60 shrink-0">Open →</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ChatGPT-style bottom bar */}
        <div className="border-t border-white/10 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-2 flex items-end gap-2">
              <div className="flex-1">
                <textarea
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder="Message MotionAI…"
                  className="w-full resize-none bg-transparent outline-none text-sm px-3 py-2 placeholder:text-white/40 max-h-40"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      startNewChat();
                    }
                  }}
                  disabled={creatingChat}
                />
                <div className="px-3 pb-1 text-[11px] text-white/40">
                  Enter to send • Shift+Enter for newline
                </div>
              </div>

              <button
                onClick={startNewChat}
                disabled={creatingChat || !chatText.trim()}
                className="shrink-0 rounded-xl border border-white/10 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition flex items-center gap-2"
              >
                <MessageSquarePlus size={16} />
                {creatingChat ? "Starting…" : "New chat"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
