import { create } from "zustand";

export type WorkspaceRole = "OWNER" | "EDITOR" | "VIEWER";

export type Workspace = {
  id: string;
  name: string;
  userRole: WorkspaceRole;
  ownerId: string;
  inviteLink?: string;
  createdAt?: string;
  updatedAt?: string;
};

type WorkspaceState = {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;

  setWorkspaces: (list: Workspace[]) => void;
  setActiveWorkspaceId: (id: string | null) => void;

  getActiveWorkspace: () => Workspace | null;
};

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  activeWorkspaceId: null,

  setWorkspaces: (list) => set({ workspaces: list }),
  setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),

  getActiveWorkspace: () => {
    const { workspaces, activeWorkspaceId } = get();
    if (!activeWorkspaceId) return null;
    return workspaces.find((w) => w.id === activeWorkspaceId) ?? null;
  },
}));
