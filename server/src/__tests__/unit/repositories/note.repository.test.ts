import { createMockPrisma, MockPrismaClient } from "../mockPrisma";
import { NoteRepository } from "src/repositories/note.repository";

describe("NoteRepository", () => {
  let mockPrisma: MockPrismaClient;
  let repo: NoteRepository;

  const now = new Date("2025-01-20");

  const mockPrismaNote = {
    id: "note-1",
    title: "Test Note",
    content: "Some content",
    summary: null,
    type: "MANUAL",
    status: "DRAFT",
    authorId: "user-1",
    workspaceId: "ws-1",
    audioFileId: null,
    isSynced: false,
    createdAt: now,
    updatedAt: now,
  };

  const expectedINote = {
    id: "note-1",
    title: "Test Note",
    content: "Some content",
    summary: null,
    type: "MANUAL",
    status: "DRAFT",
    authorId: "user-1",
    workspaceId: "ws-1",
    audioFileId: null,
    isSynced: false,
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = createMockPrisma();
    repo = new NoteRepository(mockPrisma as any);
  });

  describe("create", () => {
    it("should create a note with DRAFT status and isSynced false", async () => {
      const prismaResult = {
        ...mockPrismaNote,
        author: { id: "user-1", username: "test" },
      };
      mockPrisma.note.create.mockResolvedValue(prismaResult);

      const result = await repo.create({
        title: "Test Note",
        content: "Some content",
        authorId: "user-1",
        workspaceId: "ws-1",
        status: "DRAFT" as any,
      });

      expect(mockPrisma.note.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: "Test Note",
          content: "Some content",
          status: "DRAFT",
          isSynced: false,
          authorId: "user-1",
          workspaceId: "ws-1",
        }),
        include: { author: true },
      });
      expect(result.id).toBe("note-1");
      expect(result.status).toBe("DRAFT");
    });

    it("should connect audioFileId when provided", async () => {
      const withAudio = {
        ...mockPrismaNote,
        audioFileId: "audio-1",
        author: {},
      };
      mockPrisma.note.create.mockResolvedValue(withAudio);

      await repo.create({
        title: "Voice Note",
        content: "",
        type: "VOICE_TRANSCRIPT" as any,
        authorId: "user-1",
        workspaceId: "ws-1",
        audioFileId: "audio-1",
        status: "DRAFT" as any,
      });

      expect(mockPrisma.note.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          audioFileId: "audio-1",
        }),
        include: { author: true },
      });
    });

    it("should not include audioFileId when not provided", async () => {
      const noAudio = { ...mockPrismaNote, author: {} };
      mockPrisma.note.create.mockResolvedValue(noAudio);

      await repo.create({
        title: "Note",
        content: "text",
        authorId: "user-1",
        workspaceId: "ws-1",
        status: "DRAFT" as any,
      });

      const callArg = mockPrisma.note.create.mock.calls[0][0];
      expect(callArg.data.audioFileId).toBeUndefined();
    });
  });

  describe("findById", () => {
    it("should return mapped note when found", async () => {
      mockPrisma.note.findUnique.mockResolvedValue(mockPrismaNote);

      const result = await repo.findById("note-1");

      expect(mockPrisma.note.findUnique).toHaveBeenCalledWith({
        where: { id: "note-1" },
      });
      expect(result).toEqual(expectedINote);
    });

    it("should return null when not found", async () => {
      mockPrisma.note.findUnique.mockResolvedValue(null);

      const result = await repo.findById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("findByWorkspaceId", () => {
    it("should return notes ordered by updatedAt desc", async () => {
      const notes = [mockPrismaNote, { ...mockPrismaNote, id: "note-2" }];
      mockPrisma.note.findMany.mockResolvedValue(notes);

      const result = await repo.findByWorkspaceId("ws-1");

      expect(mockPrisma.note.findMany).toHaveBeenCalledWith({
        where: { workspaceId: "ws-1" },
        orderBy: { updatedAt: "desc" },
      });
      expect(result).toHaveLength(2);
    });

    it("should return empty array when workspace has no notes", async () => {
      mockPrisma.note.findMany.mockResolvedValue([]);

      const result = await repo.findByWorkspaceId("ws-empty");

      expect(result).toEqual([]);
    });
  });

  describe("findByAuthorId", () => {
    it("should return notes ordered by updatedAt desc", async () => {
      mockPrisma.note.findMany.mockResolvedValue([mockPrismaNote]);

      const result = await repo.findByAuthorId("user-1");

      expect(mockPrisma.note.findMany).toHaveBeenCalledWith({
        where: { authorId: "user-1" },
        orderBy: { updatedAt: "desc" },
      });
      expect(result).toHaveLength(1);
    });

    it("should return empty array when author has no notes", async () => {
      mockPrisma.note.findMany.mockResolvedValue([]);

      const result = await repo.findByAuthorId("none");

      expect(result).toEqual([]);
    });
  });

  describe("update", () => {
    it("should set status to PUBLISHED when content is provided", async () => {
      const updatedNote = {
        ...mockPrismaNote,
        content: "Updated",
        status: "PUBLISHED",
      };
      mockPrisma.note.update.mockResolvedValue(updatedNote);

      const result = await repo.update("note-1", { content: "Updated" });

      expect(mockPrisma.note.update).toHaveBeenCalledWith({
        where: { id: "note-1" },
        data: expect.objectContaining({
          content: "Updated",
          status: "PUBLISHED",
          isSynced: false,
        }),
      });
      expect(result.status).toBe("PUBLISHED");
    });

    it("should set isSynced to false on every update", async () => {
      mockPrisma.note.update.mockResolvedValue({
        ...mockPrismaNote,
        title: "New",
      });

      await repo.update("note-1", { title: "New" });

      expect(mockPrisma.note.update).toHaveBeenCalledWith({
        where: { id: "note-1" },
        data: expect.objectContaining({
          isSynced: false,
        }),
      });
    });

    it("should preserve existing status when content is not provided", async () => {
      mockPrisma.note.update.mockResolvedValue({
        ...mockPrismaNote,
        title: "Title Only",
      });

      await repo.update("note-1", { title: "Title Only" });

      const callArg = mockPrisma.note.update.mock.calls[0][0];
      // When content is not in data or is empty, status uses data.status (undefined)
      expect(callArg.data.title).toBe("Title Only");
    });
  });

  describe("delete", () => {
    it("should delete noteChunkEmbeddings then note in a transaction", async () => {
      const mockTx = {
        noteChunkEmbedding: {
          deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
        note: { delete: jest.fn().mockResolvedValue(mockPrismaNote) },
      };
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockTx));

      await repo.delete("note-1");

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockTx.noteChunkEmbedding.deleteMany).toHaveBeenCalledWith({
        where: { noteId: "note-1" },
      });
      expect(mockTx.note.delete).toHaveBeenCalledWith({
        where: { id: "note-1" },
      });
    });

    it("should retry on P2034 error and succeed on second attempt", async () => {
      const p2034Error = Object.assign(new Error("Write conflict"), {
        code: "P2034",
      });
      const mockTx = {
        noteChunkEmbedding: {
          deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
        note: { delete: jest.fn().mockResolvedValue(mockPrismaNote) },
      };

      let callCount = 0;
      mockPrisma.$transaction.mockImplementation(async (fn: any) => {
        callCount++;
        if (callCount === 1) throw p2034Error;
        return fn(mockTx);
      });

      await repo.delete("note-1");

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2);
    }, 10000);

    it("should throw non-P2034 errors immediately", async () => {
      const genericError = new Error("Something went wrong");
      mockPrisma.$transaction.mockRejectedValue(genericError);

      await expect(repo.delete("note-1")).rejects.toThrow(
        "Something went wrong",
      );
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe("exists", () => {
    it("should return true when note exists", async () => {
      mockPrisma.note.count.mockResolvedValue(1);

      const result = await repo.exists("note-1");

      expect(mockPrisma.note.count).toHaveBeenCalledWith({
        where: { id: "note-1" },
      });
      expect(result).toBe(true);
    });

    it("should return false when note does not exist", async () => {
      mockPrisma.note.count.mockResolvedValue(0);

      const result = await repo.exists("non-existent");

      expect(result).toBe(false);
    });
  });

  describe("count", () => {
    it("should count all notes when no filters", async () => {
      mockPrisma.note.count.mockResolvedValue(5);

      const result = await repo.count();

      expect(mockPrisma.note.count).toHaveBeenCalledWith({ where: {} });
      expect(result).toBe(5);
    });

    it("should count with workspaceId filter", async () => {
      mockPrisma.note.count.mockResolvedValue(3);

      const result = await repo.count({ workspaceId: "ws-1" });

      expect(mockPrisma.note.count).toHaveBeenCalledWith({
        where: { workspaceId: "ws-1" },
      });
      expect(result).toBe(3);
    });

    it("should count with multiple filters", async () => {
      mockPrisma.note.count.mockResolvedValue(1);

      const result = await repo.count({
        workspaceId: "ws-1",
        authorId: "user-1",
        type: "MANUAL" as any,
      });

      expect(mockPrisma.note.count).toHaveBeenCalledWith({
        where: { workspaceId: "ws-1", authorId: "user-1", type: "MANUAL" },
      });
      expect(result).toBe(1);
    });
  });

  describe("findAll", () => {
    it("should return all notes without filters", async () => {
      mockPrisma.note.findMany.mockResolvedValue([mockPrismaNote]);

      const result = await repo.findAll();

      expect(mockPrisma.note.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { updatedAt: "desc" },
      });
      expect(result).toHaveLength(1);
    });

    it("should filter by searchQuery with OR on title/content", async () => {
      mockPrisma.note.findMany.mockResolvedValue([mockPrismaNote]);

      await repo.findAll({ searchQuery: "test" });

      expect(mockPrisma.note.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: "test", mode: "insensitive" } },
            { content: { contains: "test", mode: "insensitive" } },
          ],
        },
        orderBy: { updatedAt: "desc" },
      });
    });

    it("should combine multiple filters including searchQuery", async () => {
      mockPrisma.note.findMany.mockResolvedValue([]);

      await repo.findAll({
        workspaceId: "ws-1",
        authorId: "user-1",
        searchQuery: "hello",
      });

      expect(mockPrisma.note.findMany).toHaveBeenCalledWith({
        where: {
          workspaceId: "ws-1",
          authorId: "user-1",
          OR: [
            { title: { contains: "hello", mode: "insensitive" } },
            { content: { contains: "hello", mode: "insensitive" } },
          ],
        },
        orderBy: { updatedAt: "desc" },
      });
    });
  });

  describe("findPaged", () => {
    it("should return paged results with skip and take", async () => {
      const pagedResult = [
        { id: "note-1", title: "Note", updatedAt: now, type: "MANUAL" },
      ];
      mockPrisma.note.findMany.mockResolvedValue(pagedResult);

      const result = await repo.findPaged(
        { workspaceId: "ws-1" },
        { skip: 0, limit: 10 },
      );

      expect(mockPrisma.note.findMany).toHaveBeenCalledWith({
        where: { workspaceId: "ws-1" },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        skip: 0,
        take: 10,
        select: { id: true, title: true, updatedAt: true, type: true },
      });
      expect(result).toEqual(pagedResult);
    });

    it("should apply optional filters in paged query", async () => {
      mockPrisma.note.findMany.mockResolvedValue([]);

      await repo.findPaged(
        {
          workspaceId: "ws-1",
          authorId: "user-1",
          type: "MANUAL" as any,
          searchQuery: "key",
        },
        { skip: 5, limit: 20 },
      );

      expect(mockPrisma.note.findMany).toHaveBeenCalledWith({
        where: {
          workspaceId: "ws-1",
          authorId: "user-1",
          type: "MANUAL",
          title: { contains: "key", mode: "insensitive" },
        },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        skip: 5,
        take: 20,
        select: { id: true, title: true, updatedAt: true, type: true },
      });
    });
  });
});
