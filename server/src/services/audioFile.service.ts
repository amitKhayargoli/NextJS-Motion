import { IAudioFileRepository } from "../repositories/audioFile.repository";
import {
  CreateAudioFileDTO,
  UpdateAudioFileTitleDTO,
  AudioFileResponseDTO,
} from "../dtos/audioFile.dto";
import { AudioFileValidator } from "../dtos/validators/audioFile.validator";
import { StorageService } from "../utils/storage.service";

export class AudioFileService {
  private storageService: StorageService;

  constructor(private audioFileRepository: IAudioFileRepository) {
    this.storageService = new StorageService();
  }

  async uploadAudioFile(
    file: Express.Multer.File,
    userId: string,
    durationSeconds: number,
    title?: string,
  ): Promise<AudioFileResponseDTO> {
    const duration = parseInt(String(durationSeconds), 10);

    // Upload to S3/R2
    const { url } = await this.storageService.uploadFile(file, userId);

    // Create DTO
    const dto = new CreateAudioFileDTO({
      title,
      fileName: file.originalname,
      cloudUrl: url,
      durationSeconds: duration,
      mimeType: file.mimetype,
      uploaderId: userId,
    });

    // Validate
    const validation = AudioFileValidator.validateCreateAudioFile(dto);
    if (!validation.isValid) {
      // Delete uploaded file if validation fails
      await this.storageService.deleteFile(
        this.storageService.extractKeyFromUrl(url),
      );
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    // Save to database
    const audioFile = await this.audioFileRepository.create({
      title: dto.title,
      fileName: dto.fileName,
      cloudUrl: dto.cloudUrl,
      durationSeconds: dto.durationSeconds,
      mimeType: dto.mimeType,
      uploaderId: dto.uploaderId,
    });

    return new AudioFileResponseDTO(audioFile);
  }

  async getAudioFileById(id: string): Promise<AudioFileResponseDTO> {
    const audioFile = await this.audioFileRepository.findById(id);

    if (!audioFile) {
      throw new Error("Audio file not found");
    }

    return new AudioFileResponseDTO(audioFile);
  }

  async getUserAudioFiles(userId: string): Promise<AudioFileResponseDTO[]> {
    const audioFiles = await this.audioFileRepository.findByUploaderId(userId);
    return AudioFileResponseDTO.fromArray(audioFiles);
  }

  async updateAudioFileTitle(
    id: string,
    userId: string,
    dto: UpdateAudioFileTitleDTO,
  ): Promise<AudioFileResponseDTO> {
    const audioFile = await this.audioFileRepository.findById(id);

    if (!audioFile) {
      throw new Error("Audio file not found");
    }

    if (audioFile.uploaderId !== userId) {
      throw new Error("You can only update your own audio files");
    }

    if (!dto.title || dto.title.trim().length === 0) {
      throw new Error("Validation failed: title is required");
    }

    const updated = await this.audioFileRepository.update(id, {
      title: dto.title.trim(),
    });

    return new AudioFileResponseDTO(updated);
  }

  async deleteAudioFile(id: string, userId: string): Promise<void> {
    const audioFile = await this.audioFileRepository.findById(id);

    if (!audioFile) {
      throw new Error("Audio file not found");
    }

    // Check ownership
    if (audioFile.uploaderId !== userId) {
      throw new Error("You can only delete your own audio files");
    }

    // Delete from S3/R2
    const key = this.storageService.extractKeyFromUrl(audioFile.cloudUrl);
    await this.storageService.deleteFile(key);

    // Delete from database
    await this.audioFileRepository.delete(id);
  }
}
