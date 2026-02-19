import { Router } from "express";
import { WorkspaceController } from "../controllers/workspace.controller";
import { authorizedMiddleware } from "../middleware/authorized.middleware";
import { ownerOnly } from "../middleware/owner-only.middleware";

export class WorkspaceRoutes {
  private router: Router;

  constructor(private workspaceController: WorkspaceController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use(authorizedMiddleware);

    // Create workspace (any authenticated user)
    this.router.post("/workspaces", this.workspaceController.createWorkspace);

    // Update workspace - OWNER ONLY
    this.router.put(
      "/workspace/:id",
      ownerOnly,
      this.workspaceController.updateWorkspace,
    );

    // Get user's workspaces (any authenticated user)
    this.router.get("/workspaces", this.workspaceController.getUserWorkspaces);

    // Get workspace members (Owner only)
    this.router.get(
      "/workspace/:workspaceId/members",
      ownerOnly,
      this.workspaceController.getMembers,
    );

    // Join workspace (any authenticated user)
    this.router.post(
      "/workspace/join",
      this.workspaceController.joinByInviteLink,
    );

    // Manage roles - OWNER ONLY
    this.router.put(
      "/workspace/:workspaceId/roles",
      ownerOnly,
      this.workspaceController.manageRoles,
    );

    this.router.delete(
      "/workspace/:workspaceId/members/:userId",
      ownerOnly,
      this.workspaceController.removeMember,
    );
  }
  getRouter(): Router {
    return this.router;
  }
}
