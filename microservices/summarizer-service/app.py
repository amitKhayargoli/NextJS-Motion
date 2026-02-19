from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI()

summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")
_ = summarizer("warmup text", max_length=30, min_length=5, do_sample=False)

class SummarizeRequest(BaseModel):
    text: str

def chunk_text(text: str, size: int = 1200):
    return [text[i:i+size] for i in range(0, len(text), size)]

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/summarize")
def summarize(body: SummarizeRequest):
    text = (body.text or "").strip()
    if not text:
        return {"summary": ""}

    chunks = chunk_text(text, 1200)
    partial = []

    for c in chunks:
        out = summarizer(
            c,
            max_length=120,   # output size
            min_length=30,
            do_sample=False
        )
        partial.append(out[0]["summary_text"])

    if len(partial) > 1:
        out2 = summarizer(
            " ".join(partial),
            max_length=140,
            min_length=40,
            do_sample=False
        )
        return {"summary": out2[0]["summary_text"]}

    return {"summary": partial[0]}
