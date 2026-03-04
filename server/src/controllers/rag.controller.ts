// server/src/controllers/rag.controller.ts

import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma/client";
import { RagService } from "../services/rag.service";

export class RagController {
  constructor(
    private prisma: PrismaClient,
    private rag: RagService,
  ) {}

  private getUserId(req: any) {
    const id = req.user?.id || req.userId;
    if (!id) throw new Error("Unauthorized");
    return id as string;
  }

  async createThread(req: Request, res: Response) {
    try {
      const userId = this.getUserId(req as any);
      const { workspaceId } = req.body;

      if (!workspaceId) {
        return res
          .status(400)
          .json({ success: false, message: "workspaceId is required" });
      }

      const thread = await this.prisma.chatThread.create({
        data: {
          workspaceId,
          userId,
          title: "New chat",
        },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.json({
        success: true,
        data: { ...thread, id: String(thread.id) },
      });
    } catch (e: any) {
      return res.status(500).json({
        success: false,
        message: e?.message ?? "Create thread failed",
      });
    }
  }

  async listThreads(req: Request, res: Response) {
    try {
      const userId = this.getUserId(req as any);
      const workspaceId = String(req.query.workspaceId || "");

      if (!workspaceId) {
        return res
          .status(400)
          .json({ success: false, message: "workspaceId is required" });
      }

      const threads = await this.prisma.chatThread.findMany({
        where: { workspaceId, userId },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
        },
        take: 50,
      });

      return res.json({
        success: true,
        data: threads.map((t) => ({ ...t, id: String(t.id) })),
      });
    } catch (e: any) {
      return res
        .status(500)
        .json({ success: false, message: e?.message ?? "List threads failed" });
    }
  }

  async getThread(req: Request, res: Response) {
    try {
      const userId = this.getUserId(req as any);
      const threadId = req.params.id;

      const thread = await this.prisma.chatThread.findFirst({
        where: { id: threadId, userId },
        select: { id: true, workspaceId: true, title: true },
      });

      if (!thread) {
        return res
          .status(404)
          .json({ success: false, message: "Thread not found" });
      }

      const messages = await this.prisma.chatMessage.findMany({
        where: { threadId },
        orderBy: { createdAt: "asc" },
        select: { role: true, content: true, createdAt: true, id: true },
      });

      return res.json({
        success: true,
        data: {
          thread: { ...thread, id: String(thread.id) },
          messages: messages.map((m) => ({ ...m, id: String(m.id) })),
        },
      });
    } catch (e: any) {
      return res
        .status(500)
        .json({ success: false, message: e?.message ?? "Get thread failed" });
    }
  }

  async deleteThread(req: Request, res: Response) {
    try {
      const userId = this.getUserId(req as any);
      const threadId = String(req.params.id || "");

      if (!threadId) {
        return res
          .status(400)
          .json({ success: false, message: "threadId is required" });
      }

      // Verify ownership
      const thread = await this.prisma.chatThread.findFirst({
        where: { id: threadId, userId },
        select: { id: true, workspaceId: true },
      });

      if (!thread) {
        return res
          .status(404)
          .json({ success: false, message: "Thread not found" });
      }

      // Delete messages first (no cascade in schema)
      await this.prisma.chatMessage.deleteMany({
        where: { threadId },
      });

      // Delete thread
      await this.prisma.chatThread.delete({
        where: { id: threadId },
      });

      return res.json({
        success: true,
        message: "Thread deleted",
        data: { id: threadId, workspaceId: thread.workspaceId },
      });
    } catch (e: any) {
      return res.status(500).json({
        success: false,
        message: e?.message ?? "Delete thread failed",
      });
    }
  }

  async chat(req: Request, res: Response) {
    try {
      const userId = this.getUserId(req as any);
      const { workspaceId, question, threadId } = req.body;

      if (!workspaceId)
        return res
          .status(400)
          .json({ success: false, message: "workspaceId is required" });
      if (!question)
        return res
          .status(400)
          .json({ success: false, message: "question is required" });
      if (!threadId)
        return res
          .status(400)
          .json({ success: false, message: "threadId is required" });

      const thread = await this.prisma.chatThread.findFirst({
        where: { id: threadId, userId, workspaceId },
        select: { id: true, title: true },
      });

      if (!thread) {
        return res
          .status(404)
          .json({ success: false, message: "Thread not found" });
      }

      const last = await this.prisma.chatMessage.findMany({
        where: { threadId },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { role: true, content: true },
      });

      const history = last.reverse().map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      await this.prisma.chatMessage.create({
        data: { threadId, role: "user", content: question },
      });

      const out = await this.rag.answerWithNotes({
        workspaceId,
        question,
        history,
      });

      await this.prisma.chatMessage.create({
        data: { threadId, role: "assistant", content: out.answer },
      });

      const totalMsgs = await this.prisma.chatMessage.count({
        where: { threadId },
      });

      if (thread.title === "New chat" && totalMsgs <= 2) {
        const newTitle = String(question).slice(0, 40);
        await this.prisma.chatThread.update({
          where: { id: threadId },
          data: { title: newTitle },
        });
      }

      return res.json({ success: true, data: out });
    } catch (e: any) {
      return res
        .status(500)
        .json({ success: false, message: e?.message ?? "RAG failed" });
    }
  }

  async updateThread(req: Request, res: Response) {
    try {
      const userId = this.getUserId(req as any);
      const threadId = String(req.params.id || "");
      const title = String(req.body?.title || "").trim();

      if (!threadId) {
        return res.status(400).json({
          success: false,
          message: "threadId is required",
        });
      }

      if (!title) {
        return res.status(400).json({
          success: false,
          message: "title is required",
        });
      }

      const updated = await this.rag.updateThreadTitle(threadId, userId, title);

      return res.json({
        success: true,
        data: updated,
      });
    } catch (e: any) {
      return res.status(500).json({
        success: false,
        message: e?.message ?? "Update thread failed",
      });
    }
  }
}
