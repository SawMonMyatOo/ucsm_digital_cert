// client/src/components/StatCard.tsx
export function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: 'gold' | 'red' | 'green' }) {
  const color = accent === 'red' ? 'text-red-800' : accent === 'green' ? 'text-emerald-800' : 'text-gold-dark';
  return (
    <div className="card px-5 py-4">
      <p className="font-display-sc text-xs tracking-widest text-navy/70">{label}</p>
      <p className={`mt-1 font-display text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}