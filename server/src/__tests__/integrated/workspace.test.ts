// src/__tests__/integrated/workspace.test.ts

import request from "supertest";
import { PrismaClient } from "@generated/prisma/client";
import { createWorkspaceTestApp } from "../helpers/workspaceTestApp";
import crypto from "crypto";

const prisma = new PrismaClient();
const app = createWorkspaceTestApp();

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

describe("Workspace Routes (Integration)", () => {
  const owner = {
    username: "ws_owner_user",
    email: "ws_owner_user@example.com",
    password: "password123",
  };

  const member = {
    username: "ws_member_user",
    email: "ws_member_user@example.com",
    password: "password123",
  };

  const outsider = {
    username: "ws_outsider_user",
    email: "ws_outsider_user@example.com",
    password: "password123",
  };

  let ownerToken = "";
  let memberToken = "";
  let outsiderToken = "";

  let ownerId = "";
  let memberId = "";
  let outsiderId = "";

  let workspaceId = "";
  let inviteLink = "";

  const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    // Cleanup users from previous runs
    await cleanupTestUsers([owner.email, member.email, outsider.email]);

    // Register users
    await request(app).post("/api/auth/register").send(owner);
    await request(app).post("/api/auth/register").send(member);
    await request(app).post("/api/auth/register").send(outsider);

    // Login users
    const ownerLogin = await request(app).post("/api/auth/login").send({
      email: owner.email,
      password: owner.password,
    });
    ownerToken = ownerLogin.body.token;
    expect(ownerToken).toBeTruthy();

    const memberLogin = await request(app).post("/api/auth/login").send({
      email: member.email,
      password: member.password,
    });
    memberToken = memberLogin.body.token;
    expect(memberToken).toBeTruthy();

    const outsiderLogin = await request(app).post("/api/auth/login").send({
      email: outsider.email,
      password: outsider.password,
    });
    outsiderToken = outsiderLogin.body.token;
    expect(outsiderToken).toBeTruthy();

    // Fetch user IDs
    const [dbOwner, dbMember, dbOutsider] = await Promise.all([
      prisma.user.findUnique({ where: { email: owner.email } }),
      prisma.user.findUnique({ where: { email: member.email } }),
      prisma.user.findUnique({ where: { email: outsider.email } }),
    ]);

    expect(dbOwner).toBeTruthy();
    expect(dbMember).toBeTruthy();
    expect(dbOutsider).toBeTruthy();

    ownerId = (dbOwner as any).id;
    memberId = (dbMember as any).id;
    outsiderId = (dbOutsider as any).id;
  });

  afterAll(async () => {
    // Clean up workspace data
    if (workspaceId) {
      await prisma.userRoles
        .deleteMany({ where: { workspaceId } })
        .catch(() => {});
      await prisma.workspace
        .deleteMany({ where: { id: workspaceId } })
        .catch(() => {});
    }

    await cleanupTestUsers([owner.email, member.email, outsider.email]);

    await prisma.$disconnect();
  });

  // =========================================================
  // AUTH GUARD
  // =========================================================
  describe("Auth guard", () => {
    it("1) rejects GET /api/workspaces without token (401)", async () => {
      const res = await request(app).get("/api/workspaces");
      expect(res.status).toBe(401);
    });

    it("2) rejects POST /api/workspaces with invalid token (401)", async () => {
      const res = await request(app)
        .post("/api/workspaces")
        .set("Authorization", "Bearer invalid.token")
        .send({ name: "Test" });
      expect(res.status).toBe(401);
    });
  });

  // =========================================================
  // CREATE WORKSPACE
  // =========================================================
  describe("POST /api/workspaces (createWorkspace)", () => {
    it("3) owner creates a workspace (201)", async () => {
      const payload = { name: "Integration Workspace" };

      const res = await request(app)
        .post("/api/workspaces")
        .set(authHeader(ownerToken))
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();

      workspaceId = res.body.data.id ?? res.body.data._id;
      expect(workspaceId).toBeTruthy();

      // Fetch invite link for later
      const ws = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });
      inviteLink = (ws as any)?.inviteLink ?? "";
    });

    it("4) fails create when missing name (400)", async () => {
      const res = await request(app)
        .post("/api/workspaces")
        .set(authHeader(ownerToken))
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // =========================================================
  // GET USER WORKSPACES
  // =========================================================
  describe("GET /api/workspaces (getUserWorkspaces)", () => {
    it("5) owner can list their workspaces (200)", async () => {
      const res = await request(app)
        .get("/api/workspaces")
        .set(authHeader(ownerToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("6) outsider gets their own workspaces (empty, 200)", async () => {
      const res = await request(app)
        .get("/api/workspaces")
        .set(authHeader(outsiderToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // =========================================================
  // JOIN WORKSPACE
  // =========================================================
  describe("POST /api/workspace/join (joinByInviteLink)", () => {
    it("7) member joins workspace by invite link (200)", async () => {
      expect(inviteLink).toBeTruthy();

      const res = await request(app)
        .post("/api/workspace/join")
        .set(authHeader(memberToken))
        .query({ inviteLink });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("8) already-member joining again returns 200/409", async () => {
      const res = await request(app)
        .post("/api/workspace/join")
        .set(authHeader(memberToken))
        .query({ inviteLink });

      // Either returns workspace (idempotent) or conflict
      expect([200, 409]).toContain(res.status);
    });

    it("9) fails without inviteLink param (400)", async () => {
      const res = await request(app)
        .post("/api/workspace/join")
        .set(authHeader(outsiderToken));

      expect(res.status).toBe(400);
    });

    it("10) fails with invalid invite link (500/404)", async () => {
      const res = await request(app)
        .post("/api/workspace/join")
        .set(authHeader(outsiderToken))
        .query({ inviteLink: "invalid-link-does-not-exist" });

      expect([404, 500]).toContain(res.status);
    });
  });

  // =========================================================
  // UPDATE WORKSPACE (owner only)
  // =========================================================
  describe("PUT /api/workspace/:id (updateWorkspace) , ownerOnly", () => {
    it("11) owner can update workspace name (200)", async () => {
      const res = await request(app)
        .put(`/api/workspace/${workspaceId}`)
        .set(authHeader(ownerToken))
        .send({ name: "Updated Workspace Name", workspaceId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("12) member cannot update workspace (403)", async () => {
      const res = await request(app)
        .put(`/api/workspace/${workspaceId}`)
        .set(authHeader(memberToken))
        .send({ name: "Hacked Name", workspaceId });

      expect([401, 403]).toContain(res.status);
    });

    it("13) outsider cannot update workspace (403)", async () => {
      const res = await request(app)
        .put(`/api/workspace/${workspaceId}`)
        .set(authHeader(outsiderToken))
        .send({ name: "Hacked Name", workspaceId });

      expect([401, 403]).toContain(res.status);
    });
  });

  // =========================================================
  // GET MEMBERS (owner only)
  // =========================================================
  describe("GET /api/workspace/:workspaceId/members (getMembers) , ownerOnly", () => {
    it("14) owner can get members (200)", async () => {
      const res = await request(app)
        .get(`/api/workspace/${workspaceId}/members`)
        .set(authHeader(ownerToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("15) member cannot get members (403)", async () => {
      const res = await request(app)
        .get(`/api/workspace/${workspaceId}/members`)
        .set(authHeader(memberToken));

      expect([401, 403]).toContain(res.status);
    });

    it("16) outsider cannot get members (403)", async () => {
      const res = await request(app)
        .get(`/api/workspace/${workspaceId}/members`)
        .set(authHeader(outsiderToken));

      expect([401, 403]).toContain(res.status);
    });
  });

  // =========================================================
  // MANAGE ROLES (owner only)
  // =========================================================
  describe("PUT /api/workspace/:workspaceId/roles (manageRoles) , ownerOnly", () => {
    it("17) owner can change member role to EDITOR (200)", async () => {
      const res = await request(app)
        .put(`/api/workspace/${workspaceId}/roles`)
        .set(authHeader(ownerToken))
        .send({ userId: memberId, role: "EDITOR" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("18) member cannot manage roles (403)", async () => {
      const res = await request(app)
        .put(`/api/workspace/${workspaceId}/roles`)
        .set(authHeader(memberToken))
        .send({ userId: memberId, role: "VIEWER" });

      expect([401, 403]).toContain(res.status);
    });

    it("19) owner cannot change own role (400/403/500)", async () => {
      const res = await request(app)
        .put(`/api/workspace/${workspaceId}/roles`)
        .set(authHeader(ownerToken))
        .send({ userId: ownerId, role: "VIEWER" });

      expect([400, 403, 500]).toContain(res.status);
    });
  });

  // =========================================================
  // REMOVE MEMBER (owner only)
  // =========================================================
  describe("DELETE /api/workspace/:workspaceId/members/:userId (removeMember) , ownerOnly", () => {
    it("20) member cannot remove another member (403)", async () => {
      const res = await request(app)
        .delete(`/api/workspace/${workspaceId}/members/${memberId}`)
        .set(authHeader(memberToken));

      expect([401, 403]).toContain(res.status);
    });

    it("21) owner can remove member (200)", async () => {
      const res = await request(app)
        .delete(`/api/workspace/${workspaceId}/members/${memberId}`)
        .set(authHeader(ownerToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
