"use server";

import {
  ragChat,
  createRagThread,
  getRagThreads,
  getRagThreadMessages,
} from "../api/rag";

export const handleRagChat = async (payload: any) => {
  try {
    const res = await ragChat(payload);
    return res;
  } catch (e: any) {
    return { success: false, message: e?.message ?? "RAG failed" };
  }
};

export const handleCreateRagThread = async (payload: any) => {
  try {
    const res = await createRagThread(payload);
    return res;
  } catch (e: any) {
    return { success: false, message: e?.message ?? "Create thread failed" };
  }
};

export const handleGetRagThreads = async (workspaceId: string) => {
  try {
    const res = await getRagThreads(workspaceId);
    return res;
  } catch (e: any) {
    return { success: false, message: e?.message ?? "Fetch threads failed" };
  }
};

export const handleGetRagThreadMessages = async (threadId: string) => {
  try {
    const res = await getRagThreadMessages(threadId);
    return res;
  } catch (e: any) {
    return { success: false, message: e?.message ?? "Fetch messages failed" };
  }
};
