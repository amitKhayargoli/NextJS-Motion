import request from "supertest";
import { PrismaClient } from "@generated/prisma/client";
import { createWorkspaceTestApp } from "../helpers/workspaceTestApp";

const prisma = new PrismaClient();
const app = createWorkspaceTestApp();

describe("Workspace Routes (Integration)", () => {
  const owner = {
    username: "owner_user",
    email: "owner_user@example.com",
    password: "password123",
  };

  const member = {
    username: "member_user",
    email: "member_user@example.com",
    password: "password123",
  };

  let ownerToken: string;
  let memberToken: string;

  let workspaceId: string;
  let inviteLink: string;

  const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    // cleanup
    await prisma.user.deleteMany({
      where: { email: { in: [owner.email, member.email] } },
    });

    // register both users
    await request(app).post("/api/auth/register").send(owner);
    await request(app).post("/api/auth/register").send(member);

    // login both users
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
  });

  afterAll(async () => {
    // cleanup workspace + roles
    if (workspaceId) {
      await prisma.userRoles
        .deleteMany({ where: { workspaceId } })
        .catch(() => {});
      await prisma.workspace
        .deleteMany({ where: { id: workspaceId } })
        .catch(() => {});
    }

    await prisma.user.deleteMany({
      where: { email: { in: [owner.email, member.email] } },
    });

    await prisma.$disconnect();
  });

  describe("Auth guard (authorizedMiddleware)", () => {
    it("1) should reject requests without token (401)", async () => {
      const res = await request(app).get("/api/workspaces");
      expect(res.status).toBe(401);
    });

    it("2) should reject requests with invalid token (401)", async () => {
      const res = await request(app)
        .get("/api/workspaces")
        .set("Authorization", "Bearer invalid.token");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/workspaces (create)", () => {
    it("3) should create workspace for authenticated user (200/201)", async () => {
      const res = await request(app)
        .post("/api/workspaces")
        .set(authHeader(ownerToken))
        .send({ name: "My Workspace" });

      expect([200, 201]).toContain(res.status);

      // flexible response shape
      workspaceId =
        res.body?.data?.id ??
        res.body?.data?._id ??
        res.body?.id ??
        res.body?._id;

      expect(workspaceId).toBeTruthy();

      // fetch from DB to get inviteLink reliably
      const ws = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });
      expect(ws).toBeTruthy();

      inviteLink = (ws as any).inviteLink;
      expect(inviteLink).toBeTruthy();
    });

    it("4) should fail create workspace with missing name (400)", async () => {
      const res = await request(app)
        .post("/api/workspaces")
        .set(authHeader(ownerToken))
        .send({});

      expect([400, 422]).toContain(res.status);
    });
  });

  describe("GET /api/workspaces (getUserWorkspaces)", () => {
    it("5) should list workspaces for owner (200)", async () => {
      const res = await request(app)
        .get("/api/workspaces")
        .set(authHeader(ownerToken));

      expect(res.status).toBe(200);

      const list = res.body?.data ?? res.body;
      expect(Array.isArray(list)).toBe(true);
    });

    it("6) should list empty/valid list for new member (200)", async () => {
      const res = await request(app)
        .get("/api/workspaces")
        .set(authHeader(memberToken));

      expect(res.status).toBe(200);
      const list = res.body?.data ?? res.body;
      expect(Array.isArray(list)).toBe(true);
    });
  });

  describe("POST /api/workspace/join (joinByInviteLink)", () => {
    // it("7) should allow member to join using invite link (200/201)", async () => {
    //   const res = await request(app)
    //     .post("/api/workspace/join")
    //     .set(authHeader(memberToken))
    //     .send({ inviteLink });

    //   expect([200, 201]).toContain(res.status);

    //   if (![200, 201].includes(res.status)) return;

    //   const memberUser = await prisma.user.findUnique({
    //     where: { email: member.email },
    //   });
    //   expect(memberUser).toBeTruthy();

    //   const role = await prisma.userRoles.findUnique({
    //     where: {
    //       unique_user_workspace_role: {
    //         userId: (memberUser as any).id,
    //         workspaceId,
    //       },
    //     },
    //   });

    //   expect(role).toBeTruthy();
    // });

    it("8) should reject join with invalid invite link (400/404)", async () => {
      const res = await request(app)
        .post("/api/workspace/join")
        .set(authHeader(memberToken))
        .send({ inviteLink: "invalid-link" });

      expect([400, 404]).toContain(res.status);
    });

    it("9) should reject join without inviteLink field (400)", async () => {
      const res = await request(app)
        .post("/api/workspace/join")
        .set(authHeader(memberToken))
        .send({});

      expect([400, 422]).toContain(res.status);
    });
  });

  describe("PUT /api/workspace/:id (updateWorkspace) OWNER ONLY", () => {
    // it("10) should allow OWNER to update workspace (200)", async () => {
    //   const res = await request(app)
    //     .put(`/api/workspace/${workspaceId}`)
    //     .set(authHeader(ownerToken))
    //     .send({ name: "Updated Workspace Name" });

    //   expect([200, 204]).toContain(res.status);

    //   const ws = await prisma.workspace.findUnique({
    //     where: { id: workspaceId },
    //   });
    //   expect(ws).toBeTruthy();
    //   expect((ws as any).name).toBe("Updated Workspace Name");
    // });

    it("11) should reject non-owner updating workspace (403)", async () => {
      const res = await request(app)
        .put(`/api/workspace/${workspaceId}`)
        .set(authHeader(memberToken))
        .send({ name: "Hacked Name" });

      expect([403, 401, 400]).toContain(res.status);
    });

    it("12) should return 404 when updating non-existent workspace (404)", async () => {
      const fakeId = "000000000000000000000000"; // ObjectId-like string
      const res = await request(app)
        .put(`/api/workspace/${fakeId}`)
        .set(authHeader(ownerToken))
        .send({ name: "Doesn't matter" });

      expect([404, 400]).toContain(res.status); // 400 if ID validation fails
    });
  });

  describe("GET /api/workspace/:workspaceId/members (Owner only)", () => {
    it("13) should allow OWNER to fetch members (200)", async () => {
      const res = await request(app)
        .get(`/api/workspace/${workspaceId}/members`)
        .set(authHeader(ownerToken));

      expect(res.status).toBe(200);

      const members = res.body?.data ?? res.body;
      expect(Array.isArray(members)).toBe(true);
    });

    it("14) should reject non-owner fetching members (403)", async () => {
      const res = await request(app)
        .get(`/api/workspace/${workspaceId}/members`)
        .set(authHeader(memberToken));

      expect([403, 401]).toContain(res.status);
    });
  });

  describe("PUT /api/workspace/:workspaceId/roles (Owner only)", () => {
    it("15) should allow OWNER to manage roles (200)", async () => {
      const memberUser = await prisma.user.findUnique({
        where: { email: member.email },
      });
      expect(memberUser).toBeTruthy();

      const res = await request(app)
        .put(`/api/workspace/${workspaceId}/roles`)
        .set(authHeader(ownerToken))
        .send({
          userId: (memberUser as any).id,
          role: "EDITOR", // or "VIEWER", "OWNER"
        });

      expect([200, 204]).toContain(res.status);
    });

    it("16) should reject non-owner managing roles (403)", async () => {
      const res = await request(app)
        .put(`/api/workspace/${workspaceId}/roles`)
        .set(authHeader(memberToken))
        .send({ role: "OWNER" });

      expect([403, 401]).toContain(res.status);
    });
  });
});
