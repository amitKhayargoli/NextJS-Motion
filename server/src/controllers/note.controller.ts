import { Request, Response } from "express";
import {
  CreateNoteDTO,
  UpdateNoteDTO,
  GetNotesQueryDTO,
} from "../dtos/note.dto";
import { NoteService } from "../services/note.service";

export class NoteController {
  constructor(private noteService: NoteService) {}

  async createNote(req: Request, res: Response): Promise<void> {
    try {
      const dto = new CreateNoteDTO(req.body);
      const note = await this.noteService.createNote(dto);

      res.status(201).json({
        success: true,
        data: note,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async updateNote(req: Request, res: Response): Promise<void> {
    try {
      const dto = new UpdateNoteDTO(req.params.id, req.body);
      const note = await this.noteService.updateNote(dto);

      res.status(200).json({
        success: true,
        data: note,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getNoteById(req: Request, res: Response): Promise<void> {
    try {
      const note = await this.noteService.getNoteById(req.params.id);

      res.status(200).json({
        success: true,
        data: note,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getWorkspaceNotes(req: Request, res: Response): Promise<void> {
    try {
      const notes = await this.noteService.getWorkspaceNotes(
        req.params.workspaceId,
      );

      res.status(200).json({
        success: true,
        data: notes,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getAuthorNotes(req: Request, res: Response): Promise<void> {
    try {
      const notes = await this.noteService.getAuthorNotes(req.params.authorId);

      res.status(200).json({
        success: true,
        data: notes,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getNotes(req: Request, res: Response): Promise<void> {
    try {
      const query = new GetNotesQueryDTO(req.query);
      const result = await this.noteService.getNotes(query);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async deleteNote(req: Request, res: Response): Promise<void> {
    try {
      await this.noteService.deleteNote(req.params.id);

      res.status(200).json({
        success: true,
        message: "Note deleted successfully",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async addSummary(req: Request, res: Response): Promise<void> {
    try {
      const { summary } = req.body;
      const note = await this.noteService.addSummaryToNote(
        req.params.id,
        summary,
      );

      res.status(200).json({
        success: true,
        data: note,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private handleError(error: unknown, res: Response): void {
    if (error instanceof Error) {
      // Validation errors
      if (error.message.startsWith("Validation failed")) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      // Not found errors
      if (error.message === "Note not found") {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      // Generic error
      res.status(500).json({
        success: false,
        error: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        error: "An unknown error occurred",
      });
    }
  }
}
