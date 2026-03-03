// src/__tests__/integrated/note.test.ts

import request from "supertest";
import { PrismaClient } from "@generated/prisma/client";
import { createNoteTestApp } from "../helpers/noteTestApp";
import crypto from "crypto";

const prisma = new PrismaClient();
const app = createNoteTestApp();

async function cleanupTestUsers(emails: string[]) {
  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
  });
  const userIds = users.map((u: any) => u.id);
  if (userIds.length === 0) return;

  const ownedWorkspaces = await prisma.workspace.findMany({
    where: { ownerId: { in: userIds } },
  });
  const wsIds = ownedWorkspaces.map((w: any) => w.id);

  if (wsIds.length > 0) {
    const notes = await prisma.note.findMany({
      where: { workspaceId: { in: wsIds } },
    });
    const noteIds = notes.map((n: any) => n.id);
    if (noteIds.length > 0) {
      await prisma.noteChunkEmbedding
        .deleteMany({ where: { noteId: { in: noteIds } } })
        .catch(() => {});
    }
    await prisma.note
      .deleteMany({ where: { workspaceId: { in: wsIds } } })
      .catch(() => {});
    await prisma.task
      .deleteMany({ where: { workspaceId: { in: wsIds } } })
      .catch(() => {});
    await prisma.userRoles
      .deleteMany({ where: { workspaceId: { in: wsIds } } })
      .catch(() => {});
    await prisma.accessRequest
      .deleteMany({ where: { workspaceId: { in: wsIds } } })
      .catch(() => {});
    await prisma.workspace
      .deleteMany({ where: { id: { in: wsIds } } })
      .catch(() => {});
  }

  await prisma.userRoles
    .deleteMany({ where: { userId: { in: userIds } } })
    .catch(() => {});
  await prisma.user
    .deleteMany({ where: { id: { in: userIds } } })
    .catch(() => {});
}

describe("Note Routes (Integration) , Notes Only", () => {
  const owner = {
    username: "note_owner_user",
    email: "note_owner_user@example.com",
    password: "password123",
  };

  const editor = {
    username: "note_editor_user",
    email: "note_editor_user@example.com",
    password: "password123",
  };

  const viewer = {
    username: "note_viewer_user",
    email: "note_viewer_user@example.com",
    password: "password123",
  };

  const outsider = {
    username: "note_outsider_user",
    email: "note_outsider_user@example.com",
    password: "password123",
  };

  let ownerToken = "";
  let editorToken = "";
  let viewerToken = "";
  let outsiderToken = "";

  let ownerId = "";
  let editorId = "";
  let viewerId = "";
  let outsiderId = "";

  let workspaceId = "";
  let noteId = "";

  const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    // ---------------------------------------------------------
    // Cleanup users from previous runs
    // ---------------------------------------------------------
    await cleanupTestUsers([
      owner.email,
      editor.email,
      viewer.email,
      outsider.email,
    ]);

    // ---------------------------------------------------------
    // Register users
    // ---------------------------------------------------------
    await request(app).post("/api/auth/register").send(owner);
    await request(app).post("/api/auth/register").send(editor);
    await request(app).post("/api/auth/register").send(viewer);
    await request(app).post("/api/auth/register").send(outsider);

    // ---------------------------------------------------------
    // Login users
    // ---------------------------------------------------------
    const ownerLogin = await request(app).post("/api/auth/login").send({
      email: owner.email,
      password: owner.password,
    });
    ownerToken = ownerLogin.body.token;
    expect(ownerToken).toBeTruthy();

    const editorLogin = await request(app).post("/api/auth/login").send({
      email: editor.email,
      password: editor.password,
    });
    editorToken = editorLogin.body.token;
    expect(editorToken).toBeTruthy();

    const viewerLogin = await request(app).post("/api/auth/login").send({
      email: viewer.email,
      password: viewer.password,
    });
    viewerToken = viewerLogin.body.token;
    expect(viewerToken).toBeTruthy();

    const outsiderLogin = await request(app).post("/api/auth/login").send({
      email: outsider.email,
      password: outsider.password,
    });
    outsiderToken = outsiderLogin.body.token;
    expect(outsiderToken).toBeTruthy();

    // ---------------------------------------------------------
    // Fetch user IDs
    // ---------------------------------------------------------
    const [dbOwner, dbEditor, dbViewer, dbOutsider] = await Promise.all([
      prisma.user.findUnique({ where: { email: owner.email } }),
      prisma.user.findUnique({ where: { email: editor.email } }),
      prisma.user.findUnique({ where: { email: viewer.email } }),
      prisma.user.findUnique({ where: { email: outsider.email } }),
    ]);

    expect(dbOwner).toBeTruthy();
    expect(dbEditor).toBeTruthy();
    expect(dbViewer).toBeTruthy();
    expect(dbOutsider).toBeTruthy();

    ownerId = (dbOwner as any).id;

    editorId = (dbEditor as any).id;
    viewerId = (dbViewer as any).id;
    outsiderId = (dbOutsider as any).id;

    // ---------------------------------------------------------
    // Create workspace DIRECTLY (owner relation is REQUIRED)
    // ---------------------------------------------------------
    const ws = await prisma.workspace.create({
      data: {
        name: "Notes Workspace",
        inviteLink: crypto.randomUUID(),
        //  required relation in your schema
        owner: { connect: { id: ownerId } },
      } as any,
    });

    workspaceId = (ws as any).id;
    expect(workspaceId).toBeTruthy();

    // ---------------------------------------------------------
    // Create roles DIRECTLY
    // ---------------------------------------------------------
    await prisma.userRoles
      .deleteMany({ where: { workspaceId } })
      .catch(() => {});

    await prisma.userRoles.create({
      data: { userId: ownerId, workspaceId, role: "OWNER" } as any,
    });
    await prisma.userRoles.create({
      data: { userId: editorId, workspaceId, role: "EDITOR" } as any,
    });
    await prisma.userRoles.create({
      data: { userId: viewerId, workspaceId, role: "VIEWER" } as any,
    });

    // verify
    const [ownerRole, editorRole, viewerRole] = await Promise.all([
      prisma.userRoles.findFirst({ where: { userId: ownerId, workspaceId } }),
      prisma.userRoles.findFirst({ where: { userId: editorId, workspaceId } }),
      prisma.userRoles.findFirst({ where: { userId: viewerId, workspaceId } }),
    ]);

    expect(ownerRole).toBeTruthy();
    expect(editorRole).toBeTruthy();
    expect(viewerRole).toBeTruthy();
  });

  afterAll(async () => {
    if (noteId) {
      await prisma.note.deleteMany({ where: { id: noteId } }).catch(() => {});
    }

    if (workspaceId) {
      await prisma.userRoles
        .deleteMany({ where: { workspaceId } })
        .catch(() => {});
      await prisma.workspace
        .deleteMany({ where: { id: workspaceId } })
        .catch(() => {});
    }

    await cleanupTestUsers([
      owner.email,
      editor.email,
      viewer.email,
      outsider.email,
    ]);

    await prisma.$disconnect();
  });

  // =========================================================
  // AUTH GUARD
  // =========================================================
  describe("Auth guard", () => {
    it("1) rejects GET /api/notes without token (401)", async () => {
      const res = await request(app).get("/api/notes");
      expect(res.status).toBe(401);
    });

    it("2) rejects GET /api/notes with invalid token (401)", async () => {
      const res = await request(app)
        .get("/api/notes")
        .set("Authorization", "Bearer invalid.token");
      expect(res.status).toBe(401);
    });
  });

  // =========================================================
  // CREATE NOTE
  // =========================================================
  describe("POST /api/notes (createNote)", () => {
    it("3) owner creates a note (200/201)", async () => {
      const payload = {
        title: "Integration Note",
        content: "Hello from notes integration tests",
        workspaceId,
      };

      const res = await request(app)
        .post("/api/notes")
        .set(authHeader(ownerToken))
        .send(payload);

      expect([200, 201]).toContain(res.status);

      noteId =
        res.body?.data?.id ??
        res.body?.data?._id ??
        res.body?.id ??
        res.body?._id;

      expect(noteId).toBeTruthy();

      const dbNote = await prisma.note.findUnique({ where: { id: noteId } });
      expect(dbNote).toBeTruthy();
    });

    it("4) fails create when missing required fields (400/422)", async () => {
      const res = await request(app)
        .post("/api/notes")
        .set(authHeader(ownerToken))
        .send({ workspaceId });

      expect([400, 422]).toContain(res.status);
    });
  });

  // =========================================================
  // READ NOTE
  // =========================================================
  describe("GET /api/notes/:id (getNoteById)", () => {
    it("5) owner can fetch note (200)", async () => {
      const res = await request(app)
        .get(`/api/notes/${noteId}`)
        .set(authHeader(ownerToken));

      expect(res.status).toBe(200);
    });

    it("6) viewer can fetch note (200)", async () => {
      const res = await request(app)
        .get(`/api/notes/${noteId}`)
        .set(authHeader(viewerToken));

      expect(res.status).toBe(200);
    });

    it("7) outsider cannot fetch note (403/404)", async () => {
      const res = await request(app)
        .get(`/api/notes/${noteId}`)
        .set(authHeader(outsiderToken));

      expect([403, 404]).toContain(res.status);
    });

    it("8) returns 404/400 for non-existent id", async () => {
      const fakeId = "000000000000000000000000";
      const res = await request(app)
        .get(`/api/notes/${fakeId}`)
        .set(authHeader(ownerToken));

      expect([404, 400]).toContain(res.status);
    });
  });

  // =========================================================
  // LIST NOTES
  // =========================================================
  describe("GET /api/notes (getNotes)", () => {
    it("9) lists notes WITHOUT workspaceId should fail (400)", async () => {
      const res = await request(app)
        .get("/api/notes")
        .set(authHeader(ownerToken))
        .query({ page: "1", limit: "10" });

      expect(res.status).toBe(400);
    });

    it("10) supports filter by workspaceId (200)", async () => {
      const res = await request(app)
        .get("/api/notes")
        .set(authHeader(ownerToken))
        .query({ workspaceId });

      expect(res.status).toBe(200);
      const list = res.body?.data ?? res.body;
      expect(Array.isArray(list)).toBe(true);
    });
  });

  // =========================================================
  // WORKSPACE NOTES
  // =========================================================
  describe("GET /api/workspaces/:workspaceId/notes (getWorkspaceNotes)", () => {
    it("11) editor can fetch workspace notes (200)", async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}/notes`)
        .set(authHeader(editorToken));

      expect(res.status).toBe(200);
    });

    it("12) viewer can fetch workspace notes (200)", async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}/notes`)
        .set(authHeader(viewerToken));

      expect(res.status).toBe(200);
    });

    it("13) outsider cannot fetch workspace notes (403/404)", async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}/notes`)
        .set(authHeader(outsiderToken));

      expect([403, 404]).toContain(res.status);
    });
  });

  // =========================================================
  // AUTHOR NOTES
  // =========================================================
  describe("GET /api/users/:authorId/notes (getAuthorNotes)", () => {
    it("14) owner can fetch their own author notes (200)", async () => {
      const res = await request(app)
        .get(`/api/users/${ownerId}/notes`)
        .set(authHeader(ownerToken));

      expect(res.status).toBe(200);
    });
  });

  // =========================================================
  // UPDATE NOTE
  // =========================================================
  describe("PUT /api/notes/:id (updateNote) , noteEditorOrAbove", () => {
    it("15) editor can update note (200/204)", async () => {
      const res = await request(app)
        .put(`/api/notes/${noteId}`)
        .set(authHeader(editorToken))
        .send({ title: "Updated Title", content: "Updated Content" });

      expect([200, 204]).toContain(res.status);
    });

    it("16) viewer cannot update note (401/403/404)", async () => {
      const res = await request(app)
        .put(`/api/notes/${noteId}`)
        .set(authHeader(viewerToken))
        .send({ title: "Viewer edit attempt" });

      expect([401, 403, 404]).toContain(res.status);
    });

    it("17) outsider cannot update note (401/403/404)", async () => {
      const res = await request(app)
        .put(`/api/notes/${noteId}`)
        .set(authHeader(outsiderToken))
        .send({ title: "Hacked" });

      expect([401, 403, 404]).toContain(res.status);
    });
  });

  // =========================================================
  // ADD SUMMARY
  // =========================================================
  describe("PATCH /api/notes/:id/summary (addSummary) , noteEditorOrAbove", () => {
    it("18) editor can add summary (200/204) OR returns 400 when summarizer not available in test env", async () => {
      const payload = {
        summary: "Short summary from integration tests.",
      };

      const res = await request(app)
        .patch(`/api/notes/${noteId}/summary`)
        .set(authHeader(editorToken))
        .send(payload);

      // Accept success
      if ([200, 204].includes(res.status)) return;

      // Accept expected failure in test env (summarizer not configured)
      if (res.status === 400) {
        // keep this strict so we don't hide real bugs
        expect(res.body).toBeTruthy();
        expect(res.body.success).toBe(false);

        // match either exact message or a "contains" to be safe
        const msg = res.body.message ?? res.body.error ?? "";
        expect(String(msg).toLowerCase()).toContain("summar");
        return;
      }

      // Anything else is a real failure
      console.log("PATCH /api/notes/:id/summary unexpected result");
      console.log("status:", res.status);
      console.log("body:", res.body);

      throw new Error(`Unexpected status ${res.status} for addSummary`);
    });
    it("19) viewer cannot add summary (401/403/404)", async () => {
      const res = await request(app)
        .patch(`/api/notes/${noteId}/summary`)
        .set(authHeader(viewerToken))
        .send({ summary: "Viewer summary attempt" });

      expect([401, 403, 404]).toContain(res.status);
    });

    it("20) outsider cannot add summary (401/403/404)", async () => {
      const res = await request(app)
        .patch(`/api/notes/${noteId}/summary`)
        .set(authHeader(outsiderToken))
        .send({ summary: "Bad summary" });

      expect([401, 403, 404]).toContain(res.status);
    });
  });

  // =========================================================
  // TRANSCRIPT
  // =========================================================
  describe("GET /api/notes/:audioFileId/transcript (getTranscriptByAudioFileId)", () => {
    it("21) returns 404/400 for unknown audioFileId (or 200 if you return empty)", async () => {
      const fakeAudioFileId = "000000000000000000000000";

      const res = await request(app)
        .get(`/api/notes/${fakeAudioFileId}/transcript`)
        .set(authHeader(ownerToken));

      expect([200, 404, 400]).toContain(res.status);
    });
  });

  // =========================================================
  // DELETE NOTE
  // =========================================================
  describe("DELETE /api/notes/:id (deleteNote) , noteEditorOrAbove", () => {
    it("22) owner can delete note (200/204)", async () => {
      const res = await request(app)
        .delete(`/api/notes/${noteId}`)
        .set(authHeader(ownerToken));

      if (![200, 204].includes(res.status)) {
        console.log("DELETE /api/notes/:id failed");
        console.log("status:", res.status);
        console.log("body:", res.body);
      }

      expect([200, 204]).toContain(res.status);

      const dbNote = await prisma.note.findUnique({ where: { id: noteId } });
      expect(dbNote).toBeNull();
    });
  });
});
