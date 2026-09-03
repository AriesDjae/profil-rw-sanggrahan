import Link from "next/link";

import { hitungMundur, jam, potong, selisihHari } from "@/lib/format";
import { NAMA_BULAN } from "@/lib/konstanta";

export type KegiatanKartu = {
  slug: string;
  judul: string;
  deskripsi: string;
  mulai: Date;
  selesai: Date | null;
  lokasi: string;
  kategori: string;
  penyelenggara: string | null;
};

export default function KartuKegiatan({ kegiatan }: { kegiatan: KegiatanKartu }) {
  const mulai = new Date(kegiatan.mulai);
  const hari = selisihHari(mulai);
  const segera = hari >= 0 && hari <= 7;

  return (
    <article className="group flex min-w-0 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md sm:p-5">
      <div
        className={`grid h-[4.5rem] w-16 shrink-0 place-items-center rounded-xl text-center ${
          segera ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-800"
        }`}
      >
        <div>
          <p className="text-xl font-bold leading-none">{mulai.getDate()}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase">
            {NAMA_BULAN[mulai.getMonth()].slice(0, 3)}
          </p>
          <p className="text-[10px] opacity-80">{mulai.getFullYear()}</p>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {kegiatan.kategori}
          </span>
          <span
            className={`text-[11px] font-semibold ${
              segera ? "text-brand-700" : "text-slate-400"
            }`}
          >
            {hitungMundur(mulai)}
          </span>
        </div>

        <h3 className="mt-1.5 truncate text-base font-bold text-slate-900">
          <Link href={`/kegiatan/${kegiatan.slug}`} className="transition group-hover:text-brand-700">
            {kegiatan.judul}
          </Link>
        </h3>

        <p className="mt-1 line-clamp-2 text-sm text-slate-600">
          {potong(kegiatan.deskripsi, 110)}
        </p>

        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <svg aria-hidden width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" strokeLinecap="round" />
            </svg>
            <dt className="sr-only">Waktu</dt>
            <dd>
              {jam(mulai)}
              {kegiatan.selesai ? ` - ${jam(kegiatan.selesai)}` : ""} WIB
            </dd>
          </div>
          <div className="flex min-w-0 items-center gap-1.5">
            <svg aria-hidden width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            <dt className="sr-only">Lokasi</dt>
            <dd className="truncate">{kegiatan.lokasi}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
