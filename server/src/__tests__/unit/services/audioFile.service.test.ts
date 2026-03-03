import { AudioFileService } from "src/services/audioFile.service";
import {
  UpdateAudioFileTitleDTO,
  AudioFileResponseDTO,
} from "src/dtos/audioFile.dto";

jest.mock("src/utils/storage.service", () => ({
  StorageService: jest.fn().mockImplementation(() => ({
    uploadFile: jest
      .fn()
      .mockResolvedValue({ url: "https://cdn.example.com/audio.mp3" }),
    deleteFile: jest.fn().mockResolvedValue(undefined),
    extractKeyFromUrl: jest.fn().mockReturnValue("audio-key"),
  })),
}));

jest.mock("src/dtos/validators/audioFile.validator", () => ({
  AudioFileValidator: {
    validateCreateAudioFile: jest
      .fn()
      .mockReturnValue({ isValid: true, errors: [] }),
  },
}));

describe("AudioFileService", () => {
  let audioFileService: AudioFileService;
  let mockAudioFileRepository: {
    create: jest.Mock;
    findById: jest.Mock;
    findByUploaderId: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    exists: jest.Mock;
  };

  const mockAudioFile = {
    id: "af-1",
    title: "My Recording",
    fileName: "recording.mp3",
    cloudUrl: "https://cdn.example.com/recording.mp3",
    durationSeconds: 120,
    mimeType: "audio/mpeg",
    uploadedAt: new Date("2025-01-01"),
    uploaderId: "user-1",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockAudioFileRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUploaderId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    audioFileService = new AudioFileService(mockAudioFileRepository as any);
  });

  describe("getAudioFileById", () => {
    it("should return an AudioFileResponseDTO for an existing file", async () => {
      mockAudioFileRepository.findById.mockResolvedValue(mockAudioFile);

      const result = await audioFileService.getAudioFileById("af-1");

      expect(mockAudioFileRepository.findById).toHaveBeenCalledWith("af-1");
      expect(result).toBeInstanceOf(AudioFileResponseDTO);
      expect(result.id).toBe("af-1");
      expect(result.title).toBe("My Recording");
    });

    it("should throw 'Audio file not found' when file does not exist", async () => {
      mockAudioFileRepository.findById.mockResolvedValue(null);

      await expect(
        audioFileService.getAudioFileById("nonexistent"),
      ).rejects.toThrow("Audio file not found");
    });
  });

  describe("getUserAudioFiles", () => {
    it("should return an array of AudioFileResponseDTOs", async () => {
      const files = [
        mockAudioFile,
        { ...mockAudioFile, id: "af-2", title: "Second Recording" },
      ];
      mockAudioFileRepository.findByUploaderId.mockResolvedValue(files);

      const result = await audioFileService.getUserAudioFiles("user-1");

      expect(mockAudioFileRepository.findByUploaderId).toHaveBeenCalledWith(
        "user-1",
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(AudioFileResponseDTO);
      expect(result[1].id).toBe("af-2");
    });

    it("should return an empty array when user has no files", async () => {
      mockAudioFileRepository.findByUploaderId.mockResolvedValue([]);

      const result = await audioFileService.getUserAudioFiles("user-1");

      expect(result).toEqual([]);
    });
  });

  describe("updateAudioFileTitle", () => {
    it("should update the title successfully", async () => {
      const updatedFile = { ...mockAudioFile, title: "New Title" };
      mockAudioFileRepository.findById.mockResolvedValue(mockAudioFile);
      mockAudioFileRepository.update.mockResolvedValue(updatedFile);

      const dto = new UpdateAudioFileTitleDTO({ title: "New Title" });
      const result = await audioFileService.updateAudioFileTitle(
        "af-1",
        "user-1",
        dto,
      );

      expect(mockAudioFileRepository.findById).toHaveBeenCalledWith("af-1");
      expect(mockAudioFileRepository.update).toHaveBeenCalledWith("af-1", {
        title: "New Title",
      });
      expect(result).toBeInstanceOf(AudioFileResponseDTO);
      expect(result.title).toBe("New Title");
    });

    it("should throw 'Audio file not found' when file does not exist", async () => {
      mockAudioFileRepository.findById.mockResolvedValue(null);

      const dto = new UpdateAudioFileTitleDTO({ title: "New Title" });

      await expect(
        audioFileService.updateAudioFileTitle("nonexistent", "user-1", dto),
      ).rejects.toThrow("Audio file not found");
    });

    it("should throw error when user is not the owner", async () => {
      mockAudioFileRepository.findById.mockResolvedValue(mockAudioFile);

      const dto = new UpdateAudioFileTitleDTO({ title: "New Title" });

      await expect(
        audioFileService.updateAudioFileTitle("af-1", "other-user", dto),
      ).rejects.toThrow("You can only update your own audio files");
    });

    it("should throw error when title is empty", async () => {
      mockAudioFileRepository.findById.mockResolvedValue(mockAudioFile);

      const dto = new UpdateAudioFileTitleDTO({ title: "" });

      await expect(
        audioFileService.updateAudioFileTitle("af-1", "user-1", dto),
      ).rejects.toThrow("Validation failed: title is required");
    });

    it("should throw error when title is only whitespace", async () => {
      mockAudioFileRepository.findById.mockResolvedValue(mockAudioFile);

      const dto = new UpdateAudioFileTitleDTO({ title: "   " });

      await expect(
        audioFileService.updateAudioFileTitle("af-1", "user-1", dto),
      ).rejects.toThrow("Validation failed: title is required");
    });
  });

  describe("deleteAudioFile", () => {
    it("should delete the audio file successfully", async () => {
      mockAudioFileRepository.findById.mockResolvedValue(mockAudioFile);
      mockAudioFileRepository.delete.mockResolvedValue(undefined);

      await audioFileService.deleteAudioFile("af-1", "user-1");

      expect(mockAudioFileRepository.findById).toHaveBeenCalledWith("af-1");
      expect(mockAudioFileRepository.delete).toHaveBeenCalledWith("af-1");
    });

    it("should throw 'Audio file not found' when file does not exist", async () => {
      mockAudioFileRepository.findById.mockResolvedValue(null);

      await expect(
        audioFileService.deleteAudioFile("nonexistent", "user-1"),
      ).rejects.toThrow("Audio file not found");
      expect(mockAudioFileRepository.delete).not.toHaveBeenCalled();
    });

    it("should throw error when user is not the owner", async () => {
      mockAudioFileRepository.findById.mockResolvedValue(mockAudioFile);

      await expect(
        audioFileService.deleteAudioFile("af-1", "other-user"),
      ).rejects.toThrow("You can only delete your own audio files");
      expect(mockAudioFileRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe("uploadAudioFile", () => {
    it("should upload, validate, and save an audio file", async () => {
      mockAudioFileRepository.create.mockResolvedValue(mockAudioFile);

      const mockFile = {
        originalname: "recording.mp3",
        mimetype: "audio/mpeg",
        buffer: Buffer.from("fake-audio"),
        size: 1024,
      } as Express.Multer.File;

      const result = await audioFileService.uploadAudioFile(
        mockFile,
        "user-1",
        120,
        "My Recording",
      );

      expect(mockAudioFileRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: "recording.mp3",
          cloudUrl: "https://cdn.example.com/audio.mp3",
          durationSeconds: 120,
          mimeType: "audio/mpeg",
          uploaderId: "user-1",
        }),
      );
      expect(result).toBeInstanceOf(AudioFileResponseDTO);
      expect(result.id).toBe("af-1");
    });
  });
});
