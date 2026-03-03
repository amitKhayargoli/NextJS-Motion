export const API = {
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    UPDATE: "/auth/user/update",
    REQUEST_PASSWORD_RESET: "/auth/request-password-reset",
    RESET_PASSWORD: (token: string) => `/auth/reset-password/${token}`,
  },

  WORKSPACE: {
    CREATE: "/workspaces",
    GET_ALL: "/workspaces",
    UPDATE: (id: string) => `/workspace/${id}`,
    JOIN: (inviteLink: string) => `/workspace/join?inviteLink=${inviteLink}`,
    GET_MEMBERS: (workspaceId: string) => `/workspace/${workspaceId}/members`,
    UPDATE_ROLE: (workspaceId: string) => `/workspace/${workspaceId}/roles`,
    REMOVE_MEMBER: (workspaceId: string, userId: string) =>
      `/workspace/${workspaceId}/members/${userId}`,
  },
  NOTE: {
    CREATE: "/notes",
    UPDATE: (id: string) => `/notes/${id}`,
    GET: (id: string) => `/notes/${id}`,
    GET_ALL: "/notes",
    GET_WORKSPACE: (workspaceId: string) => `/workspaces/${workspaceId}/notes`,
    GET_AUTHOR: (authorId: string) => `/users/${authorId}/notes`,
    DELETE: (id: string) => `/notes/${id}`,
    ADD_SUMMARY: (id: string) => `/notes/${id}/summary`,
  },

  RAG: {
    CHAT: "/rag/chat",
    THREAD_CREATE: "/rag/thread",
    THREADS: (workspaceId: string) => `/rag/thread?workspaceId=${workspaceId}`,
    THREAD: (threadId: string) => `/rag/thread/${threadId}`,
    THREAD_DELETE: (threadId: string) => `/rag/thread/${threadId}`,
  },
};
