// src/__tests__/integrated/task.test.ts

import request from "supertest";
import { PrismaClient } from "@generated/prisma/client";
import { createTaskTestApp } from "../helpers/taskTestApp";
import crypto from "crypto";

const prisma = new PrismaClient();
const app = createTaskTestApp();

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

describe("Task Routes (Integration)", () => {
  const owner = {
    username: "task_owner_user",
    email: "task_owner_user@example.com",
    password: "password123",
  };

  const other = {
    username: "task_other_user",
    email: "task_other_user@example.com",
    password: "password123",
  };

  let ownerToken = "";
  let otherToken = "";

  let ownerId = "";
  let otherId = "";

  let workspaceId = "";
  let taskId = "";

  const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    // Cleanup users from previous runs
    await cleanupTestUsers([owner.email, other.email]);

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
        name: "Task Test Workspace",
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
    // Clean up task data
    if (taskId) {
      await prisma.task.deleteMany({ where: { id: taskId } }).catch(() => {});
    }

    if (workspaceId) {
      await prisma.task.deleteMany({ where: { workspaceId } }).catch(() => {});
      await prisma.userRoles
        .deleteMany({ where: { workspaceId } })
        .catch(() => {});
      await prisma.workspace
        .deleteMany({ where: { id: workspaceId } })
        .catch(() => {});
    }

    await cleanupTestUsers([owner.email, other.email]);

    await prisma.$disconnect();
  });

  // =========================================================
  // AUTH GUARD
  // =========================================================
  describe("Auth guard", () => {
    it("1) rejects POST /api/tasks without token (401)", async () => {
      const res = await request(app)
        .post("/api/tasks")
        .send({ title: "Test", workspaceId: "fake" });
      expect(res.status).toBe(401);
    });

    it("2) rejects GET /api/tasks/:id with invalid token (401)", async () => {
      const res = await request(app)
        .get("/api/tasks/000000000000000000000000")
        .set("Authorization", "Bearer invalid.token");
      expect(res.status).toBe(401);
    });
  });

  // =========================================================
  // CREATE TASK
  // =========================================================
  describe("POST /api/tasks (createTask)", () => {
    it("3) creates a task successfully (201)", async () => {
      const payload = {
        title: "Integration Test Task",
        description: "Task created in integration tests",
        workspaceId,
        priority: "HIGH",
      };

      const res = await request(app)
        .post("/api/tasks")
        .set(authHeader(ownerToken))
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();

      taskId = res.body.data.id ?? res.body.data._id;

      expect(taskId).toBeTruthy();

      // verify in DB
      const dbTask = await prisma.task.findUnique({ where: { id: taskId } });
      expect(dbTask).toBeTruthy();
    });

    it("4) fails create when missing title (400)", async () => {
      const res = await request(app)
        .post("/api/tasks")
        .set(authHeader(ownerToken))
        .send({ workspaceId });

      expect(res.status).toBe(400);
    });

    it("5) fails create when missing workspaceId (400)", async () => {
      const res = await request(app)
        .post("/api/tasks")
        .set(authHeader(ownerToken))
        .send({ title: "No workspace" });

      expect(res.status).toBe(400);
    });

    it("6) fails create with empty body (400)", async () => {
      const res = await request(app)
        .post("/api/tasks")
        .set(authHeader(ownerToken))
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // =========================================================
  // GET TASK BY ID
  // =========================================================
  describe("GET /api/tasks/:id (getTaskById)", () => {
    it("7) fetches task by id (200)", async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set(authHeader(ownerToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe(taskId);
    });

    it("8) returns 404 for non-existent task", async () => {
      const fakeId = "000000000000000000000000";
      const res = await request(app)
        .get(`/api/tasks/${fakeId}`)
        .set(authHeader(ownerToken));

      expect(res.status).toBe(404);
    });
  });

  // =========================================================
  // GET WORKSPACE TASKS
  // =========================================================
  describe("GET /api/workspaces/:workspaceId/tasks (getWorkspaceTasks)", () => {
    it("9) fetches tasks for workspace (200)", async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}/tasks`)
        .set(authHeader(ownerToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("10) returns empty array for workspace without tasks (200)", async () => {
      const fakeWsId = "000000000000000000000000";
      const res = await request(app)
        .get(`/api/workspaces/${fakeWsId}/tasks`)
        .set(authHeader(ownerToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });
  });

  // =========================================================
  // UPDATE TASK
  // =========================================================
  describe("PUT /api/tasks/:id (updateTask)", () => {
    it("11) updates task title (200)", async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set(authHeader(ownerToken))
        .send({ title: "Updated Task Title" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("Updated Task Title");
    });

    it("12) updates task completion status (200)", async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set(authHeader(ownerToken))
        .send({ isCompleted: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isCompleted).toBe(true);
    });

    it("13) updates task priority (200)", async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set(authHeader(ownerToken))
        .send({ priority: "LOW" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("14) returns 404 for non-existent task", async () => {
      const fakeId = "000000000000000000000000";
      const res = await request(app)
        .put(`/api/tasks/${fakeId}`)
        .set(authHeader(ownerToken))
        .send({ title: "Nope" });

      expect(res.status).toBe(404);
    });
  });

  // =========================================================
  // DELETE TASK
  // =========================================================
  describe("DELETE /api/tasks/:id (deleteTask)", () => {
    it("15) returns 404 for non-existent task", async () => {
      const fakeId = "000000000000000000000000";
      const res = await request(app)
        .delete(`/api/tasks/${fakeId}`)
        .set(authHeader(ownerToken));

      expect(res.status).toBe(404);
    });

    it("16) deletes task successfully (200)", async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set(authHeader(ownerToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // verify in DB
      const dbTask = await prisma.task.findUnique({ where: { id: taskId } });
      expect(dbTask).toBeNull();
    });
  });
});
