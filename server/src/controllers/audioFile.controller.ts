import { Request, Response } from "express";
import { AudioFileService } from "../services/audioFile.service";
import { parseBuffer } from "music-metadata";
import { User } from "@generated/prisma/client";

export class AudioFileController {
  constructor(private audioFileService: AudioFileService) {
    this.uploadAudioFile = this.uploadAudioFile.bind(this);
    this.getAudioFileById = this.getAudioFileById.bind(this);
    this.getUserAudioFiles = this.getUserAudioFiles.bind(this);
    this.deleteAudioFile = this.deleteAudioFile.bind(this);
  }

  async uploadAudioFile(req: Request, res: Response) {
    async function getDurationFromBuffer(
      buffer: Buffer,
      mimetype: string,
    ): Promise<number> {
      const metadata = await parseBuffer(buffer, mimetype);
      return metadata.format.duration || 0;
    }

    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, error: "No audio file provided" });
      }

      // Get user id from JWT (set by authorizedMiddleware)
      // const userId = req.user?.id;
      const reqWithUser = req as Request & { user?: User };
      const userId = reqWithUser.user?.id;
      if (!userId)
        return res.status(401).json({ success: false, error: "Unauthorized" });

      // const durationSeconds = parseInt(req.body.durationSeconds) || 0;
      const durationSeconds = await getDurationFromBuffer(
        req.file.buffer,
        req.file.mimetype,
      );

      const audioFile = await this.audioFileService.uploadAudioFile(
        req.file,
        userId,
        durationSeconds,
      );

      res.status(201).json({ success: true, data: audioFile });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getAudioFileById(req: Request, res: Response): Promise<void> {
    try {
      const audioFile = await this.audioFileService.getAudioFileById(
        req.params.id,
      );

      res.status(200).json({
        success: true,
        data: audioFile,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getUserAudioFiles(req: Request, res: Response) {
    try {
      const reqWithUser = req as Request & { user?: User };
      const userId = reqWithUser.user?.id;
      // const userId = req.user?.id;
      if (!userId)
        return res.status(401).json({ success: false, error: "Unauthorized" });
      const audioFiles = await this.audioFileService.getUserAudioFiles(userId);

      res.status(200).json({
        success: true,
        data: audioFiles,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async deleteAudioFile(req: Request, res: Response) {
    try {
      // const userId = req.user?.id;
      const reqWithUser = req as Request & { user?: User };
      const userId = reqWithUser.user?.id;
      if (!userId)
        return res.status(401).json({ success: false, error: "Unauthorized" });
      await this.audioFileService.deleteAudioFile(req.params.id, userId);

      res.status(200).json({
        success: true,
        message: "Audio file deleted successfully",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private handleError(error: unknown, res: Response): void {
    if (error instanceof Error) {
      if (error.message.startsWith("Validation failed")) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }

      if (error.message === "Audio file not found") {
        res.status(404).json({ success: false, error: error.message });
        return;
      }

      if (error.message.includes("only delete your own")) {
        res.status(403).json({ success: false, error: error.message });
        return;
      }

      res.status(500).json({ success: false, error: error.message });
    } else {
      res
        .status(500)
        .json({ success: false, error: "An unknown error occurred" });
    }
  }
}
