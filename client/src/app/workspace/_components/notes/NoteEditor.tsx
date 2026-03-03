"use client";

import { useEffect, useRef, useState } from "react";
import { handleUpdateNote, handleAddSummary } from "@/lib/actions/note-action";

interface Note {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  status: string;
  summary?: string | null;
}

type Role = "VIEWER" | "EDITOR" | "OWNER";

export default function NoteEditor({
  note,
  userRole,
}: {
  note: Note;
  userRole: Role;
}) {
  const canEdit = userRole === "EDITOR" || userRole === "OWNER";

  const [saveState, setSaveState] = useState<
    "saved" | "saving" | "unsaved" | "error"
  >("saved");

  const [title, setTitle] = useState(note.title);

  // Summary UI
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState(note.summary ?? "");
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);

  // Autosave refs (content)
  const lastSavedHtmlRef = useRef(note.content ?? "");
  const pendingContentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const contentInFlightRef = useRef(false);

  // Autosave refs (title)
  const lastSavedTitleRef = useRef(note.title ?? "");
  const pendingTitleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const titleInFlightRef = useRef(false);

  //  Cursor + scroll preservation
  const lastRangeRef = useRef<{ index: number; length: number } | null>(null);
  const lastScrollTopRef = useRef<number>(0);

  //  Prevent restoring “old cursor” after user keeps typing during save
  const editSeqRef = useRef(0);

  const getScroller = (q: any) => {
    // Prefer Quill editor parent if it scrolls; else fall back to editor root
    return q?.root?.parentElement || q?.root || containerRef.current;
  };

  const captureCursorAndScroll = (q: any) => {
    try {
      const r = q?.getSelection?.();
      if (r) lastRangeRef.current = r;

      const scroller = getScroller(q) as any;
      lastScrollTopRef.current = scroller?.scrollTop ?? 0;
    } catch {}
  };

  const restoreCursorAndScroll = (q: any) => {
    requestAnimationFrame(() => {
      try {
        const scroller = getScroller(q) as any;
        if (scroller) scroller.scrollTop = lastScrollTopRef.current;

        const r = lastRangeRef.current;
        if (r) q?.setSelection?.(r.index, r.length, "silent");
      } catch {}
    });
  };

  //  Sync UI state on note switch
  useEffect(() => {
    setTitle(note.title);
    setSummary(note.summary ?? "");
    setSummaryError(null);

    lastSavedTitleRef.current = note.title ?? "";
    lastSavedHtmlRef.current = note.content ?? "";
    setSaveState("saved");

    // reset cursor tracking when switching notes
    lastRangeRef.current = null;
    lastScrollTopRef.current = 0;
    editSeqRef.current = 0;
  }, [note.id, note.title, note.content, note.summary]);

  // Summarize
  const onSummarize = async () => {
    setSummarizing(true);
    setSummaryError(null);
    try {
      const res = await handleAddSummary(note.id, note.workspaceId);
      if (!res?.success) throw new Error(res?.message || "Failed to summarize");

      const updated = res.data;
      const newSummary = updated?.summary ?? updated?.note?.summary ?? "";
      setSummary(newSummary);

      setSummaryOpen(true);
    } catch (e: any) {
      setSummaryError(e?.message ?? "Failed to summarize");
    } finally {
      setSummarizing(false);
    }
  };

  // Title autosave
  useEffect(() => {
    if (!canEdit) return;

    const trimmed = (title ?? "").trim();
    const savedTrimmed = (lastSavedTitleRef.current ?? "").trim();
    if (trimmed === savedTrimmed) return;

    setSaveState("unsaved");
    if (pendingTitleTimeoutRef.current)
      clearTimeout(pendingTitleTimeoutRef.current);

    pendingTitleTimeoutRef.current = setTimeout(async () => {
      if (titleInFlightRef.current) return;

      titleInFlightRef.current = true;
      setSaveState("saving");
      try {
        const res = await handleUpdateNote(note.id, { title: trimmed });
        if (!res?.success) throw new Error(res?.message || "Title save failed");

        lastSavedTitleRef.current = trimmed;
        setSaveState("saved");
      } catch {
        setSaveState("error");
      } finally {
        titleInFlightRef.current = false;
      }
    }, 600);

    return () => {
      if (pendingTitleTimeoutRef.current)
        clearTimeout(pendingTitleTimeoutRef.current);
    };
  }, [title, note.id, canEdit]);

  //  Quill init + content autosave
  // IMPORTANT: do NOT depend on note.content , that recreates Quill on every save.
  useEffect(() => {
    let destroyed = false;
    let quill: any = null;

    const init = async () => {
      if (!containerRef.current || destroyed) return;

      const Quill = (await import("quill")).default;

      containerRef.current.innerHTML = "";
      const editorContainer = containerRef.current.appendChild(
        document.createElement("div"),
      );

      quill = new Quill(editorContainer, {
        theme: "snow",
        placeholder: canEdit
          ? "Start writing your masterpiece..."
          : "Read-only (Viewer)",
        modules: {
          toolbar: canEdit
            ? [
                [{ header: [1, 2, false] }],
                ["bold", "italic", "underline", "strike"],
                [{ list: "ordered" }, { list: "bullet" }],
                ["link", "code-block", "blockquote"],
                ["clean"],
              ]
            : false,
        },
      });

      quillRef.current = quill;
      quill.enable(canEdit);

      //  set initial content ONCE for this note
      const initialHtml = note.content ?? "";
      if (initialHtml) {
        quill.clipboard.dangerouslyPasteHTML(initialHtml);
      }
      lastSavedHtmlRef.current = initialHtml;

      //  selection tracking (cursor)
      quill.on("selection-change", (range: any) => {
        if (range) lastRangeRef.current = range;
      });

      //  edit counter + scroll tracking (single handler)
      quill.on("text-change", () => {
        editSeqRef.current += 1;

        const scroller = getScroller(quill) as any;
        lastScrollTopRef.current = scroller?.scrollTop ?? 0;
      });

      const queueContentSave = () => {
        if (!canEdit) return;

        setSaveState("unsaved");
        if (pendingContentTimeoutRef.current) {
          clearTimeout(pendingContentTimeoutRef.current);
        }

        pendingContentTimeoutRef.current = setTimeout(async () => {
          if (destroyed || !quill) return;

          const html = quill.root.innerHTML;

          // nothing changed vs last saved
          if (html === lastSavedHtmlRef.current) {
            setSaveState("saved");
            return;
          }

          if (contentInFlightRef.current) return;

          //  capture cursor+scroll at save start
          captureCursorAndScroll(quill);
          const saveStartSeq = editSeqRef.current;

          contentInFlightRef.current = true;
          setSaveState("saving");

          try {
            const updateData: any = { content: html };

            const text = quill.getText().trim();
            if (note.status === "DRAFT" && text.length > 0) {
              updateData.status = "PUBLISHED";
            }

            const res = await handleUpdateNote(note.id, updateData);
            if (!res?.success) throw new Error(res?.message || "Save failed");

            //  Only update lastSaved with what we actually sent
            lastSavedHtmlRef.current = html;
            setSaveState("saved");

            //  IMPORTANT:
            // Restore cursor ONLY if user didn't type since save started,
            // otherwise it snaps back to an old position.
            if (editSeqRef.current === saveStartSeq) {
              restoreCursorAndScroll(quill);
            }
          } catch {
            setSaveState("error");
          } finally {
            contentInFlightRef.current = false;
          }
        }, 800);
      };

      if (canEdit) quill.on("text-change", queueContentSave);
      (quill as any).__queueContentSave = queueContentSave;

      // Optional: focus at end on initial load (only if editing)
      requestAnimationFrame(() => {
        try {
          if (!canEdit) return;
          const len = quill.getLength();
          quill.setSelection(Math.max(0, len - 1), 0, "silent");
        } catch {}
      });
    };

    init();

    return () => {
      destroyed = true;

      if (pendingContentTimeoutRef.current)
        clearTimeout(pendingContentTimeoutRef.current);
      pendingContentTimeoutRef.current = null;
      contentInFlightRef.current = false;

      try {
        if (quill && (quill as any).__queueContentSave) {
          quill.off("text-change", (quill as any).__queueContentSave);
        }
      } catch {}

      if (containerRef.current) containerRef.current.innerHTML = "";
      quillRef.current = null;
      quill = null;
    };
  }, [note.id, canEdit, note.status]); //  no note.content here

  return (
    <div className="flex h-screen bg-[#121212] text-white">
      {/* LEFT: editor */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between gap-4 px-8 py-4 border-b border-white/10">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!canEdit}
            className={`flex-1 min-w-0 bg-transparent text-2xl font-bold outline-none border-none placeholder-gray-700 truncate ${
              !canEdit ? "opacity-70 cursor-not-allowed" : ""
            }`}
            placeholder="Note Title"
          />

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSummaryOpen((v) => !v)}
              className="hidden lg:inline-flex px-3 py-2 rounded-md border border-white/10 hover:bg-white/10 text-sm"
              title="Toggle summary panel"
            >
              {summaryOpen ? "Hide summary" : "Show summary"}
            </button>

            <button
              onClick={onSummarize}
              disabled={summarizing}
              className="px-3 py-2 rounded-md border border-white/10 hover:bg-white/10 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {summarizing ? "Summarizing..." : "Summarize"}
            </button>

            <div className="shrink-0 text-xs text-gray-500 italic">
              {!canEdit
                ? "Read-only"
                : saveState === "saving"
                  ? "Saving..."
                  : saveState === "unsaved"
                    ? "Unsaved"
                    : saveState === "error"
                      ? "Save failed"
                      : "Saved"}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-4">
          <div ref={containerRef} className="prose prose-invert max-w-none" />
        </div>

        <div className="lg:hidden px-4 pb-4">
          <button
            onClick={() => setSummaryOpen(true)}
            className="w-full px-3 py-2 rounded-md border border-white/10 hover:bg-white/10 text-sm"
          >
            View summary
          </button>
        </div>
      </div>

      {/* RIGHT: collapsible summary panel (desktop) */}
      {summaryOpen && (
        <div className="w-[360px] border-l border-white/10 p-4 hidden lg:block">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white/90">Summary</h3>

            <div className="flex items-center gap-2">
              {!!summary && (
                <button
                  onClick={() => navigator.clipboard.writeText(summary)}
                  className="text-xs text-white/60 hover:text-white"
                >
                  Copy
                </button>
              )}
              <button
                onClick={() => setSummaryOpen(false)}
                className="text-xs text-white/60 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>

          {summaryError && (
            <div className="text-xs text-red-400 mb-2">{summaryError}</div>
          )}

          <div className="text-sm text-white/80 whitespace-pre-wrap">
            {summarizing
              ? "Generating summary..."
              : summary
                ? summary
                : "No summary yet. Click “Summarize” to generate one."}
          </div>
        </div>
      )}

      {/* Mobile Summary Modal */}
      {summaryOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60">
          <div className="absolute bottom-0 left-0 right-0 bg-[#121212] border-t border-white/10 rounded-t-2xl p-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white/90">Summary</h3>
              <button
                onClick={() => setSummaryOpen(false)}
                className="text-sm text-white/70 hover:text-white"
              >
                Close
              </button>
            </div>

            {summaryError && (
              <div className="text-xs text-red-400 mb-2">{summaryError}</div>
            )}

            <div className="text-sm text-white/80 whitespace-pre-wrap">
              {summarizing
                ? "Generating summary..."
                : summary
                  ? summary
                  : "No summary yet. Tap “Summarize” to generate one."}
            </div>

            {!!summary && (
              <button
                onClick={() => navigator.clipboard.writeText(summary)}
                className="mt-4 w-full px-3 py-2 rounded-md border border-white/10 hover:bg-white/10 text-sm"
              >
                Copy summary
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
