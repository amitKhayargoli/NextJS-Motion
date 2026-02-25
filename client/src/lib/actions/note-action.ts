"use server";

import { revalidatePath } from "next/cache";
import {
  createNote,
  updateNote,
  getNoteById,
  getWorkspaceNotes,
  deleteNote,
  addSummaryToNote,
} from "../api/note";

export const handleCreateNote = async (noteData: any) => {
  try {
    const res = await createNote(noteData);
    if (res.success) {
      revalidatePath(`/workspaces/${noteData.workspaceId}/notes`);
      return {
        success: true,
        data: res.data,
        message: "Note created successfully",
      };
    }
    return { success: false, message: res.message || "Failed to create note" };
  } catch (err: Error | any) {
    return { success: false, message: err.message || "Failed to create note" };
  }
};

export const handleUpdateNote = async (noteId: string, updateData: any) => {
  try {
    const res = await updateNote(noteId, updateData);
    if (res.success) {
      // Revalidate the specific note AND the list if the status changed
      revalidatePath(`/note/${noteId}`);
      if (updateData.status || updateData.title) {
        // This ensures the sidebar/list updates if the title or draft-status changes
        revalidatePath(`/workspaces/${res.data.workspaceId}/notes`);
      }
      return { success: true, data: res.data };
    }
  } catch (err: Error | any) {
    return { success: false, message: err.message || "Failed to update note" };
  }
};

export const handleGetNote = async (noteId: string, workspaceId?: string) => {
  try {
    const res = await getNoteById(noteId, workspaceId);

    if (res.success) {
      return { success: true, data: res.data };
    }

    return { success: false, message: res.message || "Failed to fetch note" };
  } catch (err: Error | any) {
    return { success: false, message: err.message || "Failed to fetch note" };
  }
};
export const handleGetWorkspaceNotes = async (workspaceId: string) => {
  try {
    const res = await getWorkspaceNotes(workspaceId);
    if (res.success) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      message: res.message || "Failed to fetch workspace notes",
    };
  } catch (err: Error | any) {
    return {
      success: false,
      message: err.message || "Failed to fetch workspace notes",
    };
  }
};

export const handleDeleteNote = async (noteId: string) => {
  try {
    const res = await deleteNote(noteId);

    if (res.success) {
      return { success: true, message: "Note deleted successfully" };
    }

    return { success: false, message: res.message || "Failed to delete note" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to delete note" };
  }
};

export const handleAddSummary = async (
  noteId: string,
  workspaceId?: string,
) => {
  try {
    const res = await addSummaryToNote(noteId);

    if (res.success) {
      // refresh note page + sidebar list if needed
      revalidatePath(`/workspace/${workspaceId}/note/${noteId}`);
      if (workspaceId) revalidatePath(`/workspace/${workspaceId}`);

      return {
        success: true,
        message: "Summary generated successfully",
        data: res.data, // should include updated note (with summary)
      };
    }

    return { success: false, message: res.message || "Failed to summarize" };
  } catch (err: Error | any) {
    return { success: false, message: err.message || "Failed to summarize" };
  }
};
