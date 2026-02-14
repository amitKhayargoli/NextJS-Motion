import express from "express";

import { WorkspaceController } from "src/controllers/workspace.controller";
import { WorkspaceService } from "src/services/workspace.service";
import { WorkspaceRepository } from "src/repositories/workspace.repository";

// ✅ AUTH
import { AuthController } from "src/controllers/auth.controller";
import { UserService } from "src/services/user.service";
import { Router } from "express";
import { WorkspaceRoutes } from "src/routes/workspace.route";
import { PrismaClient } from "src/generated/prisma/client";

export function createWorkspaceTestApp() {
  const app = express();
  app.use(express.json());

  // --- Auth router (minimal) ---
  const authController = new AuthController();
  const authRouter = Router();

  authRouter.post("/register", authController.register.bind(authController));
  authRouter.post("/login", authController.login.bind(authController));
  authRouter.get("/me", authController.me?.bind(authController));

  app.use("/api/auth", authRouter);

  const prismaClient = new PrismaClient();
  // --- Workspace routes ---
  const workspaceRepository = new WorkspaceRepository(prismaClient);
  const workspaceService = new WorkspaceService(workspaceRepository);
  const workspaceController = new WorkspaceController(workspaceService);

  const workspaceRoutes = new WorkspaceRoutes(workspaceController);
  app.use("/api", workspaceRoutes.getRouter());

  return app;
}
