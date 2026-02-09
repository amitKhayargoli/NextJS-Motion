import {
  IAudioFile,
  ICreateAudioFileData,
  IUpdateAudioFileData,
} from "../types/audioFile.type";

import { PrismaClient } from "@prisma/client";

export interface IAudioFileRepository {
  create(data: ICreateAudioFileData): Promise<IAudioFile>;
  findById(id: string): Promise<IAudioFile | null>;
  findByUploaderId(uploaderId: string): Promise<IAudioFile[]>;
  update(id: string, data: IUpdateAudioFileData): Promise<IAudioFile>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}

export class AudioFileRepository implements IAudioFileRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: ICreateAudioFileData): Promise<IAudioFile> {
    const audioFile = await this.prisma.audioFile.create({
      data: {
        fileName: data.fileName,
        cloudUrl: data.cloudUrl,
        durationSeconds: data.durationSeconds,
        mimeType: data.mimeType,
        uploaderId: data.uploaderId,
      },
    });

    return this.mapToIAudioFile(audioFile);
  }

  async findById(id: string): Promise<IAudioFile | null> {
    const audioFile = await this.prisma.audioFile.findUnique({
      where: { id },
    });

    return audioFile ? this.mapToIAudioFile(audioFile) : null;
  }

  async findByUploaderId(uploaderId: string): Promise<IAudioFile[]> {
    const audioFiles = await this.prisma.audioFile.findMany({
      where: { uploaderId },
      orderBy: { uploadedAt: "desc" },
    });

    return audioFiles.map((file: any) => this.mapToIAudioFile(file));
  }

  async update(id: string, data: IUpdateAudioFileData): Promise<IAudioFile> {
    const audioFile = await this.prisma.audioFile.update({
      where: { id },
      data: {
        ...(data.fileName && { fileName: data.fileName }),
        ...(data.durationSeconds && { durationSeconds: data.durationSeconds }),
      },
    });

    return this.mapToIAudioFile(audioFile);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.audioFile.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.audioFile.count({
      where: { id },
    });
    return count > 0;
  }

  private mapToIAudioFile(audioFile: any): IAudioFile {
    return {
      id: audioFile.id,
      fileName: audioFile.fileName,
      cloudUrl: audioFile.cloudUrl,
      durationSeconds: audioFile.durationSeconds,
      mimeType: audioFile.mimeType,
      uploadedAt: audioFile.uploadedAt,
      uploaderId: audioFile.uploaderId,
    };
  }
}
