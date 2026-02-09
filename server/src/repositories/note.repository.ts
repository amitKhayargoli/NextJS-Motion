import { PrismaClient } from "../generated/prisma/client";

import {
  INote,
  ICreateNoteData,
  IUpdateNoteData,
  INoteFilters,
  NoteType,
} from "../types/note.type";

export interface INoteRepository {
  create(data: ICreateNoteData): Promise<INote>;
  findById(id: string): Promise<INote | null>;
  findAll(filters?: INoteFilters): Promise<INote[]>;
  findByWorkspaceId(workspaceId: string): Promise<INote[]>;
  findByAuthorId(authorId: string): Promise<INote[]>;
  update(id: string, data: IUpdateNoteData): Promise<INote>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  count(filters?: INoteFilters): Promise<number>;
}

export class NoteRepository implements INoteRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: ICreateNoteData): Promise<INote> {
    const note = await this.prisma.note.create({
      data: {
        title: data.title,
        content: data.content,
        type: data.type || NoteType.MANUAL,
        authorId: data.authorId,
        workspaceId: data.workspaceId,
        audioFileId: data.audioFileId,
        isSynced: false,
      },
    });

    return this.mapToINote(note);
  }

  async findById(id: string): Promise<INote | null> {
    const note = await this.prisma.note.findUnique({
      where: { id },
    });

    return note ? this.mapToINote(note) : null;
  }

  async findAll(filters?: INoteFilters): Promise<INote[]> {
    const where: any = {};

    if (filters?.workspaceId) {
      where.workspaceId = filters.workspaceId;
    }

    if (filters?.authorId) {
      where.authorId = filters.authorId;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.searchQuery) {
      where.OR = [
        { title: { contains: filters.searchQuery, mode: "insensitive" } },
        { content: { contains: filters.searchQuery, mode: "insensitive" } },
      ];
    }

    const notes = await this.prisma.note.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return notes.map((note: any) => this.mapToINote(note));
  }

  async findByWorkspaceId(workspaceId: string): Promise<INote[]> {
    const notes = await this.prisma.note.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: "desc" },
    });

    return notes.map((note: any) => this.mapToINote(note));
  }

  async findByAuthorId(authorId: string): Promise<INote[]> {
    const notes = await this.prisma.note.findMany({
      where: { authorId },
      orderBy: { updatedAt: "desc" },
    });

    return notes.map((note: any) => this.mapToINote(note));
  }

  async update(id: string, data: IUpdateNoteData): Promise<INote> {
    const note = await this.prisma.note.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
        ...(data.summary !== undefined && { summary: data.summary }),
        isSynced: false,
        updatedAt: new Date(),
      },
    });

    return this.mapToINote(note);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.note.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.note.count({
      where: { id },
    });
    return count > 0;
  }

  async count(filters?: INoteFilters): Promise<number> {
    const where: any = {};

    if (filters?.workspaceId) {
      where.workspaceId = filters.workspaceId;
    }

    if (filters?.authorId) {
      where.authorId = filters.authorId;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    return await this.prisma.note.count({ where });
  }

  private mapToINote(note: any): INote {
    return {
      id: note.id,
      title: note.title,
      content: note.content,
      summary: note.summary,
      type: note.type as NoteType,
      authorId: note.authorId,
      workspaceId: note.workspaceId,
      audioFileId: note.audioFileId,
      isSynced: note.isSynced,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }
}
