import { INoteRepository } from "../repositories/note.repository";
import {
  CreateNoteDTO,
  UpdateNoteDTO,
  NoteResponseDTO,
  GetNotesQueryDTO,
} from "../dtos/note.dto";
import { NoteValidator } from "../dtos/validators/note.validator";
import { INote } from "../types/note.type";

export class NoteService {
  constructor(private noteRepository: INoteRepository) {}

  async createNote(dto: CreateNoteDTO): Promise<NoteResponseDTO> {
    // Validate
    const validation = NoteValidator.validateCreateNote(dto);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    // Create note
    const note = await this.noteRepository.create({
      title: dto.title,
      content: dto.content,
      type: dto.type,
      authorId: dto.authorId,
      workspaceId: dto.workspaceId,
      audioFileId: dto.audioFileId,
    });

    return new NoteResponseDTO(note);
  }

  async updateNote(dto: UpdateNoteDTO): Promise<NoteResponseDTO> {
    // Validate
    const validation = NoteValidator.validateUpdateNote(dto);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    // Check if note exists
    const exists = await this.noteRepository.exists(dto.noteId);
    if (!exists) {
      throw new Error("Note not found");
    }

    // Update note
    const note = await this.noteRepository.update(dto.noteId, {
      title: dto.title,
      content: dto.content,
      summary: dto.summary,
    });

    return new NoteResponseDTO(note);
  }

  async getNoteById(noteId: string): Promise<NoteResponseDTO> {
    const note = await this.noteRepository.findById(noteId);

    if (!note) {
      throw new Error("Note not found");
    }

    return new NoteResponseDTO(note);
  }

  async getWorkspaceNotes(workspaceId: string): Promise<NoteResponseDTO[]> {
    const notes = await this.noteRepository.findByWorkspaceId(workspaceId);
    return NoteResponseDTO.fromArray(notes);
  }

  async getAuthorNotes(authorId: string): Promise<NoteResponseDTO[]> {
    const notes = await this.noteRepository.findByAuthorId(authorId);
    return NoteResponseDTO.fromArray(notes);
  }

  async getNotes(query: GetNotesQueryDTO): Promise<{
    data: NoteResponseDTO[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const filters = {
      workspaceId: query.workspaceId,
      authorId: query.authorId,
      type: query.type,
      searchQuery: query.searchQuery,
    };

    const notes = await this.noteRepository.findAll(filters);
    const total = await this.noteRepository.count(filters);

    // Apply pagination
    const page = query.page || 1;
    const limit = query.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedNotes = notes.slice(startIndex, endIndex);

    return {
      data: NoteResponseDTO.fromArray(paginatedNotes),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deleteNote(noteId: string): Promise<void> {
    const exists = await this.noteRepository.exists(noteId);

    if (!exists) {
      throw new Error("Note not found");
    }

    await this.noteRepository.delete(noteId);
  }

  async addSummaryToNote(
    noteId: string,
    summary: string,
  ): Promise<NoteResponseDTO> {
    const exists = await this.noteRepository.exists(noteId);

    if (!exists) {
      throw new Error("Note not found");
    }

    if (summary.length > 5000) {
      throw new Error("Summary cannot exceed 5,000 characters");
    }

    const note = await this.noteRepository.update(noteId, { summary });
    return new NoteResponseDTO(note);
  }
}
