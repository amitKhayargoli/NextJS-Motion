import express, { Router } from "express";
import { PrismaClient } from "src/generated/prisma/client";

import { AuthController } from "src/controllers/auth.controller";
import { UserService } from "src/services/user.service";
import { UserRepository } from "src/repositories/user.repository";

// Workspace DI (needed for creating workspace + setting roles in setup)
import { WorkspaceRoutes } from "src/routes/workspace.route";
import { WorkspaceController } from "src/controllers/workspace.controller";
import { WorkspaceService } from "src/services/workspace.service";
import { WorkspaceRepository } from "src/repositories/workspace.repository";

// Notes DI
import { NoteRoutes } from "src/routes/note.route";
import { NoteController } from "src/controllers/note.controller";
import { NoteService } from "src/services/note.service";
import { NoteRepository } from "src/repositories/note.repository";

export function createNoteTestApp() {
  const app = express();
  app.use(express.json());

  // -------------------------
  // Prisma
  // -------------------------
  const prismaClient = new PrismaClient();

  // -------------------------
  // Auth router (minimal)
  // -------------------------
  const userRepository = new UserRepository(prismaClient);
  const userService = new UserService(userRepository);
  const authController = new AuthController(userService);
  const authRouter = Router();

  authRouter.post("/register", authController.register);
  authRouter.post("/login", authController.login);
  authRouter.get("/me", authController.me);

  app.use("/api/auth", authRouter);

  // -------------------------
  // Workspace DI + routes
  // -------------------------
  const workspaceRepo = new WorkspaceRepository(prismaClient);
  const workspaceService = new WorkspaceService(workspaceRepo);
  const workspaceController = new WorkspaceController(workspaceService);
  const workspaceRoutes = new WorkspaceRoutes(workspaceController);

  app.use("/api", workspaceRoutes.getRouter());

  // -------------------------
  // Note DI + routes
  // -------------------------
  const noteRepo = new NoteRepository(prismaClient);
  const noteService = new NoteService(noteRepo, prismaClient);
  const noteController = new NoteController(noteService);

  const noteRoutes = new NoteRoutes(noteController);
  app.use("/api", noteRoutes.getRouter());

  return app;
}
