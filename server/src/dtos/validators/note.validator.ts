import { NoteType } from "../../types/note.type";
import { CreateNoteDTO, UpdateNoteDTO } from "../note.dto";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class NoteValidator {
  static validateCreateNote(dto: CreateNoteDTO): ValidationResult {
    const errors: string[] = [];

    // Title validation
    if (!dto.title || dto.title.trim().length === 0) {
      errors.push("Title is required");
    } else if (dto.title.length > 200) {
      errors.push("Title cannot exceed 200 characters");
    }

    // Author ID validation
    if (!dto.authorId || dto.authorId.trim().length === 0) {
      errors.push("Author ID is required");
    }

    // Workspace ID validation
    if (!dto.workspaceId || dto.workspaceId.trim().length === 0) {
      errors.push("Workspace ID is required");
    }

    // Note type validation
    if (dto.type && !Object.values(NoteType).includes(dto.type)) {
      errors.push("Invalid note type");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateUpdateNote(dto: UpdateNoteDTO): ValidationResult {
    const errors: string[] = [];

    // Note ID validation
    if (!dto.noteId || dto.noteId.trim().length === 0) {
      errors.push("Note ID is required");
    }

    // Check if at least one field is being updated
    if (!dto.title && !dto.content && !dto.summary) {
      errors.push("Must provide at least one field to update");
    }

    // Title validation (if provided)
    if (dto.title !== undefined) {
      if (dto.title.trim().length === 0) {
        errors.push("Title cannot be empty if provided");
      } else if (dto.title.length > 200) {
        errors.push("Title cannot exceed 200 characters");
      }
    }

    // Content validation (if provided)
    if (dto.content !== undefined) {
      if (dto.content.trim().length === 0) {
        errors.push("Content cannot be empty if provided");
      } else if (dto.content.length > 100000) {
        errors.push("Content cannot exceed 100,000 characters");
      }
    }

    // Summary validation (if provided)
    if (dto.summary !== undefined && dto.summary.length > 5000) {
      errors.push("Summary cannot exceed 5,000 characters");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
