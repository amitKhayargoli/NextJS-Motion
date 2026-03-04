export class CreateAudioFileDTO {
  title?: string;
  fileName: string;
  cloudUrl: string;
  durationSeconds: number;
  mimeType: string;
  uploaderId: string;

  constructor(data: any) {
    this.fileName = data.fileName;
    this.cloudUrl = data.cloudUrl;
    this.durationSeconds = data.durationSeconds;
    this.mimeType = data.mimeType;
    this.uploaderId = data.uploaderId;
  }
}

export class UpdateAudioFileTitleDTO {
  title: string;

  constructor(data: any) {
    this.title = data.title;
  }
}

export class AudioFileResponseDTO {
  id: string;
  title?: string;
  fileName: string;
  cloudUrl: string;
  durationSeconds: number;
  mimeType: string;
  uploadedAt: string;
  uploaderId: string;

  constructor(audioFile: any) {
    this.id = audioFile.id;
    this.title = audioFile.title;
    this.fileName = audioFile.fileName;
    this.cloudUrl = audioFile.cloudUrl;
    this.durationSeconds = audioFile.durationSeconds;
    this.mimeType = audioFile.mimeType;
    this.uploadedAt =
      audioFile.uploadedAt instanceof Date
        ? audioFile.uploadedAt.toISOString()
        : audioFile.uploadedAt;
    this.uploaderId = audioFile.uploaderId;
  }

  static fromArray(audioFiles: any[]): AudioFileResponseDTO[] {
    return audioFiles.map((file) => new AudioFileResponseDTO(file));
  }
}
