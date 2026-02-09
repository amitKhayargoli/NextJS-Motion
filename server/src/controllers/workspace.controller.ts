import { Request, Response } from "express";
import { WorkspaceService } from "../services/workspace.service";
import {
  CreateWorkspaceDTO,
  UpdateWorkspaceDTO,
  AddMemberDTO,
  UpdateMemberRoleDTO,
} from "../dtos/workspace.dto";

export class WorkspaceController {
  constructor(private workspaceService: WorkspaceService) {
    // Bind methods
    this.createWorkspace = this.createWorkspace.bind(this);
    this.updateWorkspace = this.updateWorkspace.bind(this);
    this.getWorkspaceById = this.getWorkspaceById.bind(this);
    this.getUserWorkspaces = this.getUserWorkspaces.bind(this);
    this.deleteWorkspace = this.deleteWorkspace.bind(this);
    this.addMember = this.addMember.bind(this);
    this.removeMember = this.removeMember.bind(this);
    this.updateMemberRole = this.updateMemberRole.bind(this);
    this.getMembers = this.getMembers.bind(this);
    this.joinByInviteLink = this.joinByInviteLink.bind(this);
    this.regenerateInviteLink = this.regenerateInviteLink.bind(this);
  }

  async createWorkspace(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
      }

      // Combine frontend data with ownerId from auth
      const dto = new CreateWorkspaceDTO({
        ...req.body,
        ownerId: userId, // override/ensure ownerId is always the logged-in user
      });

      const workspace = await this.workspaceService.createWorkspace(dto);

      res.status(201).json({
        success: true,
        data: workspace,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async updateWorkspace(req: Request, res: Response): Promise<void> {
    try {
      const dto = new UpdateWorkspaceDTO(req.params.id, req.body);
      const workspace = await this.workspaceService.updateWorkspace(dto);

      res.status(200).json({
        success: true,
        data: workspace,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getWorkspaceById(req: Request, res: Response): Promise<void> {
    try {
      const workspace = await this.workspaceService.getWorkspaceById(
        req.params.id,
      );

      res.status(200).json({
        success: true,
        data: workspace,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getUserWorkspaces(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const workspaces = await this.workspaceService.getUserWorkspaces(userId!);

      res.status(200).json({
        success: true,
        data: workspaces,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async deleteWorkspace(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.body.userId; // You'd get this from auth middleware
      await this.workspaceService.deleteWorkspace(req.params.id, userId);

      res.status(200).json({
        success: true,
        message: "Workspace deleted successfully",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async addMember(req: Request, res: Response): Promise<void> {
    try {
      const dto = new AddMemberDTO(req.params.id, req.body);
      await this.workspaceService.addMember(dto);

      res.status(200).json({
        success: true,
        message: "Member added successfully",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async removeMember(req: Request, res: Response): Promise<void> {
    try {
      const requesterId = req.body.requesterId; // From auth middleware
      await this.workspaceService.removeMember(
        req.params.id,
        req.params.userId,
        requesterId,
      );

      res.status(200).json({
        success: true,
        message: "Member removed successfully",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async updateMemberRole(req: Request, res: Response): Promise<void> {
    try {
      const requesterId = req.body.requesterId; // From auth middleware
      const dto = new UpdateMemberRoleDTO(
        req.params.id,
        req.params.userId,
        req.body,
      );
      await this.workspaceService.updateMemberRole(dto, requesterId);

      res.status(200).json({
        success: true,
        message: "Member role updated successfully",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getMembers(req: Request, res: Response): Promise<void> {
    try {
      const members = await this.workspaceService.getWorkspaceMembers(
        req.params.id,
      );

      res.status(200).json({
        success: true,
        data: members,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async joinByInviteLink(req: Request, res: Response): Promise<void> {
    try {
      const { inviteLink } = req.params;
      const { userId } = req.body;
      const workspace = await this.workspaceService.joinWorkspaceByInviteLink(
        inviteLink,
        userId,
      );

      res.status(200).json({
        success: true,
        data: workspace,
        message: "Successfully joined workspace",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async regenerateInviteLink(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.body.userId; // From auth middleware
      const workspace = await this.workspaceService.regenerateInviteLink(
        req.params.id,
        userId,
      );

      res.status(200).json({
        success: true,
        data: workspace,
        message: "Invite link regenerated successfully",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private handleError(error: unknown, res: Response): void {
    if (error instanceof Error) {
      // Validation errors
      if (error.message.startsWith("Validation failed")) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      // Not found errors
      if (error.message === "Workspace not found") {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      // Permission errors
      if (
        error.message.includes("Only workspace owner") ||
        error.message.includes("Cannot remove") ||
        error.message.includes("Cannot change")
      ) {
        res.status(403).json({
          success: false,
          error: error.message,
        });
        return;
      }

      // Conflict errors
      if (error.message.includes("already a member")) {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }

      // Generic error
      res.status(500).json({
        success: false,
        error: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        error: "An unknown error occurred",
      });
    }
  }
}
