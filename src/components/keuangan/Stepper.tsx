import { STATUS_LAPORAN, type StatusLaporan } from "@/lib/konstanta";
import { TAHAPAN, indeksTahap } from "@/lib/keuangan";

/** Menampilkan posisi laporan pada alur Bendahara -> Ketua RT -> Ketua RW. */
export default function Stepper({ status }: { status: string }) {
  const s = status as StatusLaporan;
  const ditolak = s === STATUS_LAPORAN.DITOLAK;
  const aktif = indeksTahap(s);

  return (
    <ol className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {TAHAPAN.map((t, i) => {
        const selesai = !ditolak && i < aktif;
        const sekarang = !ditolak && i === aktif;
        return (
          <li key={t.kunci} className="flex flex-1 items-center gap-3">
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ring-1 ring-inset ${
                selesai
                  ? "bg-brand-600 text-white ring-brand-600"
                  : sekarang
                    ? "bg-white text-brand-700 ring-brand-500"
                    : "bg-white text-slate-400 ring-slate-200"
              }`}
            >
              {selesai ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12.5l5.5 5.5L20 7" />
                </svg>
              ) : (
                i + 1
              )}
            </span>
            <span
              className={`text-xs font-semibold ${
                selesai || sekarang ? "text-slate-900" : "text-slate-400"
              }`}
            >
              {t.label}
            </span>
            {i < TAHAPAN.length - 1 && (
              <span
                aria-hidden
                className={`hidden h-px flex-1 sm:block ${
                  selesai ? "bg-brand-400" : "bg-slate-200"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
