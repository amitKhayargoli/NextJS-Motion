import { Request, Response } from "express";
import { AudioFileService } from "../services/audioFile.service";
import { parseBuffer } from "music-metadata";
import {
  User,
  NoteStatus,
  NoteType,
  PrismaClient,
} from "../generated/prisma/client";
import { TranscriberService } from "../services/transcription.service";
import { EmbeddingService } from "../services/embedding.service";

export class AudioFileController {
  constructor(
    private audioFileService: AudioFileService,
    private prisma: PrismaClient,
    private transcriber: TranscriberService,
    private embeddingService: EmbeddingService,
  ) {
    this.uploadAudioFile = this.uploadAudioFile.bind(this);
    this.getAudioFileById = this.getAudioFileById.bind(this);
    this.getUserAudioFiles = this.getUserAudioFiles.bind(this);
    this.deleteAudioFile = this.deleteAudioFile.bind(this);
    this.transcribeAudioFile = this.transcribeAudioFile.bind(this);
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

      const reqWithUser = req as Request & { user?: User };
      const userId = reqWithUser.user?.id;
      if (!userId)
        return res.status(401).json({ success: false, error: "Unauthorized" });

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

  async transcribeAudioFile(req: Request, res: Response) {
    try {
      const reqWithUser = req as Request & { user?: User };
      const userId = reqWithUser.user?.id;
      if (!userId)
        return res.status(401).json({ success: false, error: "Unauthorized" });

      const audioFileId = req.params.id;
      const { workspaceId, noteTitle } = req.body as {
        workspaceId: string;
        noteTitle?: string;
      };

      if (!workspaceId) {
        return res
          .status(400)
          .json({ success: false, error: "workspaceId is required" });
      }

      // 1) fetch audioFile
      const audio = await this.prisma.audioFile.findUnique({
        where: { id: audioFileId },
        select: { id: true, cloudUrl: true },
      });

      if (!audio) {
        return res
          .status(404)
          .json({ success: false, error: "Audio file not found" });
      }

      // 2) find existing note for this audio, else create
      let note = await this.prisma.note.findFirst({
        where: { audioFileId: audio.id },
        select: { id: true },
      });

      const title = noteTitle?.trim() || "Meeting Transcript";

      const noteId = note?.id
        ? note.id
        : (
            await this.prisma.note.create({
              data: {
                title,
                content: "",
                type: NoteType.VOICE_TRANSCRIPT,
                status: NoteStatus.PROCESSING,
                authorId: userId,
                workspaceId,
                audioFileId: audio.id,
              },
              select: { id: true },
            })
          ).id;

      // always set status=PROCESSING before transcribing (for retries)
      await this.prisma.note.update({
        where: { id: noteId },
        data: {
          status: NoteStatus.PROCESSING,
          // optional: update title on re-run
          title,
        },
      });

      // 3) call FastAPI transcriber
      const out = await this.transcriber.transcribeFromUrl(audio.cloudUrl);
      const transcript = (out.text ?? "").trim();

      // 4) update note with transcript
      const updatedNote = await this.prisma.note.update({
        where: { id: noteId },
        data: {
          content: transcript,
          status: transcript ? NoteStatus.PUBLISHED : NoteStatus.DRAFT,
        },
      });

      // 5) embed note chunks
      if (transcript) {
        this.embeddingService
          .embedNoteChunks(updatedNote.id)
          .catch((e) =>
            console.error(
              "EMBED TRANSCRIPT FAILED:",
              updatedNote.id,
              e.message,
            ),
          );
      }

      return res.status(200).json({
        success: true,
        data: { note: updatedNote, language: out.language ?? "" },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getAudioFileById(req: Request, res: Response): Promise<void> {
    try {
      const audioFile = await this.audioFileService.getAudioFileById(
        req.params.id,
      );

      res.status(200).json({ success: true, data: audioFile });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getUserAudioFiles(req: Request, res: Response) {
    try {
      const reqWithUser = req as Request & { user?: User };
      const userId = reqWithUser.user?.id;
      if (!userId)
        return res.status(401).json({ success: false, error: "Unauthorized" });

      const audioFiles = await this.audioFileService.getUserAudioFiles(userId);

      res.status(200).json({ success: true, data: audioFiles });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async deleteAudioFile(req: Request, res: Response) {
    try {
      const reqWithUser = req as Request & { user?: User };
      const userId = reqWithUser.user?.id;
      if (!userId)
        return res.status(401).json({ success: false, error: "Unauthorized" });

      await this.audioFileService.deleteAudioFile(req.params.id, userId);

      res
        .status(200)
        .json({ success: true, message: "Audio file deleted successfully" });
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
