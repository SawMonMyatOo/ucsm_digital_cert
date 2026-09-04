// client/src/components/CertificateRenderer.tsx — faithful to the UCSM certificate reference
import { forwardRef } from 'react';
import type { Certificate, Template } from '../types';
import { formatDate, interpolate } from '../utils/format';
import { QRCodeImage } from './QRCodeImage';
import { useScale } from '../hooks/useScale';

export const DESIGN_W = 1123;
export const DESIGN_H = 794;

interface Props { certificate: Certificate; template: Template; verifyUrl: string }

function FallbackCorners() {
  return (
    <>
      <div className="absolute inset-[18px] border-[1.5px] border-gold pointer-events-none" aria-hidden="true" />
      <div className="absolute inset-[26px] border border-ink/60 pointer-events-none" aria-hidden="true" />
    </>
  );
}

export const CertificateRenderer = forwardRef<HTMLDivElement, Props>(function CertificateRenderer({ certificate, template, verifyUrl }, ref) {
  const vars = {
    recipientName: certificate.recipientName,
    description: certificate.description,
    organization: certificate.organization,
    certificateType: certificate.certificateType
  };

  const bgImage = template.background || '/assets/no_text.png';
  const hasCustomBg = Boolean(bgImage);
  const isBgOnly = bgImage.includes('bg_only');
  const showEmblem = !hasCustomBg || isBgOnly;

  return (
    <div
      ref={ref}
      className="paper relative select-none overflow-hidden"
      style={{ width: DESIGN_W, height: DESIGN_H, color: '#161310' }}
    >
      {/* 1. Background layer: uploaded luxury certificate background */}
      {hasCustomBg ? (
        <img
          src={bgImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover pointer-events-none select-none"
        />
      ) : (
        <>
          <FallbackCorners />
          <img
            src={template.emblem}
            alt=""
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 w-[430px] -translate-x-1/2 -translate-y-1/2 opacity-[0.05] grayscale pointer-events-none"
          />
        </>
      )}

      {/* 2. Certificate Content */}
      <div className="relative z-10 flex h-full flex-col items-center px-16 text-center">
        {/* Top: University Name in Times New Roman */}
        <h2 className="mt-4 font-serif text-[25px] font-bold tracking-[0.15em] text-ink uppercase">
          {template.heading}
        </h2>

        {/* Under it: UCSM Logo */}
        <img
          src={template.emblem || '/assets/ucsm_logo.png'}
          alt="UCSM emblem"
          className="mt-1 h-[78px] w-[78px] object-contain select-none pointer-events-none"
        />

        {/* Title: Certificate of Appreciation (Playfair Display bold italic) */}
        <h1 className="mt-1 font-display text-[50px] font-bold italic leading-tight tracking-wide text-ink">
          {template.title}
        </h1>

        {/* Presented to label: Playfair Display SC bold */}
        <p className="mt-1.5 font-display-sc text-[25px] font-bold tracking-[0.075em] text-ink uppercase">
          {template.presentedToText}
        </p>

        {/* Dynamic Recipient Name: Amoresa font */}
        <div className="my-0.5 flex w-full items-center justify-center">
          <p
            className="font-script leading-normal text-center select-text"
            style={{
              fontSize: template.recipientSize || 64,
              color: '#b6832e',
              background: 'linear-gradient(180deg, #d3a14b 0%, #b8862f 45%, #8f651c 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 1px 1px rgba(120, 80, 10, 0.35))',
              letterSpacing: '0.01em',
              paddingTop: '0.4em',
              paddingBottom: '0.02em'
            }}
          >
            {certificate.recipientName}
          </p>
        </div>

        {/* Body Text: user text size */}
        <div className="mt-0.5 max-w-[850px] font-display text-[1.5em] leading-[1.35] text-ink/90">
          {template.bodyTemplate.map((line, i) => {
            const interpolated = interpolate(line, vars);
            const isHighlighted = line.includes('{{description}}') || i === 1;
            return (
              <p
                key={i}
                className={isHighlighted ? 'font-display font-bold text-[1.25em] text-ink' : 'font-display'}
              >
                {interpolated}
              </p>
            );
          })}
        </div>

        {/* Bottom row: ID+date · signature · QR moved inward */}
        <div className="mt-auto mb-4 flex w-full items-end justify-between px-24 text-left">
          <div className="w-[250px] font-serif text-[13.5px] leading-relaxed text-ink/85">
            <p>
              {template.issueDateLabel}: <span className="font-semibold">{formatDate(certificate.issuedDate)}</span>
            </p>
            <p className="mt-1">
              Certificate ID: <span className="font-display-sc tracking-wider">{certificate.certificateId}</span>
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            {template.signatureImage ? (
              <img
                src={template.signatureImage}
                alt={`Signature of ${certificate.signatory.name}`}
                className="h-[54px] object-contain"
              />
            ) : (
              <div className="h-[54px]" />
            )}
            <div className="h-px w-[240px] bg-ink/70" />
            <p className="mt-1.5 font-serif text-[14.5px] font-semibold text-ink">
              {certificate.signatory.name}
            </p>
            <p className="mt-0.5 font-serif text-[14.5px] font-semibold text-ink">
              {certificate.signatory.organization}
            </p>
          </div>

          <div className="flex w-[250px] justify-end">
            {template.showQR && <QRCodeImage value={verifyUrl} size={96} label="SCAN TO VERIFY" />}
          </div>
        </div>

        <p className="mb-2.5 font-display-sc text-[10px] tracking-[0.3em] text-gold-dark">
          {template.verificationText} · {certificate.certificateId}
        </p>
      </div>
    </div>
  );
});

/** Responsive scaled wrapper (desktop / tablet / mobile). */
export function ScaledCertificate(props: Props) {
  const { ref, scale } = useScale(DESIGN_W);
  return (
    <div ref={ref} className="relative w-full overflow-hidden" style={{ height: DESIGN_H * scale }}>
      <div style={{ width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
        <CertificateRenderer {...props} />
      </div>
    </div>
  );
}