import axios from "axios";

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

type OllamaEmbedResponse = { embedding: number[] };
type OllamaGenerateResponse = { response: string };

export async function ollamaEmbed(text: string): Promise<number[]> {
  try {
    const res = await axios.post<OllamaEmbedResponse>(
      `${OLLAMA_BASE}/api/embeddings`,
      { model: "nomic-embed-text", prompt: text },
      { timeout: 60_000 },
    );

    if (!Array.isArray(res.data?.embedding)) {
      throw new Error("Ollama returned no embedding[]");
    }

    return res.data.embedding;
  } catch (err: any) {
    const msg = err?.response?.data
      ? JSON.stringify(err.response.data)
      : err?.message || "Unknown Ollama error";
    throw new Error(`ollamaEmbed failed: ${msg}`);
  }
}

export async function ollamaGenerate(prompt: string): Promise<string> {
  try {
    const res = await axios.post<OllamaGenerateResponse>(
      `${OLLAMA_BASE}/api/generate`,
      { model: "llama3.2", prompt, stream: false },
      { timeout: 120_000 },
    );

    return res.data.response;
  } catch (err: any) {
    const msg = err?.response?.data
      ? JSON.stringify(err.response.data)
      : err?.message || "Unknown Ollama error";
    throw new Error(`ollamaGenerate failed: ${msg}`);
  }
}
