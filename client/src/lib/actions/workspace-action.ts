"use server";

import { revalidatePath } from "next/cache";
import {
  createWorkspace,
  getWorkspaces,
  updateWorkspace,
  joinWorkspaceByInvite,
  getWorkspaceMembers,
  updateWorkspaceMemberRole,
  removeWorkspaceMember,
} from "../api/workspace";

export const handleCreateWorkspace = async (formData: any) => {
  try {
    const res = await createWorkspace(formData);
    if (res.success) {
      revalidatePath("/workspace"); // revalidate workspace listing page
      return {
        success: true,
        data: res.data,
        message: "Workspace created successfully",
      };
    }
    return {
      success: false,
      message: res.message || "Failed to create workspace",
    };
  } catch (err: Error | any) {
    return {
      success: false,
      message: err.message || "Failed to create workspace",
    };
  }
};

export const handleGetWorkspaces = async () => {
  try {
    const res = await getWorkspaces();
    if (res.success) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      message: res.message || "Failed to fetch workspaces",
    };
  } catch (err: Error | any) {
    return {
      success: false,
      message: err.message || "Failed to fetch workspaces",
    };
  }
};

export const handleUpdateWorkspace = async (
  workspaceId: string,
  updateData: any,
) => {
  try {
    const res = await updateWorkspace(workspaceId, updateData);
    if (res.success) {
      revalidatePath("/workspace"); // revalidate workspace page
      return {
        success: true,
        data: res.data,
        message: "Workspace updated successfully",
      };
    }
    return {
      success: false,
      message: res.message || "Failed to update workspace",
    };
  } catch (err: Error | any) {
    return {
      success: false,
      message: err.message || "Failed to update workspace",
    };
  }
};

export const handleJoinWorkspace = async (inviteLink: string) => {
  try {
    const res = await joinWorkspaceByInvite(inviteLink);
    if (res.success) {
      revalidatePath("/workspace"); // refresh workspace list
      return {
        success: true,
        data: res.data,
        message: "Joined workspace successfully",
      };
    }
    return {
      success: false,
      message: res.message || "Failed to join workspace",
    };
  } catch (err: Error | any) {
    return {
      success: false,
      message: err.message || "Failed to join workspace",
    };
  }
};
export const handleGetWorkspaceMembers = async (workspaceId: string) => {
  try {
    const res = await getWorkspaceMembers(workspaceId);
    if (res.success) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      message: res.message || "Failed to fetch workspace members",
    };
  } catch (err: Error | any) {
    return {
      success: false,
      message: err.message || "Failed to fetch workspace members",
    };
  }
};

export const handleUpdateMemberRole = async (
  workspaceId: string,
  userId: string,
  role: string,
) => {
  try {
    const res = await updateWorkspaceMemberRole(workspaceId, userId, role);
    if (res.success) {
      revalidatePath("/workspace"); // revalidate workspace members
      return {
        success: true,
        data: res.data,
        message: "Member role updated successfully",
      };
    }
    return {
      success: false,
      message: res.message || "Failed to update member role",
    };
  } catch (err: Error | any) {
    return {
      success: false,
      message: err.message || "Failed to update member role",
    };
  }
};

export const handleRemoveMember = async (
  workspaceId: string,
  userId: string,
  requesterId: string,
) => {
  try {
    const res = await removeWorkspaceMember(workspaceId, userId, requesterId);

    if (res.success) {
      // revalidate the workspace pages that show members
      revalidatePath("/workspace");
      revalidatePath(`/workspace/${workspaceId}`);

      return {
        success: true,
        message: res.message || "Member removed successfully",
      };
    }

    return {
      success: false,
      message: res.message || "Failed to remove member",
    };
  } catch (err: Error | any) {
    return {
      success: false,
      message: err.message || "Failed to remove member",
    };
  }
};
