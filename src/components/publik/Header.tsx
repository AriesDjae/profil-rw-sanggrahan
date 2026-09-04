"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { UMKM } from "@/lib/tautanLuar";

const TAUTAN = [
  { href: "/", label: "Beranda" },
  { href: "/profil", label: "Profil" },
  { href: "/berita", label: "Berita" },
  { href: "/kegiatan", label: "Kegiatan" },
  { href: "/keuangan", label: "Keuangan" },
  { href: "/data-warga", label: "Data Warga" },
  { href: "/galeri", label: "Galeri" },
];

export default function Header({
  namaRw,
  tagline,
}: {
  namaRw: string;
  tagline: string;
}) {
  const path = usePathname();
  const [menu, setMenu] = useState({ buka: false, path });

  // Menutup menu ketika pengguna berpindah halaman
  if (menu.path !== path) setMenu({ buka: false, path });
  const buka = menu.buka;
  const setBuka = (nilai: boolean) => setMenu({ buka: nilai, path });

  const aktif = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-garis bg-kertas/95 backdrop-blur tanpa-cetak">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid h-10 w-10 shrink-0 place-items-center bg-brand-700 text-[13px] font-bold tracking-tight text-white"
          >
            RW
          </span>
          <span className="leading-tight">
            <span className="judul block text-[15px] text-brand-900">{namaRw}</span>
            <span className="hidden text-xs text-tinta/55 sm:block">{tagline}</span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-6 lg:flex">
          {TAUTAN.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              aria-current={aktif(t.href) ? "page" : undefined}
              className={`border-b-2 py-1 text-sm transition-colors ${
                aktif(t.href)
                  ? "border-aksen-400 font-semibold text-brand-900"
                  : "border-transparent text-tinta/70 hover:border-garis hover:text-tinta"
              }`}
            >
              {t.label}
            </Link>
          ))}
          {/*
            Tautan keluar ke situs warga yang satunya. Diberi garis pemisah dan
            panah keluar supaya jelas ini meninggalkan situs ini.
          */}
          <a
            href={UMKM.url}
            className="flex items-center gap-1.5 border-l border-garis py-1 pl-6 text-sm text-tinta/70 transition hover:text-brand-800"
          >
            {UMKM.ringkas}
            <svg
              aria-hidden
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 17L17 7M9 7h8v8" />
            </svg>
            <span className="sr-only">(situs terpisah)</span>
          </a>
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {buka ? (
              <>
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </>
            ) : (
              <>
                <path d="M3 6h18" />
                <path d="M3 12h18" />
                <path d="M3 18h18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {buka && (
        <div className="border-t border-garis bg-white lg:hidden">
          <nav className="mx-auto max-w-6xl px-4 py-2">
            {TAUTAN.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={`block border-b border-garis py-3 text-sm last:border-b-0 ${
                  aktif(t.href) ? "font-semibold text-brand-800" : "text-tinta/80"
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
