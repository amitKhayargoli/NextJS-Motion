import { Router } from "express";
import { NoteRepository } from "../repositories/note.repository";
import { NoteService } from "../services/note.service";
import { NoteController } from "../controllers/note.controller";
import { NoteRoutes } from "../routes/note.route";
import { PrismaClient } from "../generated/prisma/client";
import { WorkspaceRepository } from "../repositories/workspace.repository";
import { WorkspaceService } from "../services/workspace.service";
import { WorkspaceController } from "../controllers/workspace.controller";
import { WorkspaceRoutes } from "../routes/workspace.route";
import { AudioFileRepository } from "../repositories/audioFile.repository";
import { AudioFileService } from "../services/audioFile.service";
import { AudioFileController } from "../controllers/audioFile.controller";
import { AudioFileRoutes } from "../routes/audioFile.route";

import { RagService } from "../services/rag.service";
import { RagController } from "../controllers/rag.controller";
import { RagRoutes } from "../routes/rag.route";

import { EmbeddingService } from "../services/embedding.service";
import { TranscriberService } from "../services/transcription.service";

export class DIContainer {
  private static instance: DIContainer;
  private prisma: PrismaClient;

  // Note
  private noteRepository: NoteRepository;
  private noteService: NoteService;
  private noteController: NoteController;
  private noteRoutes: NoteRoutes;

  // Workspace
  private workspaceRepository: WorkspaceRepository;
  private workspaceService: WorkspaceService;
  private workspaceController: WorkspaceController;
  private workspaceRoutes: WorkspaceRoutes;

  // AudioFile layer
  private audioFileRepository: AudioFileRepository;
  private audioFileService: AudioFileService;
  private audioFileController: AudioFileController;
  private audioFileRoutes: AudioFileRoutes;

  // Rag Layer
  private ragService: RagService;
  private ragController: RagController;
  private ragRoutes: RagRoutes;

  // Microservices layer
  private embeddingService: EmbeddingService;
  private transcriberService: TranscriberService;

  // Add combined router
  private apiRouter: Router;

  private constructor() {
    this.prisma = new PrismaClient();

    this.embeddingService = new EmbeddingService(this.prisma);

    const transcriberUrl =
      process.env.TRANSCRIBER_URL || "http://localhost:8001";
    this.transcriberService = new TranscriberService(transcriberUrl);

    // Note DI
    this.noteRepository = new NoteRepository(this.prisma);
    this.noteService = new NoteService(this.noteRepository, this.prisma);
    this.noteController = new NoteController(this.noteService);
    this.noteRoutes = new NoteRoutes(this.noteController);

    // Workspace DI
    this.workspaceRepository = new WorkspaceRepository(this.prisma);
    this.workspaceService = new WorkspaceService(this.workspaceRepository);
    this.workspaceController = new WorkspaceController(this.workspaceService);
    this.workspaceRoutes = new WorkspaceRoutes(this.workspaceController);

    // Initialize AudioFile layer
    this.audioFileRepository = new AudioFileRepository(this.prisma);
    this.audioFileService = new AudioFileService(this.audioFileRepository);
    this.audioFileController = new AudioFileController(
      this.audioFileService,
      this.prisma,
      this.transcriberService,
      this.embeddingService,
    );
    this.audioFileRoutes = new AudioFileRoutes(this.audioFileController);

    // RAG DI
    this.ragService = new RagService(this.prisma);
    this.ragController = new RagController(this.prisma, this.ragService);
    this.ragRoutes = new RagRoutes(this.ragController);

    // Combine all routes
    this.apiRouter = Router();
    this.apiRouter.use(this.noteRoutes.getRouter());
    this.apiRouter.use(this.workspaceRoutes.getRouter());
    this.apiRouter.use(this.audioFileRoutes.getRouter());
    this.apiRouter.use(this.ragRoutes.getRouter());
  }

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  getApiRouter(): Router {
    return this.apiRouter;
  }

  getNoteRoutes(): NoteRoutes {
    return this.noteRoutes;
  }

  getWorkspaceRoutes(): WorkspaceRoutes {
    return this.workspaceRoutes;
  }

  getAudioFileRoutes(): AudioFileRoutes {
    return this.audioFileRoutes;
  }

  getRagRoutes(): RagRoutes {
    return this.ragRoutes;
  }

  async closeConnections(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
