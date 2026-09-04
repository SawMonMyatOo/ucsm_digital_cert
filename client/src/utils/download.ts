// client/src/utils/download.ts
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

const OPTIONS = { pixelRatio: 2, cacheBust: true, backgroundColor: '#FBF8F0' };

export async function downloadPNG(node: HTMLElement, filename: string): Promise<void> {
  const url = await toPng(node, OPTIONS);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.png`;
  a.click();
}

export async function downloadPDF(node: HTMLElement, filename: string): Promise<void> {
  const url = await toPng(node, OPTIONS);
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  pdf.addImage(url, 'PNG', 0, 0, 297, 210);
  pdf.save(`${filename}.pdf`);
}