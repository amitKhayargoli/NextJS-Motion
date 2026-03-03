import { Router } from "express";
import { NoteController } from "src/controllers/note.controller";
import { authorizedMiddleware } from "../middleware/authorized.middleware";

// Workspace-level viewer middleware (checks membership in workspace)
import { viewerOrAbove } from "../middleware/owner-only.middleware";

// Note-level role middleware (checks note access by deriving workspace from note)
import {
  noteEditorOrAbove,
  noteViewerOrAbove,
} from "../middleware/note-role.middleware";

export class NoteRoutes {
  private router: Router;

  constructor(private noteController: NoteController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use(authorizedMiddleware);

    // ---------------------------------------
    // Create note
    // ---------------------------------------
    // For create, you can use viewerOrAbove IF your middleware reads workspaceId from body.
    // Otherwise keep it open and validate inside controller/service.
    // Recommended: viewerOrAbove (workspace membership) for create.
    this.router.post("/notes", viewerOrAbove, (req, res) =>
      this.noteController.createNote(req, res),
    );

    // ---------------------------------------
    // Transcript (MUST come before /notes/:id)
    // ---------------------------------------
    this.router.get(
      "/notes/:audioFileId/transcript",
      noteViewerOrAbove,
      (req, res) => this.noteController.getTranscriptByAudioFileId(req, res),
    );

    // ---------------------------------------
    // Read note
    // ---------------------------------------
    this.router.get("/notes/:id", noteViewerOrAbove, (req, res) =>
      this.noteController.getNoteById(req, res),
    );

    // ---------------------------------------
    // List notes
    // ---------------------------------------
    // If list is global, you must filter by workspaces user belongs to inside controller/service.
    // Middleware should NOT require a single workspaceId here unless your API is scoped.
    this.router.get("/notes", (req, res) =>
      this.noteController.getNotes(req, res),
    );

    // ---------------------------------------
    // Workspace notes (workspaceId is in params → workspace middleware is correct)
    // ---------------------------------------
    this.router.get(
      "/workspaces/:workspaceId/notes",
      viewerOrAbove,
      (req, res) => this.noteController.getWorkspaceNotes(req, res),
    );

    // ---------------------------------------
    // Author notes
    // ---------------------------------------
    // This route typically should be: user can fetch their own notes, and/or notes visible to them.
    // DO NOT use workspace viewer middleware here because no workspaceId param.
    this.router.get("/users/:authorId/notes", (req, res) =>
      this.noteController.getAuthorNotes(req, res),
    );

    // ---------------------------------------
    // Update note
    // ---------------------------------------
    this.router.put("/notes/:id", noteEditorOrAbove, (req, res) =>
      this.noteController.updateNote(req, res),
    );

    // ---------------------------------------
    // Add summary
    // ---------------------------------------
    this.router.patch("/notes/:id/summary", noteEditorOrAbove, (req, res) =>
      this.noteController.addSummary(req, res),
    );

    // ---------------------------------------
    // Delete note
    // ---------------------------------------
    this.router.delete("/notes/:id", noteEditorOrAbove, (req, res) =>
      this.noteController.deleteNote(req, res),
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
