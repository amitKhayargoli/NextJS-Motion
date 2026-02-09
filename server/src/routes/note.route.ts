import { Router } from "express";
import { NoteController } from "../controllers/note.controller";

export class NoteRoutes {
  private router: Router;

  constructor(private noteController: NoteController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Create note
    this.router.post("/notes", (req, res) =>
      this.noteController.createNote(req, res),
    );

    // Update note
    this.router.put("/notes/:id", (req, res) =>
      this.noteController.updateNote(req, res),
    );

    // Get single note
    this.router.get("/notes/:id", (req, res) =>
      this.noteController.getNoteById(req, res),
    );

    // Get all notes with filters and pagination
    this.router.get("/notes", (req, res) =>
      this.noteController.getNotes(req, res),
    );

    // Get workspace notes
    this.router.get("/workspaces/:workspaceId/notes", (req, res) =>
      this.noteController.getWorkspaceNotes(req, res),
    );

    // Get author notes
    this.router.get("/users/:authorId/notes", (req, res) =>
      this.noteController.getAuthorNotes(req, res),
    );

    // Delete note
    this.router.delete("/notes/:id", (req, res) =>
      this.noteController.deleteNote(req, res),
    );

    // Add summary to note
    this.router.patch("/notes/:id/summary", (req, res) =>
      this.noteController.addSummary(req, res),
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
