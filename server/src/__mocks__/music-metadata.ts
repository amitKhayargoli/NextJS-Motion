// Jest mock for music-metadata (ESM-only package, not compatible with Jest CJS mode)
export const parseBuffer = async (_buffer: Buffer, _mimeType?: string) => ({
  format: {
    duration: 120,
    bitrate: 128000,
    sampleRate: 44100,
    numberOfChannels: 2,
    codec: "MP3",
  },
  common: {
    title: undefined,
    artist: undefined,
    album: undefined,
  },
  native: {},
  quality: { warnings: [] },
});

export const parseFile = async (_path: string) => ({
  format: {},
  common: {},
  native: {},
  quality: { warnings: [] },
});
