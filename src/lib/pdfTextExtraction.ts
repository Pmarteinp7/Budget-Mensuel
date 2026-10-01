import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
// Vite-specific: bundles the pdf.js worker and gives us a URL to point the lib at.
// eslint-disable-next-line import/no-unresolved
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PositionedItem {
  text: string;
  x: number;
  y: number;
}

interface TextLine {
  y: number;
  items: PositionedItem[];
}

const Y_TOLERANCE = 2.5;

/**
 * Extracts text from a PDF file, grouped into lines using each glyph's
 * on-page position (not just reading order), so columns (date / libellé /
 * débit / crédit) stay distinguishable even when pdf.js's raw text stream
 * interleaves them.
 */
export async function extractPdfLines(file: File): Promise<TextLine[][]> {
  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: TextLine[][] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();

    const items: PositionedItem[] = content.items
      .filter((it): it is TextItem => 'transform' in it && it.str.trim().length > 0)
      .map((it) => ({
        text: it.str.trim(),
        x: it.transform[4],
        y: it.transform[5],
      }));

    const lines: TextLine[] = [];
    for (const item of items) {
      let line = lines.find((l) => Math.abs(l.y - item.y) <= Y_TOLERANCE);
      if (!line) {
        line = { y: item.y, items: [] };
        lines.push(line);
      }
      line.items.push(item);
    }

    for (const line of lines) {
      line.items.sort((a, b) => a.x - b.x);
    }
    lines.sort((a, b) => b.y - a.y); // PDF y-axis grows upward; page order is top to bottom

    pages.push(lines);
  }

  return pages;
}
