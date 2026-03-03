import express from "express";

import { WorkspaceController } from "src/controllers/workspace.controller";
import { WorkspaceService } from "src/services/workspace.service";
import { WorkspaceRepository } from "src/repositories/workspace.repository";

import { AuthController } from "src/controllers/auth.controller";
import { UserService } from "src/services/user.service";
import { UserRepository } from "src/repositories/user.repository";
import { Router } from "express";
import { WorkspaceRoutes } from "src/routes/workspace.route";
import { PrismaClient } from "src/generated/prisma/client";

export function createWorkspaceTestApp() {
  const app = express();
  app.use(express.json());

  const prismaClient = new PrismaClient();

  // --- Auth router (minimal) ---
  const userRepository = new UserRepository(prismaClient);
  const userService = new UserService(userRepository);
  const authController = new AuthController(userService);
  const authRouter = Router();

  authRouter.post("/register", authController.register);
  authRouter.post("/login", authController.login);
  authRouter.get("/me", authController.me);

  app.use("/api/auth", authRouter);

  // --- Workspace routes ---
  const workspaceRepository = new WorkspaceRepository(prismaClient);
  const workspaceService = new WorkspaceService(workspaceRepository);
  const workspaceController = new WorkspaceController(workspaceService);

  const workspaceRoutes = new WorkspaceRoutes(workspaceController);
  app.use("/api", workspaceRoutes.getRouter());

  return app;
}
