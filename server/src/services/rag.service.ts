import { stripHtml } from "../lib/stripHtml";
import { PrismaClient } from "../generated/prisma/client";
import { ollamaEmbed, ollamaGenerate } from "../lib/ollama";

type RetrievedChunk = {
  noteId: string; // ALWAYS 24-char hex string after normalization
  workspaceId: string; // ALWAYS 24-char hex string after normalization
  chunkIndex: number;
  chunkText: string;
  score: number;
};

function oidToString(v: any): string {
  if (!v) return "";
  if (typeof v === "string") return v;

  // Extended JSON: { $oid: "..." }
  if (typeof v === "object" && typeof v.$oid === "string") return v.$oid;

  // BSON ObjectId (common)
  if (typeof v?.toHexString === "function") return v.toHexString();

  // Sometimes it stringifies to {"$oid":"..."}
  try {
    const j = JSON.stringify(v);
    const m = j.match(/"\$oid"\s*:\s*"([^"]+)"/);
    if (m?.[1]) return m[1];
  } catch {}

  // Last resort (reject [object Object])
  const s = String(v);
  return s === "[object Object]" ? "" : s;
}

function isObjectIdString(id: string) {
  return /^[a-f0-9]{24}$/i.test(id);
}

export class RagService {
  constructor(private prisma: PrismaClient) {}

  private looksLikeGreeting(q: string) {
    const s = q.trim().toLowerCase();
    return (
      s === "hi" ||
      s === "hello" ||
      s === "hey" ||
      s === "yo" ||
      s === "sup" ||
      s === "good morning" ||
      s === "good evening"
    );
  }
  private looksLikeCountQuestion(q: string) {
    const s = q.toLowerCase();
    return (
      s.includes("how many notes") ||
      s.includes("number of notes") ||
      s.includes("count of notes") ||
      s.match(/\bcount\b.*\bnotes\b/) !== null
    );
  }

  private looksLikeListNotes(q: string) {
    const s = q.toLowerCase();
    return (
      s === "list notes" ||
      s.includes("list notes") ||
      s.includes("show notes") ||
      s.includes("all notes") ||
      s.includes("notes in this workspace") ||
      s.includes("what notes do i have")
    );
  }

  private looksLikeLatestNotes(q: string) {
    const s = q.toLowerCase();
    return (
      s.includes("latest note") ||
      s.includes("latest notes") ||
      s.includes("most recent note") ||
      s.includes("recent notes") ||
      s.includes("recently updated")
    );
  }

  async retrieveTopChunks(params: {
    workspaceId: string;
    query: string;
    topK?: number;
    minScore?: number;
  }): Promise<RetrievedChunk[]> {
    const topK = params.topK ?? 8;
    const qVec = await ollamaEmbed(params.query);

    const result: any = await this.prisma.$runCommandRaw({
      aggregate: "NoteChunkEmbedding",
      pipeline: [
        {
          $vectorSearch: {
            index: "noteChunkVectorIndex",
            path: "vector",
            queryVector: qVec,
            numCandidates: Math.max(50, topK * 10),
            limit: topK,
            filter: {
              workspaceId: { $eq: { $oid: params.workspaceId } },
              status: { $eq: "READY" },
            },
          },
        },
        {
          $project: {
            _id: 0,
            noteId: 1,
            workspaceId: 1,
            chunkIndex: 1,
            chunkText: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ],
      cursor: {},
    });

    const docs: RetrievedChunk[] =
      result?.cursor?.firstBatch?.map((d: any) => ({
        noteId: oidToString(d.noteId),
        workspaceId: oidToString(d.workspaceId),
        chunkIndex: Number(d.chunkIndex),
        chunkText: String(d.chunkText ?? ""),
        score: d.score ?? 0,
      })) ?? [];

    const cleaned = docs.filter(
      (d) => isObjectIdString(d.noteId) && isObjectIdString(d.workspaceId),
    );

    if (params.minScore != null) {
      return cleaned.filter((d) => d.score >= params.minScore!);
    }

    return cleaned;
  }

  async answerWithNotes(params: {
    workspaceId: string;
    question: string;
    history?: { role: "user" | "assistant"; content: string }[];
  }) {
    const REFUSAL =
      "I couldn’t find any relevant context in your notes for that question.";

    // Greeting
    if (this.looksLikeGreeting(params.question)) {
      return {
        kind: "greeting",
        answer: "Hey 😄 Ask me anything about your notes!",
        sources: [],
      };
    }

    // 1) COUNT NOTES
    if (this.looksLikeCountQuestion(params.question)) {
      const total = await this.prisma.note.count({
        where: { workspaceId: params.workspaceId },
      });

      return {
        kind: "count_notes",
        answer: `There are ${total} notes in this workspace.`,
        sources: [
          { type: "db", op: "note.count", workspaceId: params.workspaceId },
        ],
      };
    }

    // 2) LIST NOTES (top 10)
    if (this.looksLikeListNotes(params.question)) {
      const notes = await this.prisma.note.findMany({
        where: { workspaceId: params.workspaceId },
        select: {
          id: true,
          title: true,
          updatedAt: true,
          type: true,
          status: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
      });

      return {
        kind: "note_list",
        answer: notes.length
          ? `Here are your latest ${notes.length} notes:`
          : "No notes found.",
        notes: notes.map((n) => ({
          id: String(n.id),
          title: n.title,
          updatedAt: n.updatedAt,
          type: n.type,
          status: n.status,
        })),
        sources: [{ type: "db", op: "note.findMany" }],
      };
    }

    // 3) LATEST NOTES (top 3)
    if (this.looksLikeLatestNotes(params.question)) {
      const notes = await this.prisma.note.findMany({
        where: { workspaceId: params.workspaceId },
        select: {
          id: true,
          title: true,
          updatedAt: true,
          type: true,
          status: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 3,
      });

      return {
        kind: "latest_notes",
        answer: notes.length ? "Most recently updated:" : "No notes found.",
        notes: notes.map((n) => ({
          id: String(n.id),
          title: n.title,
          updatedAt: n.updatedAt,
          type: n.type,
          status: n.status,
        })),
        sources: [{ type: "db", op: "note.findMany" }],
      };
    }

    // 4) VECTOR RAG
    const chunks = await this.retrieveTopChunks({
      workspaceId: params.workspaceId,
      query: params.question,
      topK: 12,
      minScore: 0.78,
    });

    if (chunks.length === 0) {
      return {
        kind: "no_context",
        answer: REFUSAL,
        sources: [],
      };
    }

    console.log("RAG chunks:", chunks.length);

    // Dedupe sources by NOTE (not by chunk)
    // Prefer title chunk (chunkIndex 0) when available; else keep highest score chunk.
    const bestByNote = new Map<
      string,
      { noteId: string; chunkIndex: number; score: number }
    >();

    for (const c of chunks) {
      const prev = bestByNote.get(c.noteId);

      if (!prev) {
        bestByNote.set(c.noteId, {
          noteId: c.noteId,
          chunkIndex: c.chunkIndex,
          score: c.score,
        });
        continue;
      }

      const prevIsTitle = prev.chunkIndex === 0;
      const currIsTitle = c.chunkIndex === 0;

      // Prefer title chunk for the source chip
      if (!prevIsTitle && currIsTitle) {
        bestByNote.set(c.noteId, {
          noteId: c.noteId,
          chunkIndex: c.chunkIndex,
          score: c.score,
        });
        continue;
      }

      // Otherwise keep higher score
      if (c.score > prev.score) {
        bestByNote.set(c.noteId, {
          noteId: c.noteId,
          chunkIndex: c.chunkIndex,
          score: c.score,
        });
      }
    }

    const uniqueSources = Array.from(bestByNote.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 1);

    // Fetch titles for those notes (for source chips)
    const uniqueNoteIds = uniqueSources
      .map((s) => s.noteId)
      .filter(isObjectIdString);

    const notes = uniqueNoteIds.length
      ? await this.prisma.note.findMany({
          where: { id: { in: uniqueNoteIds } },
          select: { id: true, title: true },
        })
      : [];

    const titleMap = new Map(notes.map((n) => [String(n.id), n.title]));

    const context = chunks
      .map((c, i) => {
        const clean = stripHtml(c.chunkText);
        return `[#${i + 1} note=${c.noteId} chunk=${c.chunkIndex} score=${c.score.toFixed(
          3,
        )}]\n${clean}`;
      })
      .join("\n\n");

    const historyBlock = (params.history ?? [])
      .slice(-6)
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    const prompt = `
You are a helpful assistant that answers questions using ONLY the user's workspace notes provided as context.

If the context does NOT contain the answer, reply EXACTLY with:
"${REFUSAL}"

Do NOT answer using general knowledge.
Do NOT invent facts.
Return ONLY the answer in plain text. Do NOT include a Sources section.
Do NOT use HTML tags like <p>, <div>, <br>.
${historyBlock ? `Conversation so far:\n${historyBlock}\n\n` : ""}

Context from notes:
${context || "(no relevant context found)"}

User question:
${params.question}
`.trim();

    const answer = await ollamaGenerate(prompt);

    const cleanedAnswer = (answer ?? "").trim();
    const finalAnswer = cleanedAnswer.length === 0 ? REFUSAL : cleanedAnswer;

    return {
      kind: "rag_answer",
      answer: finalAnswer,
      sources: uniqueSources.map((s) => ({
        noteId: s.noteId,
        noteTitle: titleMap.get(s.noteId) ?? "Untitled",
        chunkIndex: s.chunkIndex,
        score: s.score,
      })),
      chunks, // keep for debugging; remove in prod if you don't want to expose it
    };
  }

  async updateThreadTitle(threadId: string, userId: string, title: string) {
    const thread = await this.prisma.chatThread.findFirst({
      where: { id: threadId, userId },
      select: { id: true },
    });

    if (!thread) throw new Error("Thread not found");

    const updated = await this.prisma.chatThread.update({
      where: { id: threadId },
      data: { title },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    });

    return { ...updated, id: String(updated.id) };
  }
}
