import { Router } from "express";
import { WorkspaceController } from "../controllers/workspace.controller";
import { authorizedMiddleware } from "../middleware/authorized.middleware";
import { ownerOnly, viewerOrAbove } from "../middleware/owner-only.middleware";

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

    // Access requests
    // POST: VIEWER requests edit access
    this.router.post(
      "/workspace/:workspaceId/access-request",
      viewerOrAbove,
      this.workspaceController.requestEditAccess,
    );

    // GET: VIEWER checks their own request status
    this.router.get(
      "/workspace/:workspaceId/access-request/my",
      viewerOrAbove,
      this.workspaceController.getMyAccessRequest,
    );

    // GET: OWNER lists all pending requests
    this.router.get(
      "/workspace/:workspaceId/access-requests",
      ownerOnly,
      this.workspaceController.getPendingRequests,
    );

    // PUT: OWNER approves a request
    this.router.put(
      "/workspace/:workspaceId/access-request/:requestId/approve",
      ownerOnly,
      this.workspaceController.approveRequest,
    );

    // PUT: OWNER denies a request
    this.router.put(
      "/workspace/:workspaceId/access-request/:requestId/deny",
      ownerOnly,
      this.workspaceController.denyRequest,
    );
  }
  getRouter(): Router {
    return this.router;
  }
}
