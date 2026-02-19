from fastapi import FastAPI
from pydantic import BaseModel
from faster_whisper import WhisperModel
import tempfile, os, requests

app = FastAPI()

model = WhisperModel("small", device="cuda", compute_type="float16")

class TranscribeRequest(BaseModel):
    audio_url: str  

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/transcribe")
def transcribe(body: TranscribeRequest):
    url = body.audio_url.strip()
    if not url:
        return {"text": "", "language": ""}

    r = requests.get(url, stream=True, timeout=120)
    r.raise_for_status()

    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as f:
        for chunk in r.iter_content(chunk_size=1024 * 1024):
            if chunk:
                f.write(chunk)
        tmp_path = f.name

    try:
        segments, info = model.transcribe(tmp_path, vad_filter=True)
        text = " ".join([s.text.strip() for s in segments]).strip()
        return {"text": text, "language": info.language}
    finally:
        try:
            os.remove(tmp_path)
        except:
            pass
