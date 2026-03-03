import axios from "./axios";
import { API } from "./endpoints";

export type RagMessage = { role: "user" | "assistant"; content: string };

export type RagChatPayload = {
  workspaceId: string;
  question: string;
  history?: RagMessage[];
  threadId?: string;
};

export type RagThread = {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
};

export const ragChat = async (payload: RagChatPayload) => {
  try {
    const response = await axios.post(API.RAG.CHAT, payload);
    return response.data;
  } catch (err: Error | any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to chat with notes";
    throw new Error(message);
  }
};

export const createRagThread = async (payload: { workspaceId: string }) => {
  try {
    const response = await axios.post(API.RAG.THREAD_CREATE, payload);
    return response.data; // { success, data: { id, title... } }
  } catch (err: Error | any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to create chat thread";
    throw new Error(message);
  }
};

export const getRagThreads = async (workspaceId: string) => {
  try {
    const response = await axios.get(API.RAG.THREADS(workspaceId));
    return response.data; // { success, data: RagThread[] }
  } catch (err: Error | any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to fetch chat threads";
    throw new Error(message);
  }
};
export const getRagThreadMessages = async (threadId: string) => {
  try {
    const response = await axios.get(API.RAG.THREAD(threadId));
    return response.data; // { success, data: RagMessage[] }
  } catch (err: Error | any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to fetch chat messages";
    throw new Error(message);
  }
};

export const deleteRagThread = async (threadId: string) => {
  try {
    const response = await axios.delete(API.RAG.THREAD_DELETE(threadId));
    return response.data; // { success, message? }
  } catch (err: Error | any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to delete chat thread";
    throw new Error(message);
  }
};
