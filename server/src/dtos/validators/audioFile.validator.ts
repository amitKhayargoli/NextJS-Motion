import { CreateAudioFileDTO } from "../audioFile.dto";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class AudioFileValidator {
  static validateCreateAudioFile(dto: CreateAudioFileDTO): ValidationResult {
    const errors: string[] = [];

    if (!dto.fileName || dto.fileName.trim().length === 0) {
      errors.push("File name is required");
    }

    if (!dto.cloudUrl || dto.cloudUrl.trim().length === 0) {
      errors.push("Cloud URL is required");
    }

    // if (dto.durationSeconds <= 0) {
    //   errors.push("Duration must be greater than 0");
    // }

    if (!dto.mimeType || dto.mimeType.trim().length === 0) {
      errors.push("MIME type is required");
    }

    // Validate audio MIME types
    const validMimeTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/mp4",
      "audio/wav",
      "audio/webm",
      "audio/ogg",
      "audio/m4a",
      "audio/aac",
    ];

    if (!validMimeTypes.includes(dto.mimeType)) {
      errors.push("Invalid audio file type");
    }

    if (!dto.uploaderId || dto.uploaderId.trim().length === 0) {
      errors.push("Uploader ID is required");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
