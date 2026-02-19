import { NoteType, Role } from "../generated/prisma/enums";

export enum NoteStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  PROCESSING = "PROCESSING",
}

export interface INote {
  id: string;
  title: string;
  content: string;
  summary?: string | null;
  type: NoteType;
  status: NoteStatus;
  authorId: string;
  workspaceId: string;
  audioFileId?: string | null;
  coverURL?: string | null;
  isSynced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type NoteWithRoleResult = {
  note: INote;
  userRole: Role;
};

export interface ICreateNoteData {
  title: string;
  content: string;
  type?: NoteType;
  coverURL?: string;
  authorId: string;
  workspaceId: string;
  audioFileId?: string;
  status: NoteStatus;
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

export interface INoteListItem {
  id: string;
  title: string;
  type: NoteType;
  updatedAt: Date;
}
export { NoteType };
