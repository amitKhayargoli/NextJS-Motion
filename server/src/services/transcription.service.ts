import { PrismaClient, NoteStatus, NoteType } from "../generated/prisma/client";
import { EmbeddingService } from "./embedding.service";
import axios from "axios";

type TranscribeResponse = {
  text: string;
  language?: string;
};

export class TranscriberService {
  constructor(private baseUrl: string) {}

  async transcribeFromUrl(audioUrl: string): Promise<TranscribeResponse> {
    const res = await axios.post<TranscribeResponse>(
      `${this.baseUrl}/transcribe`,
      { audio_url: audioUrl },
      { timeout: 1000 * 60 * 10 },
    );

    return {
      text: res.data?.text ?? "",
      language: res.data?.language ?? "",
    };
  }
}

export class TranscriptionService {
  constructor(
    private prisma: PrismaClient,
    private transcriber: TranscriberService,
    private embeddingService: EmbeddingService,
  ) {}

  async transcribeAudioToNote(params: {
    audioFileId: string;
    workspaceId: string;
    userId: string;
    noteTitle?: string;
  }) {
    const audio = await this.prisma.audioFile.findUnique({
      where: { id: params.audioFileId },
      select: { id: true, cloudUrl: true },
    });

    if (!audio) throw new Error("Audio file not found");

    // create note first (PROCESSING)
    const note = await this.prisma.note.create({
      data: {
        title: params.noteTitle?.trim() || "Meeting Transcript",
        content: "",
        type: NoteType.VOICE_TRANSCRIPT,
        status: NoteStatus.PROCESSING,
        authorId: params.userId,
        workspaceId: params.workspaceId,
        audioFileId: audio.id,
      },
    });

    const out = await this.transcriber.transcribeFromUrl(audio.cloudUrl);
    const transcript = (out.text ?? "").trim();

    const updated = await this.prisma.note.update({
      where: { id: note.id },
      data: {
        content: transcript,
        status: transcript ? NoteStatus.PUBLISHED : NoteStatus.DRAFT,
      },
    });

    if (transcript) {
      this.embeddingService
        .embedNoteChunks(updated.id)
        .catch((e) =>
          console.error("EMBED TRANSCRIPT FAILED:", updated.id, e.message),
        );
    }

    return { note: updated, language: out.language ?? "" };
  }
}
