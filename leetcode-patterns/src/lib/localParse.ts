// On-device text extraction for the capture flow: OCR for images
// (tesseract.js, WASM in a worker) and text-layer extraction for PDFs
// (pdf.js). Both libraries are lazy-loaded on first use so the main bundle is
// unaffected; tesseract's worker/core/langdata load from its default CDNs.

export async function ocrImage(
  image: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      if (m.status === "recognizing text") onProgress?.(Math.round(m.progress * 100));
    },
  });
  try {
    const { data } = await worker.recognize(image);
    return cleanupText(data.text);
  } finally {
    await worker.terminate();
  }
}

export async function extractPdfText(
  data: ArrayBuffer,
  onProgress?: (page: number, total: number) => void
): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  const loadingTask = pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;
  try {
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((it) => ("str" in it ? it.str + (it.hasEOL ? "\n" : " ") : ""))
        .join("");
      pages.push(text.trim());
      onProgress?.(i, doc.numPages);
    }
    return cleanupText(pages.filter(Boolean).join("\n\n"));
  } finally {
    await loadingTask.destroy();
  }
}

function cleanupText(text: string): string {
  return text
    .replace(/[ \t]+\n/g, "\n") // trailing whitespace per line
    .replace(/\n{3,}/g, "\n\n") // collapse blank-line runs
    .trim();
}
