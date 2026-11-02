import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { IkonPanahKiri } from "@/components/ui/Ikon";
import TandaKawung from "@/components/ui/TandaKawung";
import { AKUN_DEMO, JAM_RESET_DEMO, modeDemo } from "@/lib/demo";
import { ambilPengaturan } from "@/lib/pengaturan";
import { penggunaSaatIni } from "@/lib/sesi";

import { masukDemo } from "./aksi";
import FormMasuk from "./FormMasuk";

/** Tombol masuk satu klik. Formulir biasa, jadi tetap jalan tanpa JavaScript. */
function PilihAkunDemo({ galat }: { galat: boolean }) {
  return (
    <section aria-labelledby="judul-demo" className="mt-6">
      <h2 id="judul-demo" className="text-sm font-semibold text-slate-900">
        Coba tanpa kata sandi
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Ikuti satu laporan kas dari penyusunan sampai terbit dengan berganti peran.
        Data dikembalikan ke kondisi awal tiap {JAM_RESET_DEMO} jam.
      </p>

      {galat && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          Akun demo sedang dipulihkan. Coba lagi dalam satu menit.
        </p>
      )}

      <ul className="mt-4 space-y-2">
        {AKUN_DEMO.map((akun) => (
          <li key={akun.kunci}>
            <form action={masukDemo}>
              <input type="hidden" name="akun" value={akun.kunci} />
              <button
                type="submit"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-brand-400 hover:bg-brand-50 focus-visible:border-brand-500"
              >
                <span className="block text-sm font-semibold text-slate-900">
                  Masuk sebagai {akun.label}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">{akun.keterangan}</span>
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}

export const metadata: Metadata = {
  title: "Masuk Panel Pengurus",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function HalamanMasuk({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; galat?: string }>;
}) {
  const demo = modeDemo();
  const [{ next, galat }, pengguna, pengaturan] = await Promise.all([
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

          {demo ? (
            <PilihAkunDemo galat={galat === "demo"} />
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              Gunakan surel dan kata sandi yang diberikan administrator RW.
            </p>
          )}

          <div className="mt-8">
            {demo && (
              <p className="mb-4 text-sm text-slate-500">
                Akun lain, misalnya <span className="text-slate-700">ketuarw2@sanggrahan.id</span>,
                bisa dimasuki dengan kata sandi{" "}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">
                  sanggrahan123
                </code>
                .
              </p>
            )}
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
