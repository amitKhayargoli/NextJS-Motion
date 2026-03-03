// src/__tests__/integrated/rag.test.ts

import request from "supertest";
import { PrismaClient } from "@generated/prisma/client";
import { createRagTestApp } from "../helpers/ragTestApp";
import crypto from "crypto";

const prisma = new PrismaClient();
const app = createRagTestApp();

describe("RAG Routes (Integration) , Thread CRUD", () => {
  const owner = {
    username: "rag_owner_user",
    email: "rag_owner_user@example.com",
    password: "password123",
  };

  const other = {
    username: "rag_other_user",
    email: "rag_other_user@example.com",
    password: "password123",
  };

  let ownerToken = "";
  let otherToken = "";

  let ownerId = "";
  let otherId = "";

  let workspaceId = "";
  let threadId = "";

  const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    // Cleanup users from previous runs
    await prisma.user.deleteMany({
      where: {
        email: { in: [owner.email, other.email] },
      },
    });

    // Register users
    await request(app).post("/api/auth/register").send(owner);
    await request(app).post("/api/auth/register").send(other);

    // Login users
    const ownerLogin = await request(app).post("/api/auth/login").send({
      email: owner.email,
      password: owner.password,
    });
    ownerToken = ownerLogin.body.token;
    expect(ownerToken).toBeTruthy();

    const otherLogin = await request(app).post("/api/auth/login").send({
      email: other.email,
      password: other.password,
    });
    otherToken = otherLogin.body.token;
    expect(otherToken).toBeTruthy();

    // Fetch user IDs
    const [dbOwner, dbOther] = await Promise.all([
      prisma.user.findUnique({ where: { email: owner.email } }),
      prisma.user.findUnique({ where: { email: other.email } }),
    ]);

    expect(dbOwner).toBeTruthy();
    expect(dbOther).toBeTruthy();

    ownerId = (dbOwner as any).id;
    otherId = (dbOther as any).id;

    // Create workspace directly via Prisma
    const ws = await prisma.workspace.create({
      data: {
        name: "RAG Test Workspace",
        inviteLink: crypto.randomUUID(),
        owner: { connect: { id: ownerId } },
      } as any,
    });

    workspaceId = (ws as any).id;
    expect(workspaceId).toBeTruthy();

    // Create roles
    await prisma.userRoles
      .deleteMany({ where: { workspaceId } })
      .catch(() => {});

    await prisma.userRoles.create({
      data: { userId: ownerId, workspaceId, role: "OWNER" } as any,
    });
  });

  afterAll(async () => {
    // Clean up thread/message data
    if (threadId) {
      await prisma.chatMessage
        .deleteMany({ where: { threadId } })
        .catch(() => {});
      await prisma.chatThread
        .deleteMany({ where: { id: threadId } })
        .catch(() => {});
    }

    // Clean remaining threads in workspace
    const threads = await prisma.chatThread
      .findMany({ where: { workspaceId }, select: { id: true } })
      .catch(() => []);
    for (const t of threads) {
      await prisma.chatMessage
        .deleteMany({ where: { threadId: t.id } })
        .catch(() => {});
    }
    await prisma.chatThread
      .deleteMany({ where: { workspaceId } })
      .catch(() => {});

    if (workspaceId) {
      await prisma.userRoles
        .deleteMany({ where: { workspaceId } })
        .catch(() => {});
      await prisma.workspace
        .deleteMany({ where: { id: workspaceId } })
        .catch(() => {});
    }

    await prisma.user.deleteMany({
      where: {
        email: { in: [owner.email, other.email] },
      },
    });

    await prisma.$disconnect();
  });

  // =========================================================
  // AUTH GUARD
  // =========================================================
  describe("Auth guard", () => {
    it("1) rejects POST /api/rag/thread without token (401)", async () => {
      const res = await request(app)
        .post("/api/rag/thread")
        .send({ workspaceId: "fake" });
      expect(res.status).toBe(401);
    });

    it("2) rejects GET /api/rag/thread with invalid token (401)", async () => {
      const res = await request(app)
        .get("/api/rag/thread")
        .set("Authorization", "Bearer invalid.token")
        .query({ workspaceId: "fake" });
      expect(res.status).toBe(401);
    });
  });

  // =========================================================
  // CREATE THREAD
  // =========================================================
  describe("POST /api/rag/thread (createThread)", () => {
    it("3) creates a thread successfully (200)", async () => {
      const res = await request(app)
        .post("/api/rag/thread")
        .set(authHeader(ownerToken))
        .send({ workspaceId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();

      threadId = res.body.data.id ?? res.body.data._id;
      expect(threadId).toBeTruthy();
      expect(res.body.data.title).toBe("New chat");
    });

    it("4) fails create when missing workspaceId (400)", async () => {
      const res = await request(app)
        .post("/api/rag/thread")
        .set(authHeader(ownerToken))
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // =========================================================
  // LIST THREADS
  // =========================================================
  describe("GET /api/rag/thread (listThreads)", () => {
    it("5) lists threads for workspace (200)", async () => {
      const res = await request(app)
        .get("/api/rag/thread")
        .set(authHeader(ownerToken))
        .query({ workspaceId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("6) fails without workspaceId (400)", async () => {
      const res = await request(app)
        .get("/api/rag/thread")
        .set(authHeader(ownerToken));

      expect(res.status).toBe(400);
    });

    it("7) other user sees no threads for this workspace (200, empty)", async () => {
      const res = await request(app)
        .get("/api/rag/thread")
        .set(authHeader(otherToken))
        .query({ workspaceId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });
  });

  // =========================================================
  // GET THREAD
  // =========================================================
  describe("GET /api/rag/thread/:id (getThread)", () => {
    it("8) owner can get their thread (200)", async () => {
      const res = await request(app)
        .get(`/api/rag/thread/${threadId}`)
        .set(authHeader(ownerToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.thread).toBeDefined();
      expect(res.body.data.thread.id).toBe(threadId);
      expect(Array.isArray(res.body.data.messages)).toBe(true);
    });

    it("9) other user cannot get owner's thread (404)", async () => {
      const res = await request(app)
        .get(`/api/rag/thread/${threadId}`)
        .set(authHeader(otherToken));

      expect(res.status).toBe(404);
    });

    it("10) returns 404 for non-existent thread", async () => {
      const fakeId = "000000000000000000000000";
      const res = await request(app)
        .get(`/api/rag/thread/${fakeId}`)
        .set(authHeader(ownerToken));

      expect(res.status).toBe(404);
    });
  });

  // =========================================================
  // UPDATE THREAD
  // =========================================================
  describe("PUT /api/rag/thread/:id (updateThread)", () => {
    it("11) owner can update thread title (200)", async () => {
      const res = await request(app)
        .put(`/api/rag/thread/${threadId}`)
        .set(authHeader(ownerToken))
        .send({ title: "Updated Thread Title" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it("12) fails without title (400)", async () => {
      const res = await request(app)
        .put(`/api/rag/thread/${threadId}`)
        .set(authHeader(ownerToken))
        .send({});

      expect(res.status).toBe(400);
    });

    it("13) other user cannot update owner's thread (500)", async () => {
      const res = await request(app)
        .put(`/api/rag/thread/${threadId}`)
        .set(authHeader(otherToken))
        .send({ title: "Hacked Title" });

      // updateThreadTitle throws "Thread not found" → 500
      expect(res.status).toBe(500);
    });
  });

  // =========================================================
  // CHAT (RAG)
  // =========================================================
  describe("POST /api/rag/chat (chat)", () => {
    it("14) fails without workspaceId (400)", async () => {
      const res = await request(app)
        .post("/api/rag/chat")
        .set(authHeader(ownerToken))
        .send({ question: "Hello", threadId });

      expect(res.status).toBe(400);
    });

    it("15) fails without question (400)", async () => {
      const res = await request(app)
        .post("/api/rag/chat")
        .set(authHeader(ownerToken))
        .send({ workspaceId, threadId });

      expect(res.status).toBe(400);
    });

    it("16) fails without threadId (400)", async () => {
      const res = await request(app)
        .post("/api/rag/chat")
        .set(authHeader(ownerToken))
        .send({ workspaceId, question: "Hello" });

      expect(res.status).toBe(400);
    });

    it("17) fails with non-existent threadId (404)", async () => {
      const fakeId = "000000000000000000000000";
      const res = await request(app)
        .post("/api/rag/chat")
        .set(authHeader(ownerToken))
        .send({ workspaceId, question: "Hello", threadId: fakeId });

      expect(res.status).toBe(404);
    });
  });

  // =========================================================
  // DELETE THREAD
  // =========================================================
  describe("DELETE /api/rag/thread/:id (deleteThread)", () => {
    it("18) other user cannot delete owner's thread (404)", async () => {
      const res = await request(app)
        .delete(`/api/rag/thread/${threadId}`)
        .set(authHeader(otherToken));

      expect(res.status).toBe(404);
    });

    it("19) returns 404 for non-existent thread", async () => {
      const fakeId = "000000000000000000000000";
      const res = await request(app)
        .delete(`/api/rag/thread/${fakeId}`)
        .set(authHeader(ownerToken));

      expect(res.status).toBe(404);
    });

    it("20) owner can delete thread (200)", async () => {
      const res = await request(app)
        .delete(`/api/rag/thread/${threadId}`)
        .set(authHeader(ownerToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // verify in DB
      const dbThread = await prisma.chatThread.findUnique({
        where: { id: threadId },
      });
      expect(dbThread).toBeNull();
    });
  });
});
