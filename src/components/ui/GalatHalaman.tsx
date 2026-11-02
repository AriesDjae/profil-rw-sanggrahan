"use client";

import Image from "next/image";
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
    <section className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-14 sm:py-20 md:grid-cols-2">
      <div className="min-w-0">
      <h1 className="judul text-3xl text-brand-900 sm:text-4xl">
        Halaman ini belum bisa ditampilkan
      </h1>
      <p className="mt-4 max-w-md leading-relaxed text-tinta/70">
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
      </div>
      <Image
        src="/ilustrasi/listrik-padam.svg"
        alt="Malam hari, petugas memperbaiki kabel di tiang listrik kampung"
        width={640}
        height={420}
        className="potongan h-auto w-full"
      />
    </section>
  );
}
