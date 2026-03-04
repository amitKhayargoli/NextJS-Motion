export interface IAudioFile {
  id: string;
  title?: string;
  fileName: string;
  cloudUrl: string;
  durationSeconds: number;
  mimeType: string;
  uploadedAt: Date;
  uploaderId: string;
}

export interface ICreateAudioFileData {
  title?: string;
  fileName: string;
  cloudUrl: string;
  durationSeconds: number;
  mimeType: string;
  uploaderId: string;
}

export interface IUpdateAudioFileData {
  title?: string;
  fileName?: string;
  durationSeconds?: number;
}
