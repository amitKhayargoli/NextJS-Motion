import axios from "./axios";
import { API } from "./endpoints";

// Create a new note
export const createNote = async (noteData: any) => {
  try {
    const response = await axios.post(API.NOTE.CREATE, noteData);
    return response.data;
  } catch (err: Error | any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to create note";
    throw new Error(message);
  }
};

// Update an existing note
export const updateNote = async (noteId: string, updateData: any) => {
  try {
    const response = await axios.put(API.NOTE.UPDATE(noteId), updateData);
    return response.data;
  } catch (err: Error | any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to update note";
    throw new Error(message);
  }
};

// Get a single note by ID
export const getNoteById = async (noteId: string) => {
  try {
    const response = await axios.get(API.NOTE.GET(noteId));
    return response.data;
  } catch (err: Error | any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to fetch note";
    throw new Error(message);
  }
};

// Get all notes (with optional filters/pagination)
export const getAllNotes = async (params?: any) => {
  try {
    const response = await axios.get(API.NOTE.GET_ALL, { params });
    return response.data;
  } catch (err: Error | any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to fetch notes";
    throw new Error(message);
  }
};

// Get all notes in a workspace
export const getWorkspaceNotes = async (workspaceId: string) => {
  try {
    const response = await axios.get(API.NOTE.GET_WORKSPACE(workspaceId));
    return response.data;
  } catch (err: Error | any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to fetch workspace notes";
    throw new Error(message);
  }
};

// Get all notes by an author
export const getAuthorNotes = async (authorId: string) => {
  try {
    const response = await axios.get(API.NOTE.GET_AUTHOR(authorId));
    return response.data;
  } catch (err: Error | any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to fetch author notes";
    throw new Error(message);
  }
};

// Delete a note by ID
export const deleteNote = async (noteId: string) => {
  try {
    const response = await axios.delete(API.NOTE.DELETE(noteId));
    return response.data;
  } catch (err: Error | any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to delete note";
    throw new Error(message);
  }
};

// Add or update a summary for a note
export const addSummaryToNote = async (noteId: string, summary: string) => {
  try {
    const response = await axios.patch(API.NOTE.ADD_SUMMARY(noteId), {
      summary,
    });
    return response.data;
  } catch (err: Error | any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to add summary to note";
    throw new Error(message);
  }
};
