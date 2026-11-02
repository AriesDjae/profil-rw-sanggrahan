import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { IkonPanahKiri } from "@/components/ui/Ikon";
import TandaKawung from "@/components/ui/TandaKawung";
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
      <div className="relative hidden flex-col justify-between overflow-hidden bg-langit lg:flex">
        <div className="p-12">
          <Link href="/" className="flex items-center gap-3">
            <TandaKawung />
            <span className="judul text-lg text-brand-900">{pengaturan.namaKampung}</span>
          </Link>
          <h2 className="judul mt-14 max-w-md text-[2.4rem] leading-[1.05] text-brand-900">
            Panel pengelolaan informasi warga
          </h2>
          <p className="mt-4 max-w-md text-[17px] leading-relaxed text-brand-900/80">
            Laporan kas disusun bendahara, diverifikasi Ketua RT, lalu disetujui Ketua RW sebelum
            tampil untuk warga.
          </p>
        </div>
        <Image
          src={pengaturan.heroFoto || "/ilustrasi/panorama-kampung.svg"}
          alt=""
          width={1600}
          height={440}
          className="h-72 w-full object-cover object-[62%_100%]"
        />
      </div>

      <main id="konten" tabIndex={-1} className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-brand-700"
          >
            <IkonPanahKiri ukuran={14} />
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
      </main>
    </div>
  );
}
