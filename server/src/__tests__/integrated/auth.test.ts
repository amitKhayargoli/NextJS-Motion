import request from "supertest";
import { PrismaClient } from "@generated/prisma/client";
import { createTestApp } from "../helpers/testApp";

const app = createTestApp();
const prisma = new PrismaClient();

describe("Authentication Routes (Integration)", () => {
  const baseUser = {
    username: "testuser",
    email: "test@example.com",
    password: "password123",
  };

  const secondUser = {
    username: "testuser2",
    email: "test2@example.com",
    password: "password123",
  };

  let authCookie: string | undefined;
  let jwtToken: string | undefined;
  let resetToken: string | undefined;

  // helpers
  const extractCookie = (res: any) => {
    const setCookie = res.headers["set-cookie"] as string[] | undefined;
    if (!setCookie?.length) return undefined;
    // keep only cookie pair (avoid attributes)
    return setCookie.map((c) => c.split(";")[0]).join("; ");
  };

  const authHeader = () =>
    jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {};

  beforeAll(async () => {
    // Clean up users used by tests
    await prisma.user.deleteMany({
      where: { email: { in: [baseUser.email, secondUser.email] } },
    });
  });

  afterAll(async () => {
    // Clean up again (optional)
    await prisma.user.deleteMany({
      where: { email: { in: [baseUser.email, secondUser.email] } },
    });
    await prisma.$disconnect();
  });

  it("1) should register a new user successfully (201)", async () => {
    const res = await request(app).post("/api/auth/register").send(baseUser);

    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("User created successfully");

    expect(res.body.data).toBeDefined();
    expect(res.body.data.email).toBe(baseUser.email);
    expect(res.body.data.username).toBe(baseUser.username);
    expect(res.body.data.id).toBeDefined();
  });

  it("2) should NOT register with duplicate email (403/409/400)", async () => {
    const res = await request(app).post("/api/auth/register").send(baseUser);
    expect([400, 403, 409]).toContain(res.status);
  });

  it("3) should NOT register with invalid email (400)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...secondUser, email: "not-an-email" });

    expect(res.status).toBe(400);
  });

  it("4) should NOT register with missing email (400)", async () => {
    const { email, ...rest } = secondUser as any;
    const res = await request(app).post("/api/auth/register").send(rest);
    expect(res.status).toBe(400);
  });

  it("5) should NOT register with missing username (400)", async () => {
    const { username, ...rest } = secondUser as any;
    const res = await request(app).post("/api/auth/register").send(rest);
    expect(res.status).toBe(400);
  });

  it("6) should NOT register with short password (400)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...secondUser, password: "123" });

    expect(res.status).toBe(400);
  });

  it("7) should store password as hash in DB", async () => {
    // ensure user exists
    await request(app).post("/api/auth/register").send(secondUser);

    const inDb = await prisma.user.findUnique({
      where: { email: secondUser.email },
    });
    expect(inDb).toBeTruthy();

    const storedHash = (inDb as any).passwordHash;
    expect(storedHash).toBeTruthy();
    expect(storedHash).not.toBe(secondUser.password);
    expect(storedHash).toMatch(/^\$2[aby]\$/); // bcrypt format
  });

  describe("LOGIN /api/auth/login", () => {
    it("8) should login successfully with valid credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: baseUser.email,
        password: baseUser.password,
      });

      expect(res.status).toBe(200);

      // capture cookie/token for protected routes
      authCookie = extractCookie(res);
      jwtToken = res.body?.token ?? res.body?.accessToken;

      // at least one auth mechanism should exist (cookie OR token)
      expect(Boolean(authCookie) || Boolean(jwtToken)).toBe(true);
    });

    it("9) should NOT login with wrong password (400/401)", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: baseUser.email,
        password: "wrongpass",
      });

      expect([400, 401]).toContain(res.status);
    });

    it("10) should NOT login with non-existent email (404/401)", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "nope@example.com",
        password: "password123",
      });

      expect([404, 401]).toContain(res.status);
    });

    it("11) should NOT login with missing password (400)", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: baseUser.email,
      });

      expect(res.status).toBe(400);
    });

    it("12) should NOT login with invalid email format (400)", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "invalid-email",
        password: baseUser.password,
      });

      expect(res.status).toBe(400);
    });
  });

  describe("PASSWORD RESET flow", () => {
    it("18) should request password reset for existing user (200/202)", async () => {
      const res = await request(app)
        .post("/api/auth/request-password-reset")
        .send({ email: baseUser.email });

      expect([200, 202]).toContain(res.status);

      expect(res.body?.success).toBeDefined();
    });

    it("19) should fail reset password with missing token param (404)", async () => {
      const res = await request(app).post("/api/auth/reset-password").send({
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
      });

      expect(res.status).toBe(404);
    });

    it("20) should fail reset password when passwords do not match (400)", async () => {
      const res = await request(app)
        .post("/api/auth/reset-password/invalid-token")
        .send({
          newPassword: "newpassword123",
          confirmPassword: "differentpassword",
        });

      expect(res.status).toBe(400);
    });

    it("21) should fail reset password with invalid token (400/401)", async () => {
      const res = await request(app)
        .post("/api/auth/reset-password/invalid-token")
        .send({
          newPassword: "newpassword123",
          confirmPassword: "newpassword123",
        });

      expect([400, 401]).toContain(res.status);
    });
  });

  describe("EDGE / SECURITY", () => {
    it("23) should not allow extra unexpected fields (optional depending on validator)", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "hacker",
        email: "hacker@example.com",
        password: "password123",
        role: "ADMIN", // extra field
      });

      expect([200, 201, 400, 403]).toContain(res.status);

      if ([200, 201].includes(res.status)) {
        const created = await prisma.user.findUnique({
          where: { email: "hacker@example.com" },
        });

        expect(created).toBeTruthy();

        // ensure it didn’t actually set role (if schema even has a role)
        if (created && "role" in (created as any)) {
          expect((created as any).role).not.toBe("ADMIN");
        }
      }
    });

    it("24) should handle repeated login attempts consistently (no 500)", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: baseUser.email,
        password: baseUser.password,
      });

      expect([200, 401, 429]).toContain(res.status); // 429 if you rate-limit
    });
  });

  describe("ME /api/auth/me", () => {
    it("25) should return 401 when no token is provided", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("26) should return 401 when token is invalid", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid.token.value");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("27) should return 200 and user data when token is valid", async () => {
      // login to get token
      const loginRes = await request(app).post("/api/auth/login").send({
        email: baseUser.email,
        password: baseUser.password,
      });

      expect(loginRes.status).toBe(200);

      const token = loginRes.body?.token;
      expect(token).toBeTruthy();

      const meRes = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.success).toBe(true);
      expect(meRes.body.message).toBe("User fetched successfully");

      expect(meRes.body.data).toBeDefined();
      expect(meRes.body.data.email).toBe(baseUser.email);
      expect(meRes.body.data.username).toBe(baseUser.username);
      expect(meRes.body.data.passwordHash).toBeUndefined();
    });
  });
});
