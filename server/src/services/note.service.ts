import { INoteRepository } from "../repositories/note.repository";
import {
  CreateNoteDTO,
  UpdateNoteDTO,
  NoteResponseDTO,
  GetNotesQueryDTO,
} from "../dtos/note.dto";
import { NoteValidator } from "../dtos/validators/note.validator";
import { INote } from "../types/note.type";
import { htmlToText } from "../utils/htmlToText";
import { summarizeText } from "../utils/summarizer.client";
import { EmbeddingService } from "./embedding.service";

export class NoteService {
  constructor(
    private noteRepository: INoteRepository,
    private prisma: any,
  ) {}

  private embeddingService = new EmbeddingService(this.prisma);

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
      status: dto.status,
      authorId: dto.authorId,
      workspaceId: dto.workspaceId,
      audioFileId: dto.audioFileId,
    });

    this.embeddingService
      .embedNoteChunks(note.id)
      .catch((e) => console.error("EMBED NOTE FAILED:", note.id, e.message));

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

    // Only re-embed if content was provided AND has real text
    const contentChanged = dto.content !== undefined;
    const hasText =
      typeof note.content === "string" && note.content.trim().length > 0;

    if (contentChanged && hasText) {
      // const result = await this.embeddingService.embedNoteChunks(note.id);

      // Debounced note chunks
      const result = await this.embeddingService.debounceEmbedNoteChunks(
        note.id,
        1500,
      );
      console.log("EMBED RESULT:", note.id, result);
    } else if (contentChanged && !hasText) {
      console.log("SKIP RE-EMBED: empty content for note", note.id);
    } else {
      console.log("SKIP RE-EMBED: content not provided in request", note.id);
    }

    return new NoteResponseDTO(note);
  }

  async getNoteById(noteId: string, userId: string) {
    const result = await this.noteRepository.findByIdWithRole(noteId, userId);

    if (!result) throw new Error("Note not found");

    return {
      note: new NoteResponseDTO(result.note),
      userRole: result.userRole,
      canEdit: result.userRole === "EDITOR" || result.userRole === "OWNER",
    };
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
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(query.limit ?? 10))); // clamp
    const skip = (page - 1) * limit;

    const filters = {
      workspaceId: query.workspaceId,
      authorId: query.authorId,
      type: query.type,
      searchQuery: query.searchQuery,
    };

    const [notes, total] = await Promise.all([
      this.noteRepository.findPaged(filters, { skip, limit }),
      this.noteRepository.count(filters),
    ]);

    return {
      data: NoteResponseDTO.fromArray(notes),
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

  async generateSummaryForNote(noteId: string): Promise<NoteResponseDTO> {
    const note = await this.noteRepository.findById(noteId);
    if (!note) throw new Error("Note not found");

    const text = htmlToText(note.content || "");
    if (!text) throw new Error("Nothing to summarize");

    const summary = await summarizeText(text);

    return this.addSummaryToNote(noteId, summary);
  }
}
