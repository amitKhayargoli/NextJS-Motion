import { PrismaClient, VectorStatus } from "../generated/prisma/client";
import { chunkText } from "../lib/chunk";
import { ollamaEmbed } from "../lib/ollama";
import { stripHtml } from "../lib/stripHtml";

export class EmbeddingService {
  constructor(private prisma: PrismaClient) {}
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private inFlight = new Set<string>();

  debounceEmbedNoteChunks(noteId: string, delayMs = 1500) {
    const existing = this.timers.get(noteId);
    if (existing) clearTimeout(existing);

    const t = setTimeout(async () => {
      this.timers.delete(noteId);

      if (this.inFlight.has(noteId)) return;
      this.inFlight.add(noteId);

      try {
        const r = await this.embedNoteChunks(noteId);
        console.log("[EMBED] debounced", noteId, r);
      } catch (e: any) {
        console.error("[EMBED] debounced failed", noteId, e?.message ?? e);
      } finally {
        this.inFlight.delete(noteId);
      }
    }, delayMs);

    this.timers.set(noteId, t);
  }
  async embedNoteChunks(noteId: string) {
    // fetch note + workspaceId + title + content
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
      select: { id: true, workspaceId: true, title: true, content: true },
    });

    if (!note) throw new Error("Note not found");

    // delete old chunks (important when re-embedding after updates)
    await this.prisma.noteChunkEmbedding.deleteMany({ where: { noteId } });

    const cleanText = stripHtml(note.content);

    const chunks: string[] = [];

    if (note.title?.trim()) {
      chunks.push(`TITLE: ${note.title.trim()}`);
    }

    if (note.content?.trim()) {
      chunks.push(...chunkText(cleanText, 1200));
    }

    if (chunks.length === 0) return { ok: true, chunks: 0 };

    // embed sequentially
    const rows = [];
    for (let i = 0; i < chunks.length; i++) {
      const vec = await ollamaEmbed(chunks[i]);

      rows.push({
        noteId: note.id,
        workspaceId: note.workspaceId,
        chunkIndex: i,
        chunkText: chunks[i],
        vector: vec,
        status: VectorStatus.READY,
      });
    }

    await this.prisma.noteChunkEmbedding.createMany({ data: rows });

    return { ok: true, chunks: rows.length };
  }
}
