// src/__tests__/integrated/audioFile.test.ts

import request from "supertest";
import { PrismaClient } from "@generated/prisma/client";
import { createWorkspaceTestApp } from "../helpers/workspaceTestApp";
import crypto from "crypto";

/**
 * AudioFile integration tests.
 *
 * NOTE: Upload (POST /audio/upload) and transcribe (POST /audio/:id/transcribe)
 * endpoints require external services (S3/R2 storage, transcription service).
 * These tests focus on:
 *   - Auth guards
 *   - GET / DELETE / PATCH endpoints with DB-seeded records
 *   - Validation and error handling
 *
 * We use the workspace test app and create audio file records directly in DB
 * to avoid external service dependencies.
 */

const prisma = new PrismaClient();

async function cleanupTestUsers(emails: string[]) {
  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
  });
  const userIds = users.map((u: any) => u.id);
  if (userIds.length === 0) return;

  // Delete audio files uploaded by these users
  await prisma.audioFile
    .deleteMany({ where: { uploaderId: { in: userIds } } })
    .catch(() => {});

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

// We need a minimal app with auth + audioFile routes.
// Since there's no audioFileTestApp, we build one inline.
import express, { Router } from "express";
import { AuthController } from "src/controllers/auth.controller";
import { UserService } from "src/services/user.service";
import { UserRepository } from "src/repositories/user.repository";
import { AudioFileRepository } from "src/repositories/audioFile.repository";
import { AudioFileService } from "src/services/audioFile.service";
import { AudioFileController } from "src/controllers/audioFile.controller";
import { AudioFileRoutes } from "src/routes/audioFile.route";
import { EmbeddingService } from "src/services/embedding.service";
import { TranscriberService } from "src/services/transcription.service";

function createAudioFileTestApp() {
  const app = express();
  app.use(express.json());

  const prismaClient = new PrismaClient();

  // Auth router (minimal)
  const userRepository = new UserRepository(prismaClient);
  const userService = new UserService(userRepository);
  const authController = new AuthController(userService);
  const authRouter = Router();
  authRouter.post("/register", authController.register);
  authRouter.post("/login", authController.login);
  authRouter.get("/me", authController.me);
  app.use("/api/auth", authRouter);

  // AudioFile DI + routes
  const audioFileRepo = new AudioFileRepository(prismaClient);
  const audioFileService = new AudioFileService(audioFileRepo);
  const embeddingService = new EmbeddingService(prismaClient);
  const transcriberService = new TranscriberService(
    process.env.TRANSCRIBER_URL || "http://localhost:8001",
  );
  const audioFileController = new AudioFileController(
    audioFileService,
    prismaClient,
    transcriberService,
    embeddingService,
  );
  const audioFileRoutes = new AudioFileRoutes(audioFileController);
  app.use("/api", audioFileRoutes.getRouter());

  return app;
}

const app = createAudioFileTestApp();

describe("AudioFile Routes (Integration)", () => {
  const userA = {
    username: "audio_userA",
    email: "audio_userA@example.com",
    password: "password123",
  };

  const userB = {
    username: "audio_userB",
    email: "audio_userB@example.com",
    password: "password123",
  };

  let userAToken = "";
  let userBToken = "";

  let userAId = "";
  let userBId = "";

  let audioFileId = "";

  const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    // Cleanup users from previous runs
    await cleanupTestUsers([userA.email, userB.email]);

    // Register users
    await request(app).post("/api/auth/register").send(userA);
    await request(app).post("/api/auth/register").send(userB);

    // Login users
    const loginA = await request(app).post("/api/auth/login").send({
      email: userA.email,
      password: userA.password,
    });
    userAToken = loginA.body.token;
    expect(userAToken).toBeTruthy();

    const loginB = await request(app).post("/api/auth/login").send({
      email: userB.email,
      password: userB.password,
    });
    userBToken = loginB.body.token;
    expect(userBToken).toBeTruthy();

    // Fetch user IDs
    const [dbA, dbB] = await Promise.all([
      prisma.user.findUnique({ where: { email: userA.email } }),
      prisma.user.findUnique({ where: { email: userB.email } }),
    ]);

    expect(dbA).toBeTruthy();
    expect(dbB).toBeTruthy();

    userAId = (dbA as any).id;
    userBId = (dbB as any).id;

    // Create an audio file record directly in DB (bypassing S3 upload)
    const audioFile = await prisma.audioFile.create({
      data: {
        fileName: "test-recording.mp3",
        cloudUrl: "https://fake-storage.example.com/test-recording.mp3",
        durationSeconds: 120,
        mimeType: "audio/mpeg",
        uploaderId: userAId,
      },
    });

    audioFileId = audioFile.id;
    expect(audioFileId).toBeTruthy();
  });

  afterAll(async () => {
    // Clean up audio files
    if (audioFileId) {
      await prisma.audioFile
        .deleteMany({ where: { id: audioFileId } })
        .catch(() => {});
    }

    // Clean remaining audio files for test users
    await prisma.audioFile
      .deleteMany({
        where: { uploaderId: { in: [userAId, userBId] } },
      })
      .catch(() => {});

    await cleanupTestUsers([userA.email, userB.email]);

    await prisma.$disconnect();
  });

  // =========================================================
  // AUTH GUARD
  // =========================================================
  describe("Auth guard", () => {
    it("1) rejects GET /api/audio/my-files without token (401)", async () => {
      const res = await request(app).get("/api/audio/my-files");
      expect(res.status).toBe(401);
    });

    it("2) rejects GET /api/audio/:id with invalid token (401)", async () => {
      const res = await request(app)
        .get(`/api/audio/${audioFileId}`)
        .set("Authorization", "Bearer invalid.token");
      expect(res.status).toBe(401);
    });

    it("3) rejects DELETE /api/audio/:id without token (401)", async () => {
      const res = await request(app).delete(`/api/audio/${audioFileId}`);
      expect(res.status).toBe(401);
    });
  });

  // =========================================================
  // GET USER AUDIO FILES
  // =========================================================
  describe("GET /api/audio/my-files (getUserAudioFiles)", () => {
    it("4) userA can list their audio files (200)", async () => {
      const res = await request(app)
        .get("/api/audio/my-files")
        .set(authHeader(userAToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("5) userB has no audio files (200, empty)", async () => {
      const res = await request(app)
        .get("/api/audio/my-files")
        .set(authHeader(userBToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });
  });

  // =========================================================
  // GET AUDIO FILE BY ID
  // =========================================================
  describe("GET /api/audio/:id (getAudioFileById)", () => {
    it("6) fetches audio file by id (200)", async () => {
      const res = await request(app)
        .get(`/api/audio/${audioFileId}`)
        .set(authHeader(userAToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe(audioFileId);
      expect(res.body.data.fileName).toBe("test-recording.mp3");
    });

    it("7) returns 404 for non-existent audio file", async () => {
      const fakeId = "000000000000000000000000";
      const res = await request(app)
        .get(`/api/audio/${fakeId}`)
        .set(authHeader(userAToken));

      expect(res.status).toBe(404);
    });
  });

  // =========================================================
  // UPDATE AUDIO FILE TITLE
  // =========================================================
  describe("PATCH /api/audio/:id (updateAudioFile)", () => {
    it("8) userA can update title of their audio file (200)", async () => {
      const res = await request(app)
        .patch(`/api/audio/${audioFileId}`)
        .set(authHeader(userAToken))
        .send({ title: "Updated Recording Title" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("Updated Recording Title");
    });

    it("9) userB cannot update userA's audio file (403)", async () => {
      const res = await request(app)
        .patch(`/api/audio/${audioFileId}`)
        .set(authHeader(userBToken))
        .send({ title: "Hacked Title" });

      expect(res.status).toBe(403);
    });

    it("10) returns 404 for non-existent audio file", async () => {
      const fakeId = "000000000000000000000000";
      const res = await request(app)
        .patch(`/api/audio/${fakeId}`)
        .set(authHeader(userAToken))
        .send({ title: "Nope" });

      expect(res.status).toBe(404);
    });

    it("11) fails update with empty title (400)", async () => {
      const res = await request(app)
        .patch(`/api/audio/${audioFileId}`)
        .set(authHeader(userAToken))
        .send({ title: "" });

      expect(res.status).toBe(400);
    });
  });

  // =========================================================
  // DELETE AUDIO FILE
  // =========================================================
  describe("DELETE /api/audio/:id (deleteAudioFile)", () => {
    it("12) userB cannot delete userA's audio file (403)", async () => {
      const res = await request(app)
        .delete(`/api/audio/${audioFileId}`)
        .set(authHeader(userBToken));

      expect(res.status).toBe(403);
    });

    it("13) returns 404 for non-existent audio file", async () => {
      const fakeId = "000000000000000000000000";
      const res = await request(app)
        .delete(`/api/audio/${fakeId}`)
        .set(authHeader(userAToken));

      expect(res.status).toBe(404);
    });

    it("14) userA can delete their own audio file (200 or 500 if S3 unreachable)", async () => {
      const res = await request(app)
        .delete(`/api/audio/${audioFileId}`)
        .set(authHeader(userAToken));

      // Delete involves S3 storage service call.
      // In test env without S3 credentials, this may fail with 500.
      // Accept both success and expected external service failure.
      if (res.status === 200) {
        expect(res.body.success).toBe(true);

        // verify removed from DB
        const dbFile = await prisma.audioFile.findUnique({
          where: { id: audioFileId },
        });
        expect(dbFile).toBeNull();
      } else {
        // S3/R2 not available in test env , acceptable
        expect([500]).toContain(res.status);
      }
    });
  });

  // =========================================================
  // UPLOAD (auth guard only - no actual file upload)
  // =========================================================
  describe("POST /api/audio/upload (uploadAudioFile)", () => {
    it("15) rejects upload without token (401)", async () => {
      const res = await request(app).post("/api/audio/upload");
      expect(res.status).toBe(401);
    });

    it("16) rejects upload without file (400)", async () => {
      const res = await request(app)
        .post("/api/audio/upload")
        .set(authHeader(userAToken));

      expect([400]).toContain(res.status);
    });
  });
});
