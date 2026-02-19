import { Request, Response } from "express";
import {
  CreateNoteDTO,
  UpdateNoteDTO,
  GetNotesQueryDTO,
} from "../dtos/note.dto";
import { NoteService } from "../services/note.service";
import { NoteType } from "../types/note.type";

export class NoteController {
  constructor(private noteService: NoteService) {}

  async createNote(req: Request, res: Response): Promise<void> {
    try {
      const authorId = (req as any).user?.id;

      if (!authorId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized: missing user",
        });
        return;
      }

      const dto = new CreateNoteDTO({
        ...req.body,
        authorId,
      });
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

  async getNoteById(req: any, res: any) {
    try {
      const noteId = req.params.id;

      const userId = req.user?.id || req.user?._id || req.user?.userId;
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const data = await this.noteService.getNoteById(noteId, userId);

      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return res
        .status(404)
        .json({ success: false, message: err.message || "Note not found" });
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

  parseNoteType = (value: unknown): NoteType | undefined => {
    if (typeof value !== "string") return undefined;
    return (Object.values(NoteType) as string[]).includes(value)
      ? (value as NoteType)
      : undefined;
  };

  async getNotes(req: Request, res: Response) {
    try {
      const workspaceId = req.query.workspaceId as string;
      const type = this.parseNoteType(req.query.type);

      const searchQuery = req.query.searchQuery as string;

      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 10);

      // from token middleware
      const authorId = (req as any).user?._id;

      if (!workspaceId) {
        return res.status(400).json({
          success: false,
          message: "workspaceId is required",
        });
      }

      const result = await this.noteService.getNotes({
        workspaceId,
        authorId,
        type,
        searchQuery,
        page,
        limit,
      });

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.log("GET NOTES ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
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

  async addSummary(req: any, res: any) {
    try {
      const noteId = req.params.id;

      const updated = await this.noteService.generateSummaryForNote(noteId);

      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || "Failed to summarize",
      });
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
