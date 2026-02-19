// middleware/workspace-role.middleware.ts
import { Request, Response, NextFunction } from "express";
import { HttpError } from "../dtos/errors/http-error";
import { WorkspaceRepository } from "../repositories/workspace.repository";
import { PrismaClient, Role } from "../generated/prisma/client";
const prisma = new PrismaClient();
const workspaceRepository = new WorkspaceRepository(prisma);

export const requireWorkspaceRole = (allowedRoles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new HttpError(401, "Unauthorized - User not authenticated");
      }

      const workspaceId = req.params.workspaceId || req.body.workspaceId;

      if (!workspaceId) {
        throw new HttpError(400, "Workspace ID is required");
      }

      // Get user's role in the workspace using your existing method
      const userRole = await workspaceRepository.getUserRole(
        workspaceId,
        req.user.id,
      );

      if (!userRole) {
        throw new HttpError(403, "You are not a member of this workspace");
      }

      if (!allowedRoles.includes(userRole as Role)) {
        throw new HttpError(
          403,
          `Forbidden - Only workspace ${allowedRoles.join(" or ")} can perform this action`,
        );
      }

      // Attach role to request for use in controller if needed
      req.userRole = userRole as Role;

      return next();
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };
};

// Convenience exports for common permission checks
export const ownerOnly = requireWorkspaceRole([Role.OWNER]);
export const editorOrAbove = requireWorkspaceRole([Role.OWNER, Role.EDITOR]);
export const viewerOrAbove = requireWorkspaceRole([
  Role.OWNER,
  Role.EDITOR,
  Role.VIEWER,
]);
