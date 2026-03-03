import { createMockPrisma, MockPrismaClient } from "../mockPrisma";
import { AudioFileRepository } from "src/repositories/audioFile.repository";

describe("AudioFileRepository", () => {
  let mockPrisma: MockPrismaClient;
  let repo: AudioFileRepository;

  const now = new Date("2025-01-10");

  const mockPrismaAudioFile = {
    id: "audio-1",
    title: "Recording 1",
    fileName: "recording.mp3",
    cloudUrl: "https://cdn.example.com/recording.mp3",
    durationSeconds: 120,
    mimeType: "audio/mpeg",
    uploadedAt: now,
    uploaderId: "user-1",
  };

  const expectedIAudioFile = {
    id: "audio-1",
    title: "Recording 1",
    fileName: "recording.mp3",
    cloudUrl: "https://cdn.example.com/recording.mp3",
    durationSeconds: 120,
    mimeType: "audio/mpeg",
    uploadedAt: now,
    uploaderId: "user-1",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = createMockPrisma();
    repo = new AudioFileRepository(mockPrisma as any);
  });

  describe("create", () => {
    it("should create an audio file and return mapped result", async () => {
      mockPrisma.audioFile.create.mockResolvedValue(mockPrismaAudioFile);

      const result = await repo.create({
        title: "Recording 1",
        fileName: "recording.mp3",
        cloudUrl: "https://cdn.example.com/recording.mp3",
        durationSeconds: 120,
        mimeType: "audio/mpeg",
        uploaderId: "user-1",
      });

      expect(mockPrisma.audioFile.create).toHaveBeenCalledWith({
        data: {
          title: "Recording 1",
          fileName: "recording.mp3",
          cloudUrl: "https://cdn.example.com/recording.mp3",
          durationSeconds: 120,
          mimeType: "audio/mpeg",
          uploaderId: "user-1",
        },
      });
      expect(result).toEqual(expectedIAudioFile);
    });

    it("should create an audio file without optional title", async () => {
      const noTitleFile = { ...mockPrismaAudioFile, title: undefined };
      mockPrisma.audioFile.create.mockResolvedValue(noTitleFile);

      const result = await repo.create({
        fileName: "recording.mp3",
        cloudUrl: "https://cdn.example.com/recording.mp3",
        durationSeconds: 120,
        mimeType: "audio/mpeg",
        uploaderId: "user-1",
      });

      expect(result.title).toBeUndefined();
    });
  });

  describe("findById", () => {
    it("should return audio file when found", async () => {
      mockPrisma.audioFile.findUnique.mockResolvedValue(mockPrismaAudioFile);

      const result = await repo.findById("audio-1");

      expect(mockPrisma.audioFile.findUnique).toHaveBeenCalledWith({
        where: { id: "audio-1" },
      });
      expect(result).toEqual(expectedIAudioFile);
    });

    it("should return null when not found", async () => {
      mockPrisma.audioFile.findUnique.mockResolvedValue(null);

      const result = await repo.findById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("findByUploaderId", () => {
    it("should return audio files ordered by uploadedAt desc", async () => {
      const files = [
        mockPrismaAudioFile,
        { ...mockPrismaAudioFile, id: "audio-2", title: "Second" },
      ];
      mockPrisma.audioFile.findMany.mockResolvedValue(files);

      const result = await repo.findByUploaderId("user-1");

      expect(mockPrisma.audioFile.findMany).toHaveBeenCalledWith({
        where: { uploaderId: "user-1" },
        orderBy: { uploadedAt: "desc" },
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("audio-1");
    });

    it("should return empty array when uploader has no files", async () => {
      mockPrisma.audioFile.findMany.mockResolvedValue([]);

      const result = await repo.findByUploaderId("user-no-files");

      expect(result).toEqual([]);
    });
  });

  describe("update", () => {
    it("should update only title when only title is defined", async () => {
      const updated = { ...mockPrismaAudioFile, title: "New Title" };
      mockPrisma.audioFile.update.mockResolvedValue(updated);

      const result = await repo.update("audio-1", { title: "New Title" });

      expect(mockPrisma.audioFile.update).toHaveBeenCalledWith({
        where: { id: "audio-1" },
        data: { title: "New Title" },
      });
      expect(result.title).toBe("New Title");
    });

    it("should update fileName and durationSeconds when defined", async () => {
      const updated = {
        ...mockPrismaAudioFile,
        fileName: "new.mp3",
        durationSeconds: 240,
      };
      mockPrisma.audioFile.update.mockResolvedValue(updated);

      await repo.update("audio-1", {
        fileName: "new.mp3",
        durationSeconds: 240,
      });

      expect(mockPrisma.audioFile.update).toHaveBeenCalledWith({
        where: { id: "audio-1" },
        data: { fileName: "new.mp3", durationSeconds: 240 },
      });
    });

    it("should not include undefined fields in update data", async () => {
      mockPrisma.audioFile.update.mockResolvedValue(mockPrismaAudioFile);

      await repo.update("audio-1", {});

      expect(mockPrisma.audioFile.update).toHaveBeenCalledWith({
        where: { id: "audio-1" },
        data: {},
      });
    });

    it("should include title when explicitly set to empty string (undefined check)", async () => {
      const updated = { ...mockPrismaAudioFile, title: "" };
      mockPrisma.audioFile.update.mockResolvedValue(updated);

      await repo.update("audio-1", { title: "" });

      // title !== undefined is true for empty string, so it should be included
      expect(mockPrisma.audioFile.update).toHaveBeenCalledWith({
        where: { id: "audio-1" },
        data: { title: "" },
      });
    });
  });

  describe("delete", () => {
    it("should delete an audio file by id", async () => {
      mockPrisma.audioFile.delete.mockResolvedValue(mockPrismaAudioFile);

      await repo.delete("audio-1");

      expect(mockPrisma.audioFile.delete).toHaveBeenCalledWith({
        where: { id: "audio-1" },
      });
    });

    it("should propagate errors from prisma", async () => {
      mockPrisma.audioFile.delete.mockRejectedValue(
        new Error("Record not found"),
      );

      await expect(repo.delete("non-existent")).rejects.toThrow(
        "Record not found",
      );
    });
  });

  describe("exists", () => {
    it("should return true when audio file exists", async () => {
      mockPrisma.audioFile.count.mockResolvedValue(1);

      const result = await repo.exists("audio-1");

      expect(mockPrisma.audioFile.count).toHaveBeenCalledWith({
        where: { id: "audio-1" },
      });
      expect(result).toBe(true);
    });

    it("should return false when audio file does not exist", async () => {
      mockPrisma.audioFile.count.mockResolvedValue(0);

      const result = await repo.exists("non-existent");

      expect(result).toBe(false);
    });
  });
});
