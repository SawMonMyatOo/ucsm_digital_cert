// client/src/components/ShareButtons.tsx
import { useCallback } from 'react';

const UCSM_LINKEDIN = 'https://www.linkedin.com/school/ucsm-mmr/';

export function ShareButtons({ verifyUrl, title }: { verifyUrl: string; title: string }) {
  const u = encodeURIComponent(verifyUrl);
  const t = encodeURIComponent(title);
  const open = (href: string) => (): void => { window.open(href, '_blank', 'noopener,noreferrer,width=640,height=520'); };
  const copy = useCallback(async () => { await navigator.clipboard.writeText(verifyUrl); }, [verifyUrl]);
  const native = useCallback(async () => {
    if (navigator.share) await navigator.share({ title, url: verifyUrl }).catch(() => undefined);
  }, [title, verifyUrl]);

  const btn = 'btn-outline !px-3 !py-1.5 text-xs';
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Share certificate">
      <button type="button" className={btn} onClick={() => void copy()}>Copy Link</button>
      <button type="button" className={btn} onClick={open(`https://www.facebook.com/sharer/sharer.php?u=${u}`)}>Facebook</button>
      <button type="button" className={btn} onClick={open(`https://www.linkedin.com/sharing/share-offsite/?url=${u}`)}>LinkedIn</button>
      <button type="button" className={btn} onClick={open(`https://twitter.com/intent/tweet?url=${u}&text=${t}`)}>X / Twitter</button>
      <button type="button" className={btn} onClick={open(`https://wa.me/?text=${t}%20${u}`)}>WhatsApp</button>
      <a className={btn} href={`mailto:?subject=${t}&body=${t}%0A${u}`}>Email</a>
      {typeof navigator !== 'undefined' && 'share' in navigator && (
        <button type="button" className={btn} onClick={() => void native()}>Share…</button>
      )}
      <p className="w-full text-[11px] text-ink/60 font-serif">
        Authorized by: University of Computer Studies, Mandalay ·{' '}
        <a className="underline hover:text-gold-dark" href={UCSM_LINKEDIN} target="_blank" rel="noreferrer">LinkedIn: University of Computer Studies, Mandalay</a>
      </p>
    </div>
  );
}