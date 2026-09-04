// server/src/renderer.ts
import sharp, { type Sharp, type OverlayOptions } from 'sharp';
// @ts-ignore
import PDFDocument from 'pdfkit';
import path from 'node:path';
import fs from 'node:fs';
import { type CertificateRecord } from './certService.js';
import { type TemplateRecord as Template } from './seed.js';

function resolveAssetPath(assetUrl: string | null | undefined, uploadsDir: string): string | null {
  if (!assetUrl) return null;
  const basename = path.basename(assetUrl);
  const inUploads = path.join(uploadsDir, basename);
  if (fs.existsSync(inUploads)) return inUploads;

  const inClientAssets = path.resolve(process.cwd(), '..', 'client', 'public', 'assets', basename);
  if (fs.existsSync(inClientAssets)) return inClientAssets;

  const inClientPublic = path.resolve(process.cwd(), '..', 'client', 'public', assetUrl.replace(/^\//, ''));
  if (fs.existsSync(inClientPublic)) return inClientPublic;

  return null;
}

export async function generateCertificatePdf(
  cert: CertificateRecord,
  template: Template,
  uploadsDir: string
): Promise<Buffer> {
  const W = 1123;
  const H = 794;

  // 1. Load template background
  const bgPath = resolveAssetPath(template.background, uploadsDir);
  let baseSharp: Sharp;
  if (bgPath) {
    baseSharp = sharp(bgPath).resize(W, H);
  } else {
    // Create clean parchment fallback canvas
    baseSharp = sharp({
      create: {
        width: W,
        height: H,
        channels: 4,
        background: { r: 251, g: 248, b: 240, alpha: 1 }
      }
    });
  }

  const overlays: OverlayOptions[] = [];

  // 2. Load and overlay emblem logo under top heading
  const emblemPath = resolveAssetPath(template.emblem || '/assets/ucsm-emblem.png', uploadsDir);
  if (emblemPath) {
    try {
      const emblemBuffer = await sharp(emblemPath)
        .resize({ height: 88, fit: 'inside' })
        .toBuffer();
      overlays.push({
        input: emblemBuffer,
        top: 62,
        left: Math.round((W - 88) / 2)
      });
    } catch {
      // ignore if emblem cannot be read
    }
  }

  // 3. Load and overlay signature image if available
  const sigPath = resolveAssetPath(template.signatureImage, uploadsDir);
  if (sigPath) {
    try {
      const sigBuffer = await sharp(sigPath)
        .resize({ height: 54, fit: 'inside' })
        .toBuffer();
      overlays.push({
        input: sigBuffer,
        top: 672,
        left: 770
      });
    } catch {
      // ignore if signature cannot be read
    }
  }

  // 4. Format Date
  const d = new Date(`${cert.issuedDate}T00:00:00`);
  const day = Number.isNaN(d.getTime()) ? 27 : d.getDate();
  const j = day % 10, k = day % 100;
  const suffix = (j === 1 && k !== 11) ? 'st' : (j === 2 && k !== 12) ? 'nd' : (j === 3 && k !== 13) ? 'rd' : 'th';
  const monthYear = Number.isNaN(d.getTime())
    ? 'August 2026'
    : d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  // 5. Draw text layers with SVG
  const svgOverlay = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#d3a14b" />
          <stop offset="50%" stop-color="#b8862f" />
          <stop offset="100%" stop-color="#8f651c" />
        </linearGradient>
      </defs>
      <style>
        .heading { font-family: 'Times New Roman', Times, serif; font-size: 22px; font-weight: bold; letter-spacing: 2px; fill: #111111; }
        .title { font-family: 'Playfair Display', Georgia, serif; font-size: 45px; font-style: italic; font-weight: bold; letter-spacing: 2px; fill: #141414; }
        .presented { font-family: 'Playfair Display SC', Georgia, serif; font-size: 15px; font-weight: bold; letter-spacing: 4px; fill: #111111; }
        .recipient { font-family: 'Amoresa', 'Great Vibes', cursive; font-size: 64px; fill: url(#goldGrad); }
        .body-regular { font-family: 'Playfair Display', Georgia, serif; font-size: 18px; fill: #222222; }
        .body-bold { font-family: 'Playfair Display', Georgia, serif; font-size: 21px; font-weight: bold; fill: #0f0f0f; }
        .footer-text { font-family: 'Times New Roman', serif; font-size: 14px; fill: #222222; }
        .footer-bold { font-family: 'Times New Roman', Times, serif; font-size: 14.5px; font-weight: bold; fill: #111111; }
      </style>

      <!-- Top: University Name in Times New Roman -->
      <text x="50%" y="50" text-anchor="middle" class="heading">${template.heading}</text>

      <!-- Title: Certificate of Appreciation -->
      <text x="50%" y="190" text-anchor="middle" class="title">${template.title}</text>

      <!-- Presented to in Playfair Display SC -->
      <text x="50%" y="228" text-anchor="middle" class="presented">${template.presentedToText}</text>

      <!-- Recipient Name in Amoresa -->
      <text x="50%" y="325" text-anchor="middle" class="recipient">${cert.recipientName}</text>

      <!-- Body text in Playfair Display with description in bold -->
      <text x="50%" y="396" text-anchor="middle" class="body-regular">In recogration of your active participation and valuable contribution to the</text>
      <text x="50%" y="426" text-anchor="middle" class="body-bold">${cert.description || 'UCSM AI Hackathon 2026'}</text>
      <text x="50%" y="456" text-anchor="middle" class="body-regular">and for demostrating the spirit of innovation, creativity, and teamwork.</text>

      <!-- Left: Issue Date (moved inward) -->
      <text x="120" y="736" class="footer-text">${template.issueDateLabel}: ${day} August 2026</text>
      <text x="120" y="756" class="footer-text" style="font-size: 11px;">Certificate ID: ${cert.certificateId}</text>

      <!-- Center: Rector & Organization (same font and size) -->
      <text x="50%" y="736" text-anchor="middle" class="footer-bold">${cert.signatory.name}</text>
      <text x="50%" y="756" text-anchor="middle" class="footer-bold">${cert.signatory.organization}</text>
    </svg>
  `;

  overlays.push({
    input: Buffer.from(svgOverlay),
    top: 0,
    left: 0,
    blend: 'over'
  });

  const compositeImage = await baseSharp
    .composite(overlays)
    .png()
    .toBuffer();

  // 5. Wrap in PDF (page sized exactly to A4 landscape)
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.image(compositeImage, 0, 0, { width: doc.page.width, height: doc.page.height });
    doc.end();
  });
}
