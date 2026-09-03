import Link from "next/link";

import { potong, tanggal } from "@/lib/format";

export type BeritaKartu = {
  slug: string;
  judul: string;
  ringkasan: string;
  kategori: string;
  gambar: string | null;
  terbitAt: Date | null;
};

export default function KartuBerita({
  berita,
  utama = false,
}: {
  berita: BeritaKartu;
  utama?: boolean;
}) {
  return (
    <article
      className={`group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        utama ? "sm:flex" : ""
      }`}
    >
      <Link href={`/berita/${berita.slug}`} className={utama ? "sm:w-1/2" : "block"}>
        <div className={`relative overflow-hidden bg-brand-100 ${utama ? "h-56 sm:h-full" : "h-44"}`}>
          {berita.gambar ? (
            <img
              src={berita.gambar}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-brand-600 to-brand-400" />
          )}
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-brand-800 shadow-sm">
            {berita.kategori}
          </span>
        </div>
      </Link>

      <div className={`p-5 ${utama ? "sm:w-1/2 sm:p-6" : ""}`}>
        <p className="text-xs text-slate-500">{tanggal(berita.terbitAt)}</p>
        <h3 className={`mt-2 font-bold leading-snug text-slate-900 ${utama ? "text-xl" : "text-base"}`}>
          <Link href={`/berita/${berita.slug}`} className="transition group-hover:text-brand-700">
            {berita.judul}
          </Link>
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {potong(berita.ringkasan, utama ? 220 : 130)}
        </p>
        <Link
          href={`/berita/${berita.slug}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          Baca selengkapnya
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
