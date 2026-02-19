import { NoteType, PrismaClient, Role } from "../generated/prisma/client";

import {
  INote,
  ICreateNoteData,
  IUpdateNoteData,
  INoteFilters,
  INoteListItem,
  NoteWithRoleResult,
} from "../types/note.type";

export interface INoteRepository {
  create(data: ICreateNoteData): Promise<INote>;
  findById(id: string): Promise<INote | null>;
  findByIdWithRole(
    noteId: string,
    userId: string,
  ): Promise<NoteWithRoleResult | null>;
  findAll(filters?: INoteFilters): Promise<INote[]>;
  findByWorkspaceId(workspaceId: string): Promise<INote[]>;
  findByAuthorId(authorId: string): Promise<INote[]>;
  update(id: string, data: IUpdateNoteData): Promise<INote>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  findPaged(
    filters: INoteFilters,
    paging: {
      skip: number;
      limit: number;
    },
  ): Promise<INoteListItem[]>;

  count(filters?: INoteFilters): Promise<number>;
}

export class NoteRepository implements INoteRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: ICreateNoteData): Promise<INote> {
    const note = await this.prisma.note.create({
      data: {
        title: data.title,
        content: data.content ?? "",
        type: data.type || NoteType.MANUAL,
        authorId: data.authorId,
        workspaceId: data.workspaceId,
        // Only connect if the ID exists, otherwise leave undefined
        ...(data.audioFileId && { audioFileId: data.audioFileId }),
        status: "DRAFT",
        isSynced: false,
      },
      include: {
        author: true,
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

  // find by note id with user role
  async findByIdWithRole(
    noteId: string,
    userId: string,
  ): Promise<NoteWithRoleResult | null> {
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
        type: true,
        status: true,
        authorId: true,
        workspaceId: true,
        audioFileId: true,
        isSynced: true,
        createdAt: true,
        updatedAt: true,
        workspace: {
          select: {
            ownerId: true,
            UserRoles: {
              where: { userId, workspaceId: undefined as any }, // replaced below
              select: { role: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!note || !note.workspace) return null;

    // ✅ Fix workspaceId filter properly (needs note.workspaceId)
    // Prisma doesn't allow referencing note.workspaceId inside the query directly,
    // so do a second query OR restructure selection:
    const roleRow = await this.prisma.userRoles.findUnique({
      where: {
        unique_user_workspace_role: {
          userId,
          workspaceId: note.workspaceId,
        },
      },
      select: { role: true },
    });

    const userRole: Role =
      note.workspace.ownerId === userId
        ? Role.OWNER
        : (roleRow?.role ?? Role.VIEWER);

    return {
      note: this.mapToINote(note),
      userRole,
    };
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
  async findPaged(
    filters: INoteFilters,
    paging: { skip: number; limit: number },
  ): Promise<INoteListItem[]> {
    const { skip, limit } = paging;

    const where: any = {
      workspaceId: filters.workspaceId,
      ...(filters.authorId ? { authorId: filters.authorId } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.searchQuery
        ? { title: { contains: filters.searchQuery, mode: "insensitive" } }
        : {}),
    };

    return this.prisma.note.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      skip,
      take: limit,
      select: { id: true, title: true, updatedAt: true, type: true },
    });
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

  async update(id: string, data: Partial<INote>): Promise<INote> {
    const updatedNote = await this.prisma.note.update({
      where: { id },
      data: {
        ...data,
        // If content is being added, automatically move out of DRAFT
        status:
          data.content && data.content.length > 0 ? "PUBLISHED" : data.status,
        isSynced: false, // Mark for sync whenever updated
      },
    });
    return this.mapToINote(updatedNote);
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
    const { workspace, ...n } = note;

    return {
      id: String(n.id),
      title: n.title,
      content: n.content,
      summary: n.summary,
      type: n.type as NoteType,
      status: n.status,
      authorId: n.authorId,
      workspaceId: n.workspaceId,
      audioFileId: n.audioFileId,
      isSynced: n.isSynced,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    };
  }
}
