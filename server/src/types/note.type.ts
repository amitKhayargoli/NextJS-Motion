export enum NoteType {
  MANUAL = "MANUAL",
  VOICE_TRANSCRIPT = "VOICE_TRANSCRIPT",
  MEETING_SUMMARY = "MEETING_SUMMARY",
}

export interface INote {
  id: string;
  title: string;
  content: string;
  summary?: string | null;
  type: NoteType;
  authorId: string;
  workspaceId: string;
  audioFileId?: string | null;
  coverURL?: string | null;
  isSynced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateNoteData {
  title: string;
  content: string;
  type?: NoteType;
  coverURL?: string;
  authorId: string;
  workspaceId: string;
  audioFileId?: string;
}

export interface IUpdateNoteData {
  title?: string;
  content?: string;
  summary?: string;
  coverURL?: string;
}

export interface INoteFilters {
  workspaceId?: string;
  authorId?: string;
  type?: NoteType;
  searchQuery?: string;
}
