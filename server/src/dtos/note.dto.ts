import { NoteType } from "../types/note.type";

export class CreateNoteDTO {
  title: string;
  content: string;
  type?: NoteType;
  coverURL?: string;
  authorId: string;
  workspaceId: string;
  audioFileId?: string;

  constructor(data: any) {
    // ✅ Add validation check
    if (!data) {
      throw new Error("Request body is empty");
    }

    this.title = data.title;
    this.content = data.content;
    this.coverURL = data.coverURL;
    this.type = data.type || NoteType.MANUAL;
    this.authorId = data.authorId;
    this.workspaceId = data.workspaceId;
    this.audioFileId = data.audioFileId;
  }
}

export class UpdateNoteDTO {
  noteId: string;
  title?: string;
  coverURL?: string;
  content?: string;
  summary?: string;

  constructor(noteId: string, data: any) {
    this.noteId = noteId;
    this.title = data.title;
    this.content = data.content;
    this.coverURL = data.coverURL;
    this.summary = data.summary;
  }
}

export class NoteResponseDTO {
  id: string;
  title: string;
  content: string;
  summary?: string | null;
  type: NoteType;
  authorId: string;
  workspaceId: string;
  audioFileId?: string | null;
  isSynced: boolean;
  createdAt: string;
  updatedAt: string;

  constructor(note: any) {
    this.id = note.id;
    this.title = note.title;
    this.content = note.content;
    this.summary = note.summary;
    this.type = note.type as NoteType;
    this.authorId = note.authorId;
    this.workspaceId = note.workspaceId;
    this.audioFileId = note.audioFileId;
    this.isSynced = note.isSynced;
    this.createdAt =
      note.createdAt instanceof Date
        ? note.createdAt.toISOString()
        : note.createdAt;
    this.updatedAt =
      note.updatedAt instanceof Date
        ? note.updatedAt.toISOString()
        : note.updatedAt;
  }

  static fromArray(notes: any[]): NoteResponseDTO[] {
    return notes.map((note) => new NoteResponseDTO(note));
  }
}

export class GetNotesQueryDTO {
  workspaceId?: string;
  authorId?: string;
  type?: NoteType;
  searchQuery?: string;
  page?: number;
  limit?: number;

  constructor(query: any) {
    this.workspaceId = query.workspaceId;
    this.authorId = query.authorId;
    this.type = query.type;
    this.searchQuery = query.searchQuery;
    this.page = query.page ? parseInt(query.page) : 1;
    this.limit = query.limit ? parseInt(query.limit) : 10;
  }
}
