"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { IkonMenu, IkonTautanLuar, IkonTutup } from "@/components/ui/Ikon";
import { UMKM } from "@/lib/tautanLuar";

export type RwNav = { nomor: number; nama: string };

/**
 * Kop halaman satu situs untuk tiga RW.
 *
 * Aturan navigasinya: begitu pengunjung berada di dalam sebuah RW, seluruh
 * tautan menu ikut menunjuk ke dalam RW itu (/rw/2/berita, bukan /berita).
 * Tanpa itu, sekali menekan "Berita" ia keluar dari RW-nya tanpa sadar dan
 * membaca kabar dua RW yang bukan wilayahnya.
 *
 * Pemilih RW selalu ada, termasuk di halaman kampung, karena memilih RW adalah
 * hal pertama yang dilakukan hampir setiap pengunjung.
 */
const BAGIAN = [
  { jalur: "", label: "Beranda" },
  { jalur: "/profil", label: "Profil" },
  { jalur: "/berita", label: "Berita" },
  { jalur: "/kegiatan", label: "Kegiatan" },
  { jalur: "/keuangan", label: "Keuangan" },
  { jalur: "/data-warga", label: "Data Warga" },
  { jalur: "/galeri", label: "Galeri" },
];

export default function Header({
  namaKampung,
  tagline,
  daftarRw,
}: {
  namaKampung: string;
  tagline: string;
  daftarRw: RwNav[];
}) {
  const path = usePathname();
  const [menu, setMenu] = useState({ buka: false, path });

  // Menutup menu ketika pengguna berpindah halaman
  if (menu.path !== path) setMenu({ buka: false, path });
  const buka = menu.buka;
  const setBuka = (nilai: boolean) => setMenu({ buka: nilai, path });

  // RW yang sedang dibuka dibaca dari alamat, bukan dari state: tautan yang
  // dibagikan lewat WhatsApp pun langsung membuka menu RW yang benar.
  const cocok = /^\/rw\/(\d+)/.exec(path);
  const nomorAktif = cocok ? Number(cocok[1]) : null;
  const rwAktif = daftarRw.find((r) => r.nomor === nomorAktif) ?? null;
  const basis = rwAktif ? `/rw/${rwAktif.nomor}` : "";

  const alamat = (jalur: string) => `${basis}${jalur}` || "/";
  const aktif = (jalur: string) => {
    const tujuan = alamat(jalur);
    return jalur === "" ? path === tujuan : path.startsWith(tujuan);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-garis bg-kertas/95 backdrop-blur tanpa-cetak">
      {/* Baris atas: identitas kampung dan pemilih RW */}
      <div className="border-b border-garis/70 bg-white/60">
        {/* Tinggi 32px dijaga di seluruh baris ini: inilah satu-satunya tempat
            warga berpindah RW, dan di ponsel ia ditekan dengan ibu jari. */}
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 px-4">
          <Link
            href="/"
            className="flex min-h-8 items-center text-[12px] font-semibold tracking-wide text-tinta/60 transition hover:text-brand-800"
          >
            {namaKampung}
          </Link>

          <nav aria-label="Pilih RW" className="flex items-center gap-1">
            {daftarRw.map((r) => (
              <Link
                key={r.nomor}
                href={`/rw/${r.nomor}`}
                aria-current={r.nomor === nomorAktif ? "true" : undefined}
                className={`flex min-h-8 items-center px-2.5 text-[12px] font-semibold transition ${
                  r.nomor === nomorAktif
                    ? "bg-brand-700 text-white"
                    : "text-tinta/60 hover:bg-brand-50 hover:text-brand-800"
                }`}
              >
                {r.nama}
              </Link>
            ))}
          </nav>

          <a
            href={UMKM.url}
            className="ml-auto hidden min-h-8 items-center gap-1.5 text-[12px] text-tinta/55 transition hover:text-brand-800 sm:flex"
          >
            {UMKM.ringkas}
            <IkonTautanLuar ukuran={11} />
            <span className="sr-only">(situs terpisah)</span>
          </a>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href={alamat("")} className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid h-10 w-10 shrink-0 place-items-center bg-brand-700 text-[13px] font-bold tracking-tight text-white"
          >
            {rwAktif ? String(rwAktif.nomor).padStart(2, "0") : "RW"}
          </span>
          <span className="leading-tight">
            <span className="judul block text-[15px] text-brand-900">
              {rwAktif ? rwAktif.nama : namaKampung}
            </span>
            <span className="hidden text-xs text-tinta/55 sm:block">
              {rwAktif ? namaKampung : tagline}
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-6 lg:flex">
          {BAGIAN.map((t) => (
            <Link
              key={t.jalur}
              href={alamat(t.jalur)}
              aria-current={aktif(t.jalur) ? "page" : undefined}
              className={`border-b-2 py-1 text-sm transition-colors ${
                aktif(t.jalur)
                  ? "border-aksen-400 font-semibold text-brand-900"
                  : "border-transparent text-tinta/70 hover:border-garis hover:text-tinta"
              }`}
            >
              {t.label}
            </Link>
          ))}
          <Link
            href="/masuk"
            className="bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            Masuk Pengurus
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setBuka(!buka)}
          aria-expanded={buka}
          aria-label="Buka menu navigasi"
          className="ml-auto grid h-10 w-10 place-items-center border border-garis text-tinta lg:hidden"
        >
          {buka ? <IkonTutup ukuran={20} /> : <IkonMenu ukuran={20} />}
        </button>
      </div>

      {buka && (
        <div className="border-t border-garis bg-white lg:hidden">
          <nav className="mx-auto max-w-6xl px-4 py-2">
            {rwAktif && (
              <p className="border-b border-garis py-3 text-xs font-semibold text-tinta/55">
                Menelusuri {rwAktif.nama}
              </p>
            )}
            {BAGIAN.map((t) => (
              <Link
                key={t.jalur}
                href={alamat(t.jalur)}
                className={`block border-b border-garis py-3 text-sm ${
                  aktif(t.jalur) ? "font-semibold text-brand-800" : "text-tinta/80"
                }`}
              >
                {t.label}
              </Link>
            ))}
            <a
              href={UMKM.url}
              className="block border-b border-garis py-3 text-sm text-tinta/80"
            >
              {UMKM.nama} &rarr;
              <span className="sr-only">(situs terpisah)</span>
            </a>
            <Link
              href="/masuk"
              className="mt-3 mb-2 block bg-brand-700 px-3 py-3 text-center text-sm font-semibold text-white"
            >
              Masuk Pengurus
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
