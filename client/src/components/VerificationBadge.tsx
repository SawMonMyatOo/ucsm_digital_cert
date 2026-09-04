// client/src/components/VerificationBadge.tsx
export function VerificationBadge({ result }: { result: 'VALID' | 'INVALID' | 'REVOKED' | 'NOT_FOUND' }) {
  const map = {
    VALID: ['✓', 'Digitally Verified', 'border-emerald-800 text-emerald-900 bg-emerald-50'],
    REVOKED: ['✕', 'Certificate Revoked', 'border-red-800 text-red-900 bg-red-50'],
    INVALID: ['✕', 'Verification Failed', 'border-red-800 text-red-900 bg-red-50'],
    NOT_FOUND: ['✕', 'Certificate Not Found', 'border-red-800 text-red-900 bg-red-50']
  } as const;
  const [icon, text, cls] = map[result];
  return (
    <span role="status" className={`inline-flex items-center gap-2 border px-4 py-2 font-display-sc text-sm tracking-widest ${cls}`}>
      <span aria-hidden="true">{icon}</span>{text}
    </span>
  );
}