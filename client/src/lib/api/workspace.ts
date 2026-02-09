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
