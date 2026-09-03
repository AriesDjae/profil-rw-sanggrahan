export default function KartuStatistik({
  label,
  nilai,
  keterangan,
  ikon,
  nada = "netral",
}: {
  label: string;
  nilai: string;
  keterangan?: string;
  ikon?: React.ReactNode;
  nada?: "netral" | "brand" | "positif" | "negatif" | "peringatan";
}) {
  const gaya: Record<string, string> = {
    netral: "bg-white border-slate-200",
    brand: "bg-brand-50 border-brand-100",
    positif: "bg-emerald-50 border-emerald-100",
    negatif: "bg-rose-50 border-rose-100",
    peringatan: "bg-amber-50 border-amber-100",
  };
  const warnaNilai: Record<string, string> = {
    netral: "text-slate-900",
    brand: "text-brand-800",
    positif: "text-emerald-800",
    negatif: "text-rose-800",
    peringatan: "text-amber-900",
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${gaya[nada]}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        {ikon && <span className="text-slate-400">{ikon}</span>}
      </div>
      <p className={`mt-3 text-2xl font-bold tabular-nums tracking-tight ${warnaNilai[nada]}`}>
        {nilai}
      </p>
      {keterangan && <p className="mt-1 text-xs text-slate-500">{keterangan}</p>}
    </div>
  );
}
