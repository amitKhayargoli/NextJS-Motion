"use client";

import * as React from "react";
import { Search, FileText, Plus, Loader2, X } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";

import { getTokenCookie } from "@/lib/cookie";
import { fetchNotesPaged, NoteListItem } from "@/lib/api/note";
import { handleCreateNote } from "@/lib/actions/note-action";

export default function NotesCommandPopup({
  workspaceId,
  onOpenNote,
}: {
  workspaceId: string;
  onOpenNote: (noteId: string) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");

  const [page, setPage] = React.useState(1);
  const limit = 6;

  const [items, setItems] = React.useState<NoteListItem[]>([]);
  const [pagination, setPagination] = React.useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const trimmed = search.trim();
  const showCreate =
    !loading && !creating && !error && trimmed.length > 0 && items.length === 0;

  // Ctrl+K / Cmd+K
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const isTyping =
        el?.tagName === "INPUT" ||
        el?.tagName === "TEXTAREA" ||
        (el as any)?.isContentEditable;

      if (isTyping) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 200);
    return () => clearTimeout(t);
  }, [search]);

  // reset when opening / query changes / workspace changes
  React.useEffect(() => {
    if (!open) return;
    setItems([]);
    setPagination(null);
    setPage(1);
    setError(null);
  }, [open, debounced, workspaceId]);

  // create note from search
  const handleCreateFromSearch = React.useCallback(async () => {
    if (!trimmed) return;

    setCreating(true);
    setError(null);

    try {
      const token = await getTokenCookie();
      if (!token) {
        setError("Not authenticated. Please log in again.");
        return;
      }

      const res = await handleCreateNote({
        workspaceId,
        title: trimmed,
        type: "MANUAL",
      });

      if (!res.success || !res.data?.id) {
        throw new Error(res.message || "Failed to create note");
      }

      onOpenNote(res.data.id);
      setOpen(false);

      // reset for next open
      setSearch("");
      setDebounced("");
      setItems([]);
      setPagination(null);
      setPage(1);
    } catch (e: any) {
      setError(e?.message ?? "Failed to create note");
    } finally {
      setCreating(false);
    }
  }, [trimmed, workspaceId, onOpenNote]);

  // fetch notes
  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const token = await getTokenCookie();
        if (!token) {
          setError("Not authenticated. Please log in again.");
          setItems([]);
          setPagination(null);
          return;
        }

        const res = await fetchNotesPaged({
          workspaceId,
          searchQuery: debounced || undefined,
          page,
          limit,
        });

        if (cancelled) return;

        setPagination(res.pagination);
        setItems((prev) => {
          const merged = page === 1 ? res.data : [...prev, ...res.data];
          const map = new Map<string, NoteListItem>();
          for (const n of merged) map.set(n.id, n);
          return Array.from(map.values());
        });
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [open, workspaceId, debounced, page]);

  const canLoadMore = pagination
    ? pagination.page < pagination.totalPages
    : false;

  const closeAndReset = React.useCallback(() => {
    setOpen(false);
    // keep search around if you want; ChatGPT keeps it sometimes.
    // If you want reset on close, uncomment:
    // setSearch("");
    // setDebounced("");
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        // ChatGPT-ish: centered, rounded, dark, soft border, tight padding
        className="max-w-[720px] w-[92vw] p-0 overflow-hidden rounded-2xl border border-white/10 bg-[#1f1f1f] text-white shadow-2xl"
      >
        <Command
          // Remove default background from Command wrapper
          className="bg-transparent text-white"
          shouldFilter={false}
        >
          {/* Header row (input + close) */}
          <div className="flex items-center gap-3 px-4 py-3">
            <CommandInput
              value={search}
              onValueChange={setSearch}
              placeholder="Search notes…"
              className="h-10 flex-1 bg-transparent text-white placeholder:text-white/40"
            />
          </div>

          {/* List area */}
          <CommandList className="max-h-[420px] overflow-auto px-2 py-2">
            <CommandEmpty className="py-8 text-center text-sm text-white/60">
              {loading || creating ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading…
                </span>
              ) : error ? (
                error
              ) : (
                "No results."
              )}
            </CommandEmpty>

            {/* Create section (only when nothing found but query exists) */}
            {showCreate && (
              <>
                <CommandGroup heading="Create" className="px-1">
                  <CommandItem
                    value={`create-${trimmed}`}
                    disabled={creating}
                    onSelect={handleCreateFromSearch}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 aria-selected:bg-white/10"
                  >
                    <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center">
                      {creating ? (
                        <Loader2 className="h-4 w-4 animate-spin text-white/80" />
                      ) : (
                        <Plus className="h-4 w-4 text-white/80" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-white">
                        Create note{" "}
                        <span className="text-white/70">“{trimmed}”</span>
                      </div>
                      <div className="text-xs text-white/50 mt-0.5">
                        Press Enter to create and open
                      </div>
                    </div>
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator className="my-2 bg-white/10" />
              </>
            )}

            {/* Notes section */}
            <CommandGroup heading="Notes" className="px-1">
              {items.map((n) => (
                <CommandItem
                  key={n.id}
                  value={`${n.title}-${n.id}`}
                  onSelect={() => {
                    onOpenNote(n.id);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 aria-selected:bg-white/10"
                >
                  <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white/80" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-white">{n.title}</div>
                    <div className="text-xs text-white/50 mt-0.5">{n.type}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            {/* Load more */}
            {canLoadMore && (
              <>
                <CommandSeparator className="my-2 bg-white/10" />
                <CommandGroup className="px-1">
                  <CommandItem
                    value="load-more"
                    disabled={loading}
                    onSelect={() => setPage((p) => p + 1)}
                    className="justify-center rounded-xl px-3 py-3 aria-selected:bg-white/10 text-white/80"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading…
                      </span>
                    ) : (
                      "Load more"
                    )}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>

          {/* Footer hint bar (ChatGPT-ish) */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-white/10 text-xs text-white/50">
            <div className="flex items-center gap-2">
              <kbd className="rounded-md border border-white/10 bg-white/5 px-2 py-1">
                ↑↓
              </kbd>
              to navigate
              <kbd className="ml-3 rounded-md border border-white/10 bg-white/5 px-2 py-1">
                Enter
              </kbd>
              to select
            </div>
            <div className="flex items-center gap-2">
              <kbd className="rounded-md border border-white/10 bg-white/5 px-2 py-1">
                Esc
              </kbd>
              to close
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
