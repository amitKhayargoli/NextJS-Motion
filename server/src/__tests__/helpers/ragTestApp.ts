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

// RAG DI
import { RagRoutes } from "src/routes/rag.route";
import { RagController } from "src/controllers/rag.controller";
import { RagService } from "src/services/rag.service";

export function createRagTestApp() {
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
  // RAG DI + routes
  // -------------------------
  const ragService = new RagService(prismaClient);
  const ragController = new RagController(prismaClient, ragService);

  const ragRoutes = new RagRoutes(ragController);
  app.use("/api", ragRoutes.getRouter());

  return app;
}
