import { Router } from "express";
import { WorkspaceController } from "../controllers/workspace.controller";
import { authorizedMiddleware } from "../middleware/authorized.middleware";

export class WorkspaceRoutes {
  private router: Router;

  constructor(private workspaceController: WorkspaceController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use(authorizedMiddleware);

    // Create workspace
    this.router.post("/workspaces", this.workspaceController.createWorkspace);

    // Update workspace
    this.router.put("/workspace/:id", this.workspaceController.updateWorkspace);

    // Get
    this.router.get(
      "/workspaces",

      this.workspaceController.getUserWorkspaces,
    );

    this.router.post(
      "/workspace/join/:inviteLink",
      this.workspaceController.joinByInviteLink,
    );
  }
  getRouter(): Router {
    return this.router;
  }
}
