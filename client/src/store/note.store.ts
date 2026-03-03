import { create } from "zustand";
import {
  handleGetWorkspaceNotes,
  handleDeleteNote,
} from "@/lib/actions/note-action";

export type NoteListItem = {
  id: string;
  title: string;
  updatedAt?: string | Date;
  type?: string;
  status?: string;
};

type NotesState = {
  notesByWorkspaceId: Record<string, NoteListItem[]>;
  loadingByWorkspace: Record<string, boolean>;
  errorByWorkspace: Record<string, string | null>;

  fetchNotes: (workspaceId: string) => Promise<void>;

  deleteNoteOptimistic: (params: {
    workspaceId: string;
    noteId: string;
  }) => Promise<{ success: boolean; message?: string }>;

  // optional helper
  setNotes: (workspaceId: string, notes: NoteListItem[]) => void;
};

export const useNotesStore = create<NotesState>((set, get) => ({
  notesByWorkspaceId: {},
  loadingByWorkspace: {},
  errorByWorkspace: {},

  setNotes: (workspaceId, notes) =>
    set((s) => ({
      notesByWorkspaceId: { ...s.notesByWorkspaceId, [workspaceId]: notes },
    })),

  fetchNotes: async (workspaceId) => {
    if (!workspaceId) return;

    set((s) => ({
      loadingByWorkspace: { ...s.loadingByWorkspace, [workspaceId]: true },
      errorByWorkspace: { ...s.errorByWorkspace, [workspaceId]: null },
    }));

    try {
      const res = await handleGetWorkspaceNotes(workspaceId);

      if (!res?.success) {
        set((s) => ({
          notesByWorkspaceId: { ...s.notesByWorkspaceId, [workspaceId]: [] },
          errorByWorkspace: {
            ...s.errorByWorkspace,
            [workspaceId]: res?.message || "Failed to fetch notes",
          },
        }));
        return;
      }

      // IMPORTANT: normalize to {id,title,...}
      const raw = res.data ?? [];
      const normalized: NoteListItem[] = raw.map((n: any) => ({
        id: String(n.id ?? n._id),
        title: n.title ?? "",
        updatedAt: n.updatedAt,
        type: n.type,
        status: n.status,
      }));

      set((s) => ({
        notesByWorkspaceId: {
          ...s.notesByWorkspaceId,
          [workspaceId]: normalized,
        },
      }));
    } catch (e: any) {
      set((s) => ({
        notesByWorkspaceId: { ...s.notesByWorkspaceId, [workspaceId]: [] },
        errorByWorkspace: {
          ...s.errorByWorkspace,
          [workspaceId]: e?.message || "Failed to fetch notes",
        },
      }));
    } finally {
      set((s) => ({
        loadingByWorkspace: { ...s.loadingByWorkspace, [workspaceId]: false },
      }));
    }
  },

  deleteNoteOptimistic: async ({ workspaceId, noteId }) => {
    if (!workspaceId || !noteId)
      return { success: false, message: "Missing ids" };

    const prev = get().notesByWorkspaceId[workspaceId] ?? [];

    // optimistic remove
    set((s) => ({
      notesByWorkspaceId: {
        ...s.notesByWorkspaceId,
        [workspaceId]: prev.filter((n) => n.id !== noteId),
      },
    }));

    const res = await handleDeleteNote(noteId);

    if (!res?.success) {
      // rollback
      set((s) => ({
        notesByWorkspaceId: { ...s.notesByWorkspaceId, [workspaceId]: prev },
      }));
      return { success: false, message: res?.message || "Delete failed" };
    }

    return { success: true };
  },
}));
