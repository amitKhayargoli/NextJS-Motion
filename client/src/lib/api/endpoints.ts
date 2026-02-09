export const API = {
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    UPDATE: "/auth/user/update",
  },

  WORKSPACE: {
    CREATE: "/workspaces",
    GET_ALL: "/workspaces",
    UPDATE: (id: string) => `/workspace/${id}`,
    JOIN: (inviteLink: string) => `/workspace/join/${inviteLink}`,
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
};
