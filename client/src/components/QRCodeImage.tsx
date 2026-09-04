// client/src/components/QRCodeImage.tsx
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export function QRCodeImage({ value, size = 112, label }: { value: string; size?: number; label?: string }) {
  const [url, setUrl] = useState<string>('');
  useEffect(() => {
    QRCode.toDataURL(value, { width: 512, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#161310', light: '#FFFFFF' } })
      .then(setUrl).catch(() => setUrl(''));
  }, [value]);
  if (!url) return <div style={{ width: size, height: size }} aria-hidden="true" />;
  return (
    <figure className="m-0 flex flex-col items-center gap-1">
      <img src={url} width={size} height={size} alt={`QR code — verify at ${value}`} />
      {label && <figcaption className="text-[10px] tracking-widest font-display-sc text-ink/60">{label}</figcaption>}
    </figure>
  );
}