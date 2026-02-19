import axios from "axios";

const BASE = process.env.SUMMARIZER_URL || "http://localhost:8000";

type SummarizeResponse = {
  summary: string;
};

export async function summarizeText(text: string): Promise<string> {
  const res = await axios.post<SummarizeResponse>(
    `${BASE}/summarize`,
    { text },
    { timeout: 120000 },
  );

  return res.data.summary;
}
