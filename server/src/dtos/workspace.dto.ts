import { WorkspaceRole } from "../types/workspace.type";

export class CreateWorkspaceDTO {
  name: string;
  ownerId: string;

  constructor(data: any) {
    this.name = data.name;
    this.ownerId = data.ownerId;
  }
}

export class UpdateWorkspaceDTO {
  workspaceId: string;
  name?: string;

  constructor(workspaceId: string, data: any) {
    this.workspaceId = workspaceId;
    this.name = data.name;
  }
}

export class AddMemberDTO {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;

  constructor(workspaceId: string, data: any) {
    this.workspaceId = workspaceId;
    this.userId = data.userId;
    this.role = data.role || WorkspaceRole.EDITOR;
  }
}

export class UpdateMemberRoleDTO {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;

  constructor(workspaceId: string, userId: string, data: any) {
    this.workspaceId = workspaceId;
    this.userId = userId;
    this.role = data.role;
  }
}

export class WorkspaceResponseDTO {
  id: string;
  name: string;
  inviteLink: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;

  constructor(workspace: any) {
    this.id = workspace.id;
    this.name = workspace.name;
    this.inviteLink = workspace.inviteLink;
    this.ownerId = workspace.ownerId;
    this.createdAt =
      workspace.createdAt instanceof Date
        ? workspace.createdAt.toISOString()
        : workspace.createdAt;
    this.updatedAt =
      workspace.updatedAt instanceof Date
        ? workspace.updatedAt.toISOString()
        : workspace.updatedAt;
  }

  static fromArray(workspaces: any[]): WorkspaceResponseDTO[] {
    return workspaces.map((workspace) => new WorkspaceResponseDTO(workspace));
  }
}

export class WorkspaceWithRoleDTO extends WorkspaceResponseDTO {
  userRole: WorkspaceRole;

  constructor(workspace: any) {
    super(workspace);
    this.userRole = workspace.userRole;
  }

  static fromArray(workspaces: any[]): WorkspaceWithRoleDTO[] {
    return workspaces.map((workspace) => new WorkspaceWithRoleDTO(workspace));
  }
}

export class WorkspaceMemberDTO {
  userId: string;
  role: WorkspaceRole;
  email?: string;
  username?: string;
  profilePicture?: string;

  constructor(member: any) {
    this.userId = member.userId;
    this.role = member.role;
    this.email = member.user?.email;
    this.username = member.user?.username;
    this.profilePicture = member.user?.profilePicture;
  }

  static fromArray(members: any[]): WorkspaceMemberDTO[] {
    return members.map((member) => new WorkspaceMemberDTO(member));
  }
}
