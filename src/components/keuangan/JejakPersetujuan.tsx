import { tanggalWaktu } from "@/lib/format";
import { LABEL_AKSI } from "@/lib/konstanta";

export type ItemJejak = {
  id: number;
  aksi: string;
  catatan: string | null;
  createdAt: Date;
  oleh: { nama: string; jabatan: string | null } | null;
};

const WARNA_AKSI: Record<string, string> = {
  BUAT: "bg-slate-200 text-slate-700",
  AJUKAN: "bg-amber-100 text-amber-800",
  VERIFIKASI_RT: "bg-sky-100 text-sky-800",
  SETUJUI_RW: "bg-emerald-100 text-emerald-800",
  TOLAK_RT: "bg-rose-100 text-rose-800",
  TOLAK_RW: "bg-rose-100 text-rose-800",
};

export default function JejakPersetujuan({ jejak }: { jejak: ItemJejak[] }) {
  if (jejak.length === 0) {
    return <p className="text-sm text-slate-500">Belum ada aktivitas persetujuan.</p>;
  }

  return (
    <ol className="relative space-y-6 border-l border-slate-200 pl-6">
      {jejak.map((j) => (
        <li key={j.id} className="relative">
          <span
            aria-hidden
            className={`absolute -left-[1.85rem] top-0.5 grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ring-4 ring-white ${
              WARNA_AKSI[j.aksi] ?? "bg-slate-200 text-slate-700"
            }`}
          >
            {j.aksi.startsWith("TOLAK") ? "!" : "✓"}
          </span>
          <p className="text-sm font-semibold text-slate-900">
            {LABEL_AKSI[j.aksi] ?? j.aksi}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {j.oleh ? `${j.oleh.nama}${j.oleh.jabatan ? ` — ${j.oleh.jabatan}` : ""}` : "Sistem"}
            {" · "}
            {tanggalWaktu(j.createdAt)}
          </p>
          {j.catatan && (
            <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              “{j.catatan}”
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
