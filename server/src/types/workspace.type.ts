export enum WorkspaceRole {
  OWNER = "OWNER",
  EDITOR = "EDITOR",
  VIEWER = "VIEWER",
}
export interface IWorkspace {
  id: string;
  name: string;
  inviteLink: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateWorkspaceData {
  name: string;
  ownerId: string;
}

export interface IUpdateWorkspaceData {
  name?: string;
  inviteLink?: string;
}

/**
 * Workspace as seen by a specific user
 * (used when listing user workspaces)
 */
export interface IWorkspaceWithRole {
  id: string;
  name: string;
  inviteLink: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  userRole: WorkspaceRole;
}

/**
 * Membership record (join table)
 */
export interface IWorkspaceMember {
  userId: string;
  workspaceId: string;
  WorkspaceRole: WorkspaceRole;
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

export interface IWorkspaceFilters {
  ownerId?: string;
  name?: string;
}
