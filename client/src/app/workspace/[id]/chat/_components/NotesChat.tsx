"use client";

import * as React from "react";
import NextLink from "next/link";
import { Trash2 } from "lucide-react";

import {
  handleRagChat,
  handleCreateRagThread,
  handleGetRagThreads,
  handleGetRagThreadMessages,
} from "@/lib/actions/rag-action";

import { deleteRagThread } from "@/lib/api/rag";

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

/**
 * SAFELINK — prevents Next from crashing if href becomes "[object Object]"
 */
function SafeLink(
  props: React.ComponentProps<typeof NextLink> & { debugName?: string },
) {
  const { href, debugName, ...rest } = props;

  const hrefStr =
    typeof href === "string"
      ? href
      : (() => {
          try {
            return JSON.stringify(href);
          } catch {
            return String(href);
          }
        })();

  if (hrefStr.includes("[object Object]")) {
    console.error("BAD LINK HREF:", {
      debugName,
      href,
      hrefStr,
      stack: new Error().stack,
    });

    return (
      <span className={(rest as any).className}>{(rest as any).children}</span>
    );
  }

  return <NextLink href={href as any} {...(rest as any)} />;
}

type RagNote = {
  id: any;
  title: string;
  updatedAt: string | Date;
  type: string;
  status: string;
};

type RagSource = {
  noteId?: any;
  noteTitle?: string;
  chunkIndex?: number;
  score?: number;
  type?: string;
  op?: string;
};

type Msg =
  | { role: "user"; content: string }
  | {
      role: "assistant";
      content: string;
      meta?: {
        kind?: "rag_answer" | "note_list" | "latest_notes" | "count_notes";
        notes?: RagNote[];
        sources?: RagSource[];
      };
    };

type Thread = {
  id: string;
  title: string;
  updatedAt: string | Date;
  createdAt: string | Date;
};

function formatDate(d: string | Date) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return "";
  }
}

function toId(v: any): string {
  if (!v) return "";
  if (typeof v === "string") return v;

  if (typeof v === "object" && typeof v.$oid === "string") return v.$oid;
  if (typeof v?.toHexString === "function") return v.toHexString();

  try {
    const j = JSON.stringify(v);
    const m = j.match(/"\$oid"\s*:\s*"([^"]+)"/);
    if (m?.[1]) return m[1];
  } catch {}

  const s = String(v);
  return s === "[object Object]" ? "" : s;
}

function safeNoteHref(workspaceId: string, noteIdValue: any): string | null {
  const id = toId(noteIdValue);
  if (!id) return null;
  return `/workspace/${workspaceId}/note/${id}`;
}

function safeThreadId(v: any): string {
  const id = toId(v);
  return id || (typeof v === "string" ? v : "");
}

export default function NotesChat({ workspaceId }: { workspaceId: string }) {
  const [threads, setThreads] = React.useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = React.useState<string>("");
  const [threadLoading, setThreadLoading] = React.useState(false);

  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // delete thread dialog state
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [pendingDeleteThreadId, setPendingDeleteThreadId] =
    React.useState<string>("");
  const [deletingThread, setDeletingThread] = React.useState(false);

  const endRef = React.useRef<HTMLDivElement | null>(null);

  const scrollToBottom = React.useCallback(() => {
    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, []);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load threads for this workspace
  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setThreadLoading(true);
      try {
        const res = await handleGetRagThreads(workspaceId);
        if (cancelled) return;

        if (res?.success) {
          const list: Thread[] = (res.data ?? []).map((t: any) => ({
            id: safeThreadId(t.id),
            title: t.title ?? "New chat",
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
          }));

          setThreads(list);

          // Auto-select most recent thread OR create one if none
          if (!activeThreadId) {
            const first = list[0];
            if (first?.id) {
              setActiveThreadId(first.id);
            } else {
              await createNewThread(true);
            }
          }
        } else {
          console.error(res?.message || "Failed to load threads");
        }
      } finally {
        if (!cancelled) setThreadLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  // When activeThreadId changes, load messages for that thread
  React.useEffect(() => {
    if (!activeThreadId) return;
    let cancelled = false;

    async function loadThread() {
      setThreadLoading(true);
      try {
        const res = await handleGetRagThreadMessages(activeThreadId);
        if (cancelled) return;

        if (!res?.success) {
          console.error(res?.message || "Failed to load thread messages");
          setMessages([]);
          return;
        }

        const raw = Array.isArray(res.data)
          ? res.data
          : (res.data?.messages ?? res.data?.data?.messages ?? []);

        const mapped: Msg[] = raw.map((m: any) => ({
          role: m.role,
          content: m.content,
        }));

        setMessages(mapped);
      } finally {
        if (!cancelled) setThreadLoading(false);
      }
    }

    loadThread();
    return () => {
      cancelled = true;
    };
  }, [activeThreadId]);

  async function createNewThread(selectImmediately = true) {
    setThreadLoading(true);
    try {
      const res = await handleCreateRagThread({ workspaceId });
      if (!res?.success) {
        console.error(res?.message || "Create thread failed");
        return;
      }

      const t = res.data;
      const newThread: Thread = {
        id: safeThreadId(t.id),
        title: t.title ?? "New chat",
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      };

      setThreads((prev) => [newThread, ...prev]);

      if (selectImmediately && newThread.id) {
        setActiveThreadId(newThread.id);
        setMessages([]);
      }
    } finally {
      setThreadLoading(false);
    }
  }

  // ✅ open delete confirm
  function requestDeleteThread(threadId: string) {
    setPendingDeleteThreadId(threadId);
    setDeleteOpen(true);
  }

  // ✅ confirm delete
  async function confirmDeleteThread() {
    const threadId = pendingDeleteThreadId;
    if (!threadId) return;

    setDeletingThread(true);

    // optimistic remove
    const prevThreads = threads;
    const nextThreads = threads.filter((t) => t.id !== threadId);
    setThreads(nextThreads);

    // if deleting active thread → choose next thread
    const wasActive = activeThreadId === threadId;
    if (wasActive) {
      const next = nextThreads[0]?.id || "";
      setActiveThreadId(next);
      setMessages([]); // clear immediately; messages will load if next exists
    }

    try {
      const res = await deleteRagThread(threadId);
      if (!res?.success) {
        // rollback
        setThreads(prevThreads);
        if (wasActive) {
          setActiveThreadId(threadId);
        }
        alert(res?.message || "Failed to delete chat");
        return;
      }

      // if no threads remain, create one
      if (nextThreads.length === 0) {
        await createNewThread(true);
      }

      setDeleteOpen(false);
      setPendingDeleteThreadId("");
    } catch (e: any) {
      // rollback
      setThreads(prevThreads);
      if (wasActive) setActiveThreadId(threadId);
      alert(e?.message || "Failed to delete chat");
    } finally {
      setDeletingThread(false);
    }
  }

  async function send() {
    const q = input.trim();
    if (!q || loading) return;

    if (!activeThreadId) {
      await createNewThread(true);
      return;
    }

    const optimistic: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(optimistic);
    setInput("");
    setLoading(true);

    try {
      const res = await handleRagChat({
        workspaceId,
        threadId: activeThreadId,
        question: q,
      });

      if (!res?.success) {
        setMessages([
          ...optimistic,
          { role: "assistant", content: res?.message || "RAG failed" },
        ]);
        return;
      }

      const data = res.data;

      // Update thread title/ordering in UI
      setThreads((prev) => {
        const now = new Date().toISOString();
        const updated = prev.map((t) =>
          t.id === activeThreadId
            ? {
                ...t,
                title:
                  t.title === "New chat" ? q.slice(0, 40) || t.title : t.title,
                updatedAt: now,
              }
            : t,
        );

        const active = updated.find((t) => t.id === activeThreadId);
        const rest = updated.filter((t) => t.id !== activeThreadId);
        return active ? [active, ...rest] : updated;
      });

      setMessages([
        ...optimistic,
        {
          role: "assistant",
          content: data?.answer ?? "No answer",
          meta: {
            kind: data?.kind,
            notes: data?.notes,
            sources: data?.sources,
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const activeThread = threads.find((t) => t.id === activeThreadId);
  const pendingDeleteTitle =
    threads.find((t) => t.id === pendingDeleteThreadId)?.title ?? "this chat";

  return (
    <>
      <div className="flex h-full bg-[#121212] text-white">
        {/* LEFT SIDEBAR */}
        <div className="w-[280px] border-r border-white/10 flex flex-col">
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <div className="text-md font-semibold">Chats</div>
            <button
              onClick={() => createNewThread(true)}
              className="text-xs px-2 py-1 rounded-lg border border-white/10 hover:bg-white/5"
              disabled={threadLoading}
            >
              + New
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {threads.length === 0 ? (
              <div className="text-xs text-white/60 p-2">
                {threadLoading ? "Loading..." : "No chats yet. Click + New."}
              </div>
            ) : (
              threads.map((t) => {
                const active = t.id === activeThreadId;

                return (
                  <div
                    key={t.id}
                    className={`group w-full rounded-xl border border-white/10 transition flex items-stretch ${
                      active ? "bg-white/10" : "bg-black/20 hover:bg-white/5"
                    }`}
                  >
                    {/* click area */}
                    <button
                      onClick={() => setActiveThreadId(t.id)}
                      className="flex-1 text-left px-3 py-2 min-w-0"
                    >
                      <div className="text-sm font-medium truncate">
                        {t.title || "New chat"}
                      </div>
                      <div className="text-[11px] text-white/50 mt-0.5 truncate">
                        {formatDate(t.updatedAt)}
                      </div>
                    </button>

                    {/* delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        requestDeleteThread(t.id);
                      }}
                      className="shrink-0 px-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete chat"
                      aria-label="Delete chat"
                    >
                      <Trash2
                        size={16}
                        className="text-white/60 hover:text-red-400"
                      />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT CHAT */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="min-w-0">
              <div className="text-md font-semibold truncate">
                {activeThread?.title ?? "Notes Chat"}
              </div>
              <div className="text-[11px] text-white/50">
                {activeThreadId ? `Thread: ${activeThreadId.slice(-6)}` : ""}
              </div>
            </div>

            {loading || threadLoading ? (
              <div className="text-xs text-white/60">
                {threadLoading ? "Loading…" : "Thinking…"}
              </div>
            ) : null}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-sm text-white/60">
                Try: <span className="text-white/80">latest notes</span> •{" "}
                <span className="text-white/80">list notes</span> •{" "}
                <span className="text-white/80">
                  what did we decide in the architecture meeting?
                </span>
              </div>
            )}

            {messages.map((m, i) => {
              const isUser = m.role === "user";

              return (
                <div key={i} className={isUser ? "text-right" : "text-left"}>
                  <div
                    className={`inline-block max-w-[88%] rounded-2xl px-4 py-3 border border-white/10 ${
                      isUser ? "bg-white/10" : "bg-white/5"
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {m.content}
                    </div>

                    {/* Notes list cards */}
                    {"meta" in m && m.meta?.notes?.length ? (
                      <div className="mt-3 space-y-2">
                        {m.meta.notes.map((n, idx) => {
                          const href = safeNoteHref(workspaceId, n.id);

                          if (!href) {
                            console.error("BAD NOTE ID (card):", n.id);
                            return (
                              <div
                                key={`bad-${idx}`}
                                className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-left"
                              >
                                <div className="text-xs text-red-300">
                                  Invalid note id returned from server
                                </div>
                                <div className="font-medium">
                                  {n.title || "Untitled"}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <SafeLink
                              debugName="NotesChat:note-card"
                              key={href}
                              href={href}
                              className="block text-left rounded-xl border border-white/10 bg-black/20 hover:bg-white/5 transition px-3 py-2"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="font-medium truncate">
                                    {n.title || "Untitled"}
                                  </div>
                                  <div className="text-xs text-white/60 mt-1">
                                    {n.type} • {n.status} •{" "}
                                    {formatDate(n.updatedAt)}
                                  </div>
                                </div>
                                <div className="text-xs text-white/60 shrink-0">
                                  Open →
                                </div>
                              </div>
                            </SafeLink>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}

            <div ref={endRef} />
          </div>

          <div className="p-3 border-t border-white/10 flex gap-2">
            <input
              className="flex-1 bg-transparent border border-white/10 rounded-xl px-3 py-2 outline-none text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about your notes..."
              disabled={loading || threadLoading || !activeThreadId}
            />
            <button
              className="px-4 py-2 rounded-xl border border-white/10 text-sm disabled:opacity-50"
              onClick={send}
              disabled={
                loading || threadLoading || !input.trim() || !activeThreadId
              }
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-[#121212] text-white border border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chat?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              This will permanently delete{" "}
              <span className="text-white/90 font-medium">
                {pendingDeleteTitle}
              </span>{" "}
              and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-transparent border border-white/10 text-white hover:bg-white/10"
              disabled={deletingThread}
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={confirmDeleteThread}
              disabled={deletingThread}
              className="bg-red-500/20 text-red-200 border border-red-400/30 hover:bg-red-500/30"
            >
              {deletingThread ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
