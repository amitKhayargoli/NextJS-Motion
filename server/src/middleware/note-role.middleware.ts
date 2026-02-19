import { Request, Response, NextFunction } from "express";
import { PrismaClient, Role } from "../generated/prisma/client";
import { HttpError } from "../dtos/errors/http-error";
import { WorkspaceRepository } from "../repositories/workspace.repository";

const prisma = new PrismaClient();
const workspaceRepository = new WorkspaceRepository(prisma);

export const requireNoteRole = (allowedRoles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new HttpError(401, "Unauthorized - User not authenticated");
      }

      const noteId = req.params.id || (req.params as any).noteId;
      if (!noteId) {
        throw new HttpError(400, "Note ID is required");
      }

      const note = await prisma.note.findUnique({
        where: { id: noteId },
        select: {
          workspaceId: true,
          workspace: { select: { ownerId: true } },
        },
      });

      if (!note) {
        throw new HttpError(404, "Note not found");
      }

      if (note.workspace.ownerId === req.user.id) {
        (req as any).userRole = Role.OWNER;
        return next();
      }

      const userRole = await workspaceRepository.getUserRole(
        note.workspaceId,
        req.user.id,
      );

      if (!userRole) {
        throw new HttpError(403, "You are not a member of this workspace");
      }

      if (!allowedRoles.includes(userRole as Role)) {
        throw new HttpError(
          403,
          `Forbidden - Only ${allowedRoles.join(" or ")} can perform this action`,
        );
      }

      // Attach role if needed
      (req as any).userRole = userRole as Role;

      return next();
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };
};

export const noteOwnerOnly = requireNoteRole([Role.OWNER]);
export const noteEditorOrAbove = requireNoteRole([Role.OWNER, Role.EDITOR]);
export const noteViewerOrAbove = requireNoteRole([
  Role.OWNER,
  Role.EDITOR,
  Role.VIEWER,
]);
