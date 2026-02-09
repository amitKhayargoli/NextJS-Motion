import { Router } from "express";
import { AudioFileController } from "../controllers/audioFile.controller";
import { uploadAudio } from "../utils/upload.middleware";
import { authorizedMiddleware } from "../middleware/authorized.middleware";

export class AudioFileRoutes {
  private router: Router;

  constructor(private audioFileController: AudioFileController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Upload audio file
    this.router.post(
      "/audio/upload",
      authorizedMiddleware,
      uploadAudio.single("audio"),
      this.audioFileController.uploadAudioFile,
    );

    // Get user's audio files
    this.router.get(
      "/audio/my-files",
      authorizedMiddleware,
      this.audioFileController.getUserAudioFiles,
    );
    // Get audio file by ID
    this.router.get(
      "/audio/:id",
      authorizedMiddleware,
      this.audioFileController.getAudioFileById,
    );

    // Delete audio file
    this.router.delete(
      "/audio/:id",
      authorizedMiddleware,
      this.audioFileController.deleteAudioFile,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
