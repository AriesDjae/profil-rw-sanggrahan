"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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
  sudahMasuk,
}: {
  namaRw: string;
  tagline: string;
  sudahMasuk: boolean;
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
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-white/90 backdrop-blur tanpa-cetak">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-sm font-extrabold tracking-tight text-white shadow-sm"
          >
            RW
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-bold text-brand-900">{namaRw}</span>
            <span className="hidden text-xs text-slate-500 sm:block">{tagline}</span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {TAUTAN.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                aktif(t.href)
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {t.label}
            </Link>
          ))}
          <Link
            href={sudahMasuk ? "/admin" : "/masuk"}
            className="ml-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            {sudahMasuk ? "Panel Pengurus" : "Masuk Pengurus"}
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setBuka(!buka)}
          aria-expanded={buka}
          aria-label="Buka menu navigasi"
          className="ml-auto grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-700 lg:hidden"
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
        <div className="border-t border-slate-100 bg-white lg:hidden">
          <nav className="mx-auto grid max-w-6xl gap-1 px-4 py-3">
            {TAUTAN.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                  aktif(t.href) ? "bg-brand-50 text-brand-700" : "text-slate-700"
                }`}
              >
                {t.label}
              </Link>
            ))}
            <Link
              href={sudahMasuk ? "/admin" : "/masuk"}
              className="mt-1 rounded-lg bg-brand-600 px-3 py-2.5 text-center text-sm font-semibold text-white"
            >
              {sudahMasuk ? "Panel Pengurus" : "Masuk Pengurus"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
