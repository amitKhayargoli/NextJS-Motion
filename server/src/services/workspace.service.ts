import { IWorkspaceRepository } from "../repositories/workspace.repository";
import {
  CreateWorkspaceDTO,
  UpdateWorkspaceDTO,
  AddMemberDTO,
  UpdateMemberRoleDTO,
  WorkspaceResponseDTO,
  WorkspaceWithRoleDTO,
  WorkspaceMemberDTO,
} from "../dtos/workspace.dto";
import { WorkspaceValidator } from "../dtos/validators/workspace.validator";
import { WorkspaceRole } from "../types/workspace.type";

export class WorkspaceService {
  constructor(private workspaceRepository: IWorkspaceRepository) {}

  async createWorkspace(
    dto: CreateWorkspaceDTO,
  ): Promise<WorkspaceResponseDTO> {
    // Validate
    const validation = WorkspaceValidator.validateCreateWorkspace(dto);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    // Create workspace
    const workspace = await this.workspaceRepository.create({
      name: dto.name,
      ownerId: dto.ownerId,
    });

    return new WorkspaceResponseDTO(workspace);
  }

  async updateWorkspace(
    dto: UpdateWorkspaceDTO,
  ): Promise<WorkspaceResponseDTO> {
    // Validate
    const validation = WorkspaceValidator.validateUpdateWorkspace(dto);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    // Check if workspace exists
    const exists = await this.workspaceRepository.exists(dto.workspaceId);
    if (!exists) {
      throw new Error("Workspace not found");
    }

    // Update workspace
    const workspace = await this.workspaceRepository.update(dto.workspaceId, {
      name: dto.name,
    });

    return new WorkspaceResponseDTO(workspace);
  }

  async getWorkspaceById(workspaceId: string): Promise<WorkspaceResponseDTO> {
    const workspace = await this.workspaceRepository.findById(workspaceId);

    if (!workspace) {
      throw new Error("Workspace not found");
    }

    return new WorkspaceResponseDTO(workspace);
  }

  async getUserWorkspaces(userId: string): Promise<WorkspaceWithRoleDTO[]> {
    const workspaces = await this.workspaceRepository.findByUserId(userId);
    return WorkspaceWithRoleDTO.fromArray(workspaces);
  }

  async getOwnedWorkspaces(ownerId: string): Promise<WorkspaceResponseDTO[]> {
    const workspaces = await this.workspaceRepository.findByOwnerId(ownerId);
    return WorkspaceResponseDTO.fromArray(workspaces);
  }

  async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
    const workspace = await this.workspaceRepository.findById(workspaceId);

    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Only owner can delete workspace
    if (workspace.ownerId !== userId) {
      throw new Error("Only workspace owner can delete the workspace");
    }

    await this.workspaceRepository.delete(workspaceId);
  }

  async addMember(dto: AddMemberDTO): Promise<void> {
    // Validate
    const validation = WorkspaceValidator.validateAddMember(dto);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    // Check if workspace exists
    const exists = await this.workspaceRepository.exists(dto.workspaceId);
    if (!exists) {
      throw new Error("Workspace not found");
    }

    // Check if user is already a member
    const isMember = await this.workspaceRepository.isMember(
      dto.workspaceId,
      dto.userId,
    );
    if (isMember) {
      throw new Error("User is already a member of this workspace");
    }

    await this.workspaceRepository.addMember(
      dto.workspaceId,
      dto.userId,
      dto.role,
    );
  }

  async removeMember(
    workspaceId: string,
    userId: string,
    requesterId: string,
  ): Promise<void> {
    const workspace = await this.workspaceRepository.findById(workspaceId);

    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Cannot remove owner
    if (userId === workspace.ownerId) {
      throw new Error("Cannot remove workspace owner");
    }

    // Check requester is owner or admin
    const requesterRole = await this.workspaceRepository.getUserRole(
      workspaceId,
      requesterId,
    );
    if (requesterRole !== WorkspaceRole.OWNER) {
      throw new Error("Only workspace owner can remove members");
    }

    await this.workspaceRepository.removeMember(workspaceId, userId);
  }

  async updateMemberRole(
    dto: UpdateMemberRoleDTO,
    requesterId: string,
  ): Promise<void> {
    // Validate
    const validation = WorkspaceValidator.validateUpdateMemberRole(dto);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    const workspace = await this.workspaceRepository.findById(dto.workspaceId);

    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Cannot change owner role
    if (dto.userId === workspace.ownerId) {
      throw new Error("Cannot change owner role");
    }

    // Check requester is owner
    const requesterRole = await this.workspaceRepository.getUserRole(
      dto.workspaceId,
      requesterId,
    );
    if (requesterRole !== WorkspaceRole.OWNER) {
      throw new Error("Only workspace owner can update member roles");
    }

    await this.workspaceRepository.updateMemberRole(
      dto.workspaceId,
      dto.userId,
      dto.role,
    );
  }

  async getWorkspaceMembers(
    workspaceId: string,
  ): Promise<WorkspaceMemberDTO[]> {
    const exists = await this.workspaceRepository.exists(workspaceId);
    if (!exists) {
      throw new Error("Workspace not found");
    }

    const members = await this.workspaceRepository.getMembers(workspaceId);
    return WorkspaceMemberDTO.fromArray(members);
  }

  async joinWorkspaceByInviteLink(
    inviteLink: string,
    userId: string,
  ): Promise<WorkspaceResponseDTO> {
    const workspace =
      await this.workspaceRepository.findByInviteLink(inviteLink);

    if (!workspace) {
      throw new Error("Invalid invite link");
    }

    // Check if user is already a member
    const isMember = await this.workspaceRepository.isMember(
      workspace.id,
      userId,
    );
    if (isMember) {
      throw new Error("You are already a member of this workspace");
    }

    // Add user as editor
    await this.workspaceRepository.addMember(
      workspace.id,
      userId,
      WorkspaceRole.VIEWER,
    );

    return new WorkspaceResponseDTO(workspace);
  }

  async regenerateInviteLink(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceResponseDTO> {
    const workspace = await this.workspaceRepository.findById(workspaceId);

    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Only owner can regenerate invite link
    if (workspace.ownerId !== userId) {
      throw new Error("Only workspace owner can regenerate invite link");
    }

    const newInviteLink = this.generateInviteLink();
    const updatedWorkspace = await this.workspaceRepository.update(
      workspaceId,
      {
        inviteLink: newInviteLink,
      },
    );

    return new WorkspaceResponseDTO(updatedWorkspace);
  }

  private generateInviteLink(): string {
    return require("crypto").randomBytes(16).toString("hex");
  }
}
