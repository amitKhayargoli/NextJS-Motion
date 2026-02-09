export interface IAudioFile {
  id: string;
  fileName: string;
  cloudUrl: string;
  durationSeconds: number;
  mimeType: string;
  uploadedAt: Date;
  uploaderId: string;
}

export interface ICreateAudioFileData {
  fileName: string;
  cloudUrl: string;
  durationSeconds: number;
  mimeType: string;
  uploaderId: string;
}

export interface IUpdateAudioFileData {
  fileName?: string;
  durationSeconds?: number;
}
