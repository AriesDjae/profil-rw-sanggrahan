"use client";

import Link from "next/link";

/**
 * Isi halaman saat render gagal, biasanya karena basis data tidak terjangkau.
 * Pesan aslinya tidak ditampilkan; kode galat cukup untuk mencocokkan log server.
 */
export default function GalatHalaman({
  error,
  retry,
  tujuan = "/",
  labelTujuan = "Kembali ke beranda",
}: {
  error: Error & { digest?: string };
  retry: () => void;
  tujuan?: string;
  labelTujuan?: string;
}) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:py-28">
      <h1 className="judul text-3xl text-brand-950 sm:text-4xl">
        Halaman ini belum bisa ditampilkan
      </h1>
      <p className="mt-4 max-w-xl leading-relaxed text-tinta/70">
        Terjadi gangguan saat memuat data. Data warga dan laporan kas tidak berubah. Coba lagi
        beberapa saat, atau kabari pengurus bila masih berulang.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex min-h-11 items-center bg-brand-700 px-5 text-sm font-semibold text-white transition hover:bg-brand-800"
        >
          Coba lagi
        </button>
        <Link
          href={tujuan}
          className="inline-flex min-h-11 items-center border border-garis bg-white px-5 text-sm font-semibold text-brand-800 transition hover:border-brand-300"
        >
          {labelTujuan}
        </Link>
      </div>

      {error.digest && (
        <p className="mt-8 text-xs text-tinta/50">
          Kode galat: <code>{error.digest}</code>
        </p>
      )}
    </section>
  );
}
