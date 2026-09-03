import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ambilPengaturan } from "@/lib/pengaturan";
import { penggunaSaatIni } from "@/lib/sesi";

import FormMasuk from "./FormMasuk";

export const metadata: Metadata = {
  title: "Masuk Panel Pengurus",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function HalamanMasuk({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ next }, pengguna, pengaturan] = await Promise.all([
    searchParams,
    penggunaSaatIni(),
    ambilPengaturan(),
  ]);

  if (pengguna) redirect(next && next.startsWith("/") ? next : "/admin");

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden motif-hero p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 motif-batik" aria-hidden />
        <Link href="/" className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 text-sm font-extrabold backdrop-blur">
            RW
          </span>
          <span className="font-bold">{pengaturan.namaRw}</span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-extrabold leading-tight">
            Panel pengelolaan informasi warga
          </h2>
          <p className="mt-4 leading-relaxed text-brand-100">
            Kelola berita, agenda kegiatan, data kependudukan, dan laporan kas RT.
            Setiap laporan keuangan melewati verifikasi Ketua RT sebelum disetujui
            Ketua RW dan tampil untuk warga.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-brand-100">
            {[
              "Bendahara RT mencatat pemasukan dan pengeluaran kas",
              "Ketua RT memverifikasi atau mengembalikan untuk revisi",
              "Ketua RW memberi persetujuan akhir untuk publikasi",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-white/20 text-[9px]">
                  ✓
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-brand-200">
          Halaman ini khusus pengurus. Warga dapat mengakses seluruh informasi publik
          tanpa perlu masuk.
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-brand-700"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            Kembali ke situs warga
          </Link>

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Masuk Panel Pengurus
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Gunakan surel dan kata sandi yang diberikan administrator RW.
          </p>

          <div className="mt-8">
            <FormMasuk next={next} />
          </div>

          <p className="mt-8 rounded-xl bg-slate-100 px-4 py-3 text-xs leading-relaxed text-slate-600">
            Lupa kata sandi? Hubungi administrator RW
            {pengaturan.telepon ? ` di ${pengaturan.telepon}` : ""} untuk penyetelan ulang.
          </p>
        </div>
      </div>
    </div>
  );
}
