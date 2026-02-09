import { AccessRequest } from "@generated/prisma/client";
import {
  IWorkspace,
  ICreateWorkspaceData,
  IUpdateWorkspaceData,
  IWorkspaceWithRole,
  IWorkspaceMember,
} from "../types/workspace.type";
import { WorkspaceRole } from "../types/workspace.type";
import { PrismaClient } from "@generated/prisma/internal/class";
import { randomBytes } from "crypto";

export interface IWorkspaceRepository {
  create(data: ICreateWorkspaceData): Promise<IWorkspace>;
  findById(id: string): Promise<IWorkspace | null>;
  findByOwnerId(ownerId: string): Promise<IWorkspace[]>;
  findByUserId(userId: string): Promise<IWorkspaceWithRole[]>;
  findByInviteLink(inviteLink: string): Promise<IWorkspace | null>;
  update(id: string, data: IUpdateWorkspaceData): Promise<IWorkspace>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;

  // Member management
  addMember(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole,
  ): Promise<void>;
  removeMember(workspaceId: string, userId: string): Promise<void>;
  updateMemberRole(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole,
  ): Promise<void>;
  getMembers(workspaceId: string): Promise<IWorkspaceMember[]>;
  isMember(workspaceId: string, userId: string): Promise<boolean>;
  getUserRole(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceRole | null>;

  joinWithInviteLink(workspaceId: string, userId: string): Promise<void>;

  // Access requests
  requestEditAccess(workspaceId: string, userId: string): Promise<void>;
  approveEditAccess(requestId: string): Promise<void>;
  denyEditAccess(requestId: string): Promise<void>;
  getPendingRequests(workspaceId: string): Promise<AccessRequest[]>;
}

export class WorkspaceRepository implements IWorkspaceRepository {
  constructor(private prisma: PrismaClient) {}
  async requestEditAccess(workspaceId: string, userId: string): Promise<void> {
    const existing = await this.prisma.accessRequest.findFirst({
      where: { workspaceId, userId, status: "PENDING" },
    });
    if (existing) return; // already requested

    await this.prisma.accessRequest.create({
      data: { workspaceId, userId },
    });
  }

  async approveEditAccess(requestId: string): Promise<void> {
    const request = await this.prisma.accessRequest.findUnique({
      where: { id: requestId },
    });
    if (!request || request.status !== "PENDING") return;

    // Upgrade user role
    await this.updateMemberRole(
      request.workspaceId,
      request.userId,
      WorkspaceRole.EDITOR,
    );

    // Mark request as approved
    await this.prisma.accessRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED" },
    });
  }

  async denyEditAccess(requestId: string): Promise<void> {
    await this.prisma.accessRequest.update({
      where: { id: requestId },
      data: { status: "DENIED" },
    });
  }

  async getPendingRequests(workspaceId: string): Promise<AccessRequest[]> {
    return this.prisma.accessRequest.findMany({
      where: { workspaceId, status: "PENDING" },
      include: { user: true },
    });
  }

  // join as viewer
  async joinWithInviteLink(workspaceId: string, userId: string): Promise<void> {
    const isAlreadyMember = await this.isMember(workspaceId, userId);
    if (isAlreadyMember) return;

    await this.addMember(workspaceId, userId, WorkspaceRole.VIEWER);
  }

  private generateInviteLink(): string {
    return randomBytes(16).toString("hex");
  }

  async create(data: ICreateWorkspaceData): Promise<IWorkspace> {
    const inviteLink = this.generateInviteLink();

    const workspace = await this.prisma.workspace.create({
      data: {
        name: data.name,
        inviteLink,
        ownerId: data.ownerId,
        UserRoles: {
          create: {
            userId: data.ownerId,
            role: WorkspaceRole.OWNER,
          },
        },
      },
    });

    return this.mapToIWorkspace(workspace);
  }

  async findById(id: string): Promise<IWorkspace | null> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
    });

    return workspace ? this.mapToIWorkspace(workspace) : null;
  }

  async findByOwnerId(ownerId: string): Promise<IWorkspace[]> {
    const workspaces = await this.prisma.workspace.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
    });

    return workspaces.map((w: any) => this.mapToIWorkspace(w));
  }

  async findByUserId(userId: string): Promise<IWorkspaceWithRole[]> {
    const userRoles = await this.prisma.userRoles.findMany({
      where: { userId },
      include: {
        workspace: true,
      },
      orderBy: { workspace: { createdAt: "desc" } },
    });

    return userRoles.map((ur: any) => ({
      ...this.mapToIWorkspace(ur.workspace),
      userRole: ur.role as WorkspaceRole,
    }));
  }

  async findByInviteLink(inviteLink: string): Promise<IWorkspace | null> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { inviteLink },
    });

    return workspace ? this.mapToIWorkspace(workspace) : null;
  }

  async update(id: string, data: IUpdateWorkspaceData): Promise<IWorkspace> {
    const workspace = await this.prisma.workspace.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.inviteLink && { inviteLink: data.inviteLink }),
        updatedAt: new Date(),
      },
    });

    return this.mapToIWorkspace(workspace);
  }

  async delete(id: string): Promise<void> {
    // Delete related records first
    await this.prisma.userRoles.deleteMany({
      where: { workspaceId: id },
    });

    await this.prisma.note.deleteMany({
      where: { workspaceId: id },
    });

    await this.prisma.task.deleteMany({
      where: { workspaceId: id },
    });

    // Delete workspace
    await this.prisma.workspace.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.workspace.count({
      where: { id },
    });
    return count > 0;
  }

  // Member management
  async addMember(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole,
  ): Promise<void> {
    await this.prisma.userRoles.create({
      data: {
        workspaceId,
        userId,
        role,
      },
    });
  }

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    await this.prisma.userRoles.deleteMany({
      where: {
        workspaceId,
        userId,
      },
    });
  }

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole,
  ): Promise<void> {
    await this.prisma.userRoles.updateMany({
      where: {
        workspaceId,
        userId,
      },
      data: {
        role,
      },
    });
  }

  async getMembers(workspaceId: string): Promise<IWorkspaceMember[]> {
    const members = await this.prisma.userRoles.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    });

    return members.map((m: any) => ({
      userId: m.userId,
      workspaceId,
      WorkspaceRole: m.role as WorkspaceRole,
      user: m.user,
    }));
  }

  async isMember(workspaceId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.userRoles.count({
      where: {
        workspaceId,
        userId,
      },
    });
    return count > 0;
  }

  async getUserRole(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceRole | null> {
    const userRole = await this.prisma.userRoles.findFirst({
      where: {
        workspaceId,
        userId,
      },
    });

    return userRole ? (userRole.role as WorkspaceRole) : null;
  }

  private mapToIWorkspace(workspace: any): IWorkspace {
    return {
      id: workspace.id,
      name: workspace.name,
      inviteLink: workspace.inviteLink,
      ownerId: workspace.ownerId,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  }
}
