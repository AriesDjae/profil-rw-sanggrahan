"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { IkonChevronKanan, IkonChevronKiri } from "@/components/ui/Ikon";

export type Sorotan = {
  slug: string;
  judul: string;
  ringkasan: string;
  kategori: string;
  gambar: string | null;
  tanggal: string;
};

const JEDA = 7000;

/**
 * Papan sorotan: satu kabar ditampilkan besar, sementara seluruh judul lain
 * tetap terbaca di sampingnya. Pemilihnya sengaja berupa daftar judul, bukan
 * titik-titik, supaya warga langsung tahu ada kabar apa saja seperti membaca
 * papan pengumuman di pos ronda.
 */
export default function SorotanUtama({ daftar }: { daftar: Sorotan[] }) {
  const [aktif, setAktif] = useState(0);
  const [berhenti, setBerhenti] = useState(false);
  const wadah = useRef<HTMLElement>(null);

  useEffect(() => {
    if (daftar.length < 2 || berhenti) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const jam = window.setTimeout(
      () => setAktif((i) => (i + 1) % daftar.length),
      JEDA,
    );
    return () => window.clearTimeout(jam);
  }, [aktif, berhenti, daftar.length]);

  if (daftar.length === 0) return null;

  const geser = (arah: number) =>
    setAktif((i) => (i + arah + daftar.length) % daftar.length);

  const padaTombol = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      geser(1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      geser(-1);
    }
  };

  const kabar = daftar[aktif];

  return (
    <section
      ref={wadah}
      aria-label="Sorotan kabar warga"
      className="border-y border-garis bg-white"
      onMouseEnter={() => setBerhenti(true)}
      onMouseLeave={() => setBerhenti(false)}
      onFocusCapture={() => setBerhenti(true)}
      onBlurCapture={() => setBerhenti(false)}
      onKeyDown={padaTombol}
    >
      <div className="mx-auto grid max-w-6xl lg:grid-cols-[1.65fr_1fr]">
        {/* Panel kabar terpilih */}
        <article className="relative min-w-0 border-garis lg:border-r">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-brand-100 sm:aspect-[16/9] lg:aspect-auto lg:h-[31rem]">
            {/* Berita tanpa foto adalah hal biasa: pengurus sering menulis kabar
                singkat tanpa sempat memotret. Yang tidak boleh terjadi adalah
                <img src=""> — peramban memperlakukannya sebagai gambar rusak.
                Untuk kabar seperti itu latar hijau polos sudah cukup. */}
            {daftar.map((k, i) =>
              k.gambar ? (
                <img
                  key={k.slug}
                  src={k.gambar}
                  alt=""
                  aria-hidden={i !== aktif}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                    i === aktif ? "opacity-100" : "opacity-0"
                  }`}
                />
              ) : (
                <div
                  key={k.slug}
                  aria-hidden
                  className={`absolute inset-0 bg-brand-700 transition-opacity duration-700 ${
                    i === aktif ? "opacity-100" : "opacity-0"
                  }`}
                />
              ),
            )}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/55 to-transparent"
            />

            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
              <p className="text-[13px] font-medium text-aksen-200">
                {kabar.kategori}, {kabar.tanggal}
              </p>
              <h2 className="judul mt-2 max-w-xl text-[1.6rem] text-white sm:text-[2.1rem]">
                <Link
                  href={`/berita/${kabar.slug}`}
                  className="underline-offset-[6px] hover:underline focus-visible:underline"
                >
                  {kabar.judul}
                </Link>
              </h2>
              <p className="mt-3 hidden max-w-lg text-sm leading-relaxed text-brand-100 sm:block">
                {kabar.ringkasan}
              </p>
            </div>
          </div>
        </article>

        {/* Daftar judul sebagai pemilih */}
        <div className="flex flex-col">
          <p className="border-b border-garis px-5 py-3 text-[13px] font-medium text-brand-700 sm:px-6">
            Sedang jadi perbincangan warga
          </p>

          <ul className="flex-1">
            {daftar.map((k, i) => {
              const dipilih = i === aktif;
              return (
                <li key={k.slug} className="border-b border-garis last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setAktif(i)}
                    aria-current={dipilih ? "true" : undefined}
                    className={`group relative block w-full px-5 py-4 text-left transition-colors sm:px-6 ${
                      dipilih ? "bg-brand-50" : "hover:bg-kertas"
                    }`}
                  >
                    <span
                      className={`block text-[15px] leading-snug ${
                        dipilih
                          ? "judul text-brand-900"
                          : "font-medium text-tinta/75 group-hover:text-tinta"
                      }`}
                    >
                      {k.judul}
                    </span>
                    <span className="mt-1 block text-xs text-tinta/50">
                      {k.kategori}
                    </span>

                    {/* Batang laju hanya pada kabar yang sedang tampil */}
                    <span
                      aria-hidden
                      className="absolute inset-x-0 bottom-0 h-[2px] bg-garis/70"
                    >
                      {dipilih && (
                        <span
                          key={`${aktif}-${berhenti}`}
                          className={`block h-full bg-aksen-400 ${
                            berhenti ? "w-full" : "laju-aktif w-full"
                          }`}
                          style={berhenti ? undefined : { animationDuration: `${JEDA}ms` }}
                        />
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between gap-3 border-t border-garis px-5 py-3 sm:px-6">
            <Link
              href="/berita"
              className="text-sm font-medium text-brand-700 underline-offset-4 hover:underline"
            >
              Semua kabar warga
            </Link>
            <span className="flex gap-1">
              <button
                type="button"
                onClick={() => geser(-1)}
                aria-label="Kabar sebelumnya"
                className="grid h-9 w-9 place-items-center border border-garis text-brand-800 transition hover:bg-brand-50"
              >
                <IkonChevronKiri ukuran={15} />
              </button>
              <button
                type="button"
                onClick={() => geser(1)}
                aria-label="Kabar berikutnya"
                className="grid h-9 w-9 place-items-center border border-garis text-brand-800 transition hover:bg-brand-50"
              >
                <IkonChevronKanan ukuran={15} />
              </button>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
