import axios from "./axios";
import { API } from "./endpoints";

export const createWorkspace = async (workspaceData: any) => {
  try {
    const response = await axios.post(API.WORKSPACE.CREATE, workspaceData);
    return response.data;
  } catch (err: Error | any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to create workspace";

    throw new Error(message);
  }
};

export const getWorkspaces = async () => {
  try {
    const response = await axios.get(API.WORKSPACE.GET_ALL);
    return response.data;
  } catch (err: Error | any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to fetch workspaces";

    throw new Error(message);
  }
};

export const updateWorkspace = async (workspaceId: string, updateData: any) => {
  try {
    const response = await axios.put(
      API.WORKSPACE.UPDATE(workspaceId),
      updateData,
    );
    return response.data;
  } catch (err: Error | any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to update workspace";

    throw new Error(message);
  }
};

export const joinWorkspaceByInvite = async (inviteLink: string) => {
  try {
    const response = await axios.post(API.WORKSPACE.JOIN(inviteLink));
    return response.data;
  } catch (err: Error | any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to join workspace";

    throw new Error(message);
  }
};

export const getWorkspaceMembers = async (workspaceId: string) => {
  try {
    const response = await axios.get(API.WORKSPACE.GET_MEMBERS(workspaceId));
    return response.data;
  } catch (err: Error | any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to fetch workspace members";

    throw new Error(message);
  }
};

export const updateWorkspaceMemberRole = async (
  workspaceId: string,
  userId: string,
  role: string,
) => {
  try {
    const response = await axios.put(API.WORKSPACE.UPDATE_ROLE(workspaceId), {
      userId,
      role,
    });
    return response.data;
  } catch (err: Error | any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to update member role";

    throw new Error(message);
  }
};
export const removeWorkspaceMember = async (
  workspaceId: string,
  userId: string,
  requesterId: string,
) => {
  try {
    console.log(
      "REMOVE URL:",
      API.WORKSPACE.REMOVE_MEMBER(workspaceId, userId),
    );

    const response = await axios.delete(
      API.WORKSPACE.REMOVE_MEMBER(workspaceId, userId),
      {
        data: { requesterId },
      },
    );

    return response.data;
  } catch (err: Error | any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to remove member";

    throw new Error(message);
  }
};

export const requestEditAccess = async (workspaceId: string) => {
  try {
    const response = await axios.post(
      API.WORKSPACE.REQUEST_ACCESS(workspaceId),
    );
    return response.data;
  } catch (err: Error | any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to request edit access";
    throw new Error(message);
  }
};

export const getMyAccessRequest = async (workspaceId: string) => {
  try {
    const response = await axios.get(
      API.WORKSPACE.MY_ACCESS_REQUEST(workspaceId),
    );
    return response.data;
  } catch (err: Error | any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to get access request";
    throw new Error(message);
  }
};

export const getPendingRequests = async (workspaceId: string) => {
  try {
    const response = await axios.get(
      API.WORKSPACE.PENDING_REQUESTS(workspaceId),
    );
    return response.data;
  } catch (err: Error | any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to fetch pending requests";
    throw new Error(message);
  }
};

export const approveAccessRequest = async (
  workspaceId: string,
  requestId: string,
) => {
  try {
    const response = await axios.put(
      API.WORKSPACE.APPROVE_REQUEST(workspaceId, requestId),
    );
    return response.data;
  } catch (err: Error | any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to approve request";
    throw new Error(message);
  }
};

export const denyAccessRequest = async (
  workspaceId: string,
  requestId: string,
) => {
  try {
    const response = await axios.put(
      API.WORKSPACE.DENY_REQUEST(workspaceId, requestId),
    );
    return response.data;
  } catch (err: Error | any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to deny request";
    throw new Error(message);
  }
};
