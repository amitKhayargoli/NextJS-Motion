import { NoteService } from "src/services/note.service";
import { NoteResponseDTO } from "src/dtos/note.dto";

jest.mock("src/services/embedding.service", () => ({
  EmbeddingService: jest.fn().mockImplementation(() => ({
    embedNoteChunks: jest.fn().mockResolvedValue(undefined),
    debounceEmbedNoteChunks: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock("src/dtos/validators/note.validator", () => ({
  NoteValidator: {
    validateCreateNote: jest
      .fn()
      .mockReturnValue({ isValid: true, errors: [] }),
    validateUpdateNote: jest
      .fn()
      .mockReturnValue({ isValid: true, errors: [] }),
  },
}));

jest.mock("src/utils/summarizer.client", () => ({
  summarizeText: jest.fn().mockResolvedValue("A summary"),
}));

jest.mock("src/utils/htmlToText", () => ({
  htmlToText: jest.fn().mockReturnValue("plain text"),
}));

import { NoteValidator } from "src/dtos/validators/note.validator";
import { summarizeText } from "src/utils/summarizer.client";
import { htmlToText } from "src/utils/htmlToText";

describe("NoteService", () => {
  let noteService: NoteService;
  let mockNoteRepository: {
    create: jest.Mock;
    findById: jest.Mock;
    findByIdWithRole: jest.Mock;
    findAll: jest.Mock;
    findByWorkspaceId: jest.Mock;
    findByAuthorId: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    exists: jest.Mock;
    findPaged: jest.Mock;
    count: jest.Mock;
  };
  let mockPrisma: any;

  const mockNote = {
    id: "note-1",
    title: "Test Note",
    content: "<p>Hello world</p>",
    summary: null,
    type: "MANUAL",
    status: "DRAFT",
    authorId: "user-1",
    workspaceId: "ws-1",
    audioFileId: null,
    isSynced: false,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockNoteRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdWithRole: jest.fn(),
      findAll: jest.fn(),
      findByWorkspaceId: jest.fn(),
      findByAuthorId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      findPaged: jest.fn(),
      count: jest.fn(),
    };

    mockPrisma = {};

    noteService = new NoteService(mockNoteRepository as any, mockPrisma);
  });

  describe("createNote", () => {
    it("should create a note and return NoteResponseDTO", async () => {
      mockNoteRepository.create.mockResolvedValue(mockNote);

      const dto = {
        title: "Test Note",
        content: "<p>Hello world</p>",
        type: "MANUAL",
        status: "DRAFT",
        authorId: "user-1",
        workspaceId: "ws-1",
      };

      const result = await noteService.createNote(dto as any);

      expect(NoteValidator.validateCreateNote).toHaveBeenCalledWith(dto);
      expect(mockNoteRepository.create).toHaveBeenCalledWith({
        title: dto.title,
        content: dto.content,
        type: dto.type,
        status: dto.status,
        authorId: dto.authorId,
        workspaceId: dto.workspaceId,
        audioFileId: undefined,
      });
      expect(result).toBeInstanceOf(NoteResponseDTO);
      expect(result.id).toBe("note-1");
    });

    it("should throw if validation fails", async () => {
      (NoteValidator.validateCreateNote as jest.Mock).mockReturnValueOnce({
        isValid: false,
        errors: ["title is required"],
      });

      const dto = {
        title: "",
        content: "",
        status: "DRAFT",
        authorId: "user-1",
        workspaceId: "ws-1",
      };

      await expect(noteService.createNote(dto as any)).rejects.toThrow(
        "Validation failed: title is required",
      );
      expect(mockNoteRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("updateNote", () => {
    it("should update a note and return NoteResponseDTO", async () => {
      const updatedNote = {
        ...mockNote,
        title: "Updated Title",
        content: "<p>Updated</p>",
      };
      mockNoteRepository.exists.mockResolvedValue(true);
      mockNoteRepository.update.mockResolvedValue(updatedNote);

      const dto = {
        noteId: "note-1",
        title: "Updated Title",
        content: "<p>Updated</p>",
      };

      const result = await noteService.updateNote(dto as any);

      expect(NoteValidator.validateUpdateNote).toHaveBeenCalledWith(dto);
      expect(mockNoteRepository.exists).toHaveBeenCalledWith("note-1");
      expect(mockNoteRepository.update).toHaveBeenCalledWith("note-1", {
        title: "Updated Title",
        content: "<p>Updated</p>",
        summary: undefined,
      });
      expect(result).toBeInstanceOf(NoteResponseDTO);
      expect(result.title).toBe("Updated Title");
    });

    it("should throw 'Note not found' if note does not exist", async () => {
      mockNoteRepository.exists.mockResolvedValue(false);

      const dto = { noteId: "nonexistent", title: "X" };

      await expect(noteService.updateNote(dto as any)).rejects.toThrow(
        "Note not found",
      );
      expect(mockNoteRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("getNoteById", () => {
    it("should return note with canEdit true for EDITOR", async () => {
      mockNoteRepository.findByIdWithRole.mockResolvedValue({
        note: mockNote,
        userRole: "EDITOR",
      });

      const result = await noteService.getNoteById("note-1", "user-1");

      expect(mockNoteRepository.findByIdWithRole).toHaveBeenCalledWith(
        "note-1",
        "user-1",
      );
      expect(result.note).toBeInstanceOf(NoteResponseDTO);
      expect(result.userRole).toBe("EDITOR");
      expect(result.canEdit).toBe(true);
    });

    it("should return note with canEdit true for OWNER", async () => {
      mockNoteRepository.findByIdWithRole.mockResolvedValue({
        note: mockNote,
        userRole: "OWNER",
      });

      const result = await noteService.getNoteById("note-1", "owner-1");

      expect(result.canEdit).toBe(true);
      expect(result.userRole).toBe("OWNER");
    });

    it("should return note with canEdit false for VIEWER", async () => {
      mockNoteRepository.findByIdWithRole.mockResolvedValue({
        note: mockNote,
        userRole: "VIEWER",
      });

      const result = await noteService.getNoteById("note-1", "viewer-1");

      expect(result.canEdit).toBe(false);
      expect(result.userRole).toBe("VIEWER");
    });

    it("should throw 'Note not found' when note does not exist", async () => {
      mockNoteRepository.findByIdWithRole.mockResolvedValue(null);

      await expect(
        noteService.getNoteById("nonexistent", "user-1"),
      ).rejects.toThrow("Note not found");
    });
  });

  describe("getWorkspaceNotes", () => {
    it("should return an array of NoteResponseDTOs", async () => {
      const notes = [
        mockNote,
        { ...mockNote, id: "note-2", title: "Second Note" },
      ];
      mockNoteRepository.findByWorkspaceId.mockResolvedValue(notes);

      const result = await noteService.getWorkspaceNotes("ws-1");

      expect(mockNoteRepository.findByWorkspaceId).toHaveBeenCalledWith("ws-1");
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(NoteResponseDTO);
    });
  });

  describe("getAuthorNotes", () => {
    it("should return an array of NoteResponseDTOs", async () => {
      mockNoteRepository.findByAuthorId.mockResolvedValue([mockNote]);

      const result = await noteService.getAuthorNotes("user-1");

      expect(mockNoteRepository.findByAuthorId).toHaveBeenCalledWith("user-1");
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(NoteResponseDTO);
    });
  });

  describe("deleteNote", () => {
    it("should delete a note successfully", async () => {
      mockNoteRepository.exists.mockResolvedValue(true);
      mockNoteRepository.delete.mockResolvedValue(undefined);

      await noteService.deleteNote("note-1");

      expect(mockNoteRepository.exists).toHaveBeenCalledWith("note-1");
      expect(mockNoteRepository.delete).toHaveBeenCalledWith("note-1");
    });

    it("should throw 'Note not found' if note does not exist", async () => {
      mockNoteRepository.exists.mockResolvedValue(false);

      await expect(noteService.deleteNote("nonexistent")).rejects.toThrow(
        "Note not found",
      );
      expect(mockNoteRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe("addSummaryToNote", () => {
    it("should add a summary to a note", async () => {
      const noteWithSummary = { ...mockNote, summary: "A short summary" };
      mockNoteRepository.exists.mockResolvedValue(true);
      mockNoteRepository.update.mockResolvedValue(noteWithSummary);

      const result = await noteService.addSummaryToNote(
        "note-1",
        "A short summary",
      );

      expect(mockNoteRepository.exists).toHaveBeenCalledWith("note-1");
      expect(mockNoteRepository.update).toHaveBeenCalledWith("note-1", {
        summary: "A short summary",
      });
      expect(result).toBeInstanceOf(NoteResponseDTO);
      expect(result.summary).toBe("A short summary");
    });

    it("should throw 'Note not found' if note does not exist", async () => {
      mockNoteRepository.exists.mockResolvedValue(false);

      await expect(
        noteService.addSummaryToNote("nonexistent", "summary"),
      ).rejects.toThrow("Note not found");
    });

    it("should throw error if summary exceeds 5000 characters", async () => {
      mockNoteRepository.exists.mockResolvedValue(true);

      const longSummary = "a".repeat(5001);

      await expect(
        noteService.addSummaryToNote("note-1", longSummary),
      ).rejects.toThrow("Summary cannot exceed 5,000 characters");
      expect(mockNoteRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("generateSummaryForNote", () => {
    it("should generate and save a summary", async () => {
      const noteWithSummary = { ...mockNote, summary: "A summary" };
      mockNoteRepository.findById.mockResolvedValue(mockNote);
      mockNoteRepository.exists.mockResolvedValue(true);
      mockNoteRepository.update.mockResolvedValue(noteWithSummary);

      const result = await noteService.generateSummaryForNote("note-1");

      expect(mockNoteRepository.findById).toHaveBeenCalledWith("note-1");
      expect(htmlToText).toHaveBeenCalledWith("<p>Hello world</p>");
      expect(summarizeText).toHaveBeenCalledWith("plain text");
      expect(result).toBeInstanceOf(NoteResponseDTO);
    });

    it("should throw 'Note not found' if note does not exist", async () => {
      mockNoteRepository.findById.mockResolvedValue(null);

      await expect(
        noteService.generateSummaryForNote("nonexistent"),
      ).rejects.toThrow("Note not found");
    });

    it("should throw 'Nothing to summarize' if content is empty", async () => {
      const emptyNote = { ...mockNote, content: "" };
      mockNoteRepository.findById.mockResolvedValue(emptyNote);
      (htmlToText as jest.Mock).mockReturnValueOnce("");

      await expect(
        noteService.generateSummaryForNote("note-1"),
      ).rejects.toThrow("Nothing to summarize");
    });
  });
});
