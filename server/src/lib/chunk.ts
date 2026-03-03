export function chunkText(text: string, maxChars = 1200) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const chunks: string[] = [];
  let i = 0;

  while (i < clean.length) {
    const end = Math.min(i + maxChars, clean.length);

    // try to break on sentence boundary
    let cut = end;
    const slice = clean.slice(i, end);
    const lastDot = Math.max(
      slice.lastIndexOf(". "),
      slice.lastIndexOf("? "),
      slice.lastIndexOf("! "),
    );
    if (lastDot > 200) cut = i + lastDot + 2;

    chunks.push(clean.slice(i, cut).trim());
    i = cut;
  }

  return chunks.filter(Boolean);
}
