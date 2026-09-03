import {
  LABEL_STATUS_LAPORAN,
  WARNA_STATUS_LAPORAN,
  type StatusLaporan,
} from "@/lib/konstanta";

export function LencanaStatus({ status }: { status: string }) {
  const s = status as StatusLaporan;
  const warna = WARNA_STATUS_LAPORAN[s] ?? "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${warna}`}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {LABEL_STATUS_LAPORAN[s] ?? status}
    </span>
  );
}

export function Lencana({
  anak,
  warna = "bg-slate-100 text-slate-700 ring-slate-200",
}: {
  anak: React.ReactNode;
  warna?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${warna}`}
    >
      {anak}
    </span>
  );
}
