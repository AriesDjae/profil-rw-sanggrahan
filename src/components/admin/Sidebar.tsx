"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export type ItemMenu = {
  href: string;
  label: string;
  ikon: string;
  lencana?: number;
};

const IKON: Record<string, React.ReactNode> = {
  dasbor: <path d="M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6V11h-6v9zm0-16v5h6V4h-6z" />,
  persetujuan: <path d="M9 12l2 2 4-4M12 3l7 4v5c0 4.4-3 8.5-7 9.6C8 20.5 5 16.4 5 12V7l7-4z" />,
  uang: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />,
  berita: <path d="M4 5h16v14H4zM8 9h8M8 13h8M8 17h5" />,
  kalender: <path d="M3 6h18v15H3zM8 3v5M16 3v5M3 11h18" />,
  megafon: <path d="M3 11v2a1 1 0 001 1h2l4 4V6L6 10H4a1 1 0 00-1 1zM16 9a4 4 0 010 6" />,
  foto: <path d="M3 5h18v14H3zM8.5 11a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 16l-5-5-9 8" />,
  warga: <path d="M16 20v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 10a4 4 0 100-8 4 4 0 000 8zM22 20v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8" />,
  pengurus: <path d="M12 3l8 4v6c0 4-3.5 7.5-8 8-4.5-.5-8-4-8-8V7l8-4z" />,
  pengaturan: <path d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1A1.7 1.7 0 008.9 19a1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1A1.7 1.7 0 004.6 8.9a1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />,
};

export default function Sidebar({
  menu,
  nama,
  peran,
  lingkup,
}: {
  menu: ItemMenu[];
  nama: string;
  peran: string;
  lingkup: string;
}) {
  const path = usePathname();
  const [laci, setLaci] = useState({ buka: false, path });

  // Menutup laci navigasi ketika berpindah halaman
  if (laci.path !== path) setLaci({ buka: false, path });
  const buka = laci.buka;
  const setBuka = (nilai: boolean) => setLaci({ buka: nilai, path });

  const aktif = (href: string) =>
    href === "/admin" ? path === "/admin" : path.startsWith(href);

  const isi = (
    <>
      <div className="flex items-center gap-3 px-2 pb-6">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-xs font-extrabold text-white">
          RW
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">Panel Pengurus</p>
          <p className="truncate text-[11px] text-brand-200">{lingkup}</p>
        </div>
      </div>

      <nav className="space-y-1">
        {menu.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              aktif(m.href)
                ? "bg-white/15 text-white"
                : "text-brand-200 hover:bg-white/10 hover:text-white"
            }`}
          >
            <svg
              aria-hidden
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {IKON[m.ikon] ?? IKON.dasbor}
            </svg>
            <span className="flex-1">{m.label}</span>
            {m.lencana ? (
              <span className="rounded-full bg-aksen-400 px-2 py-0.5 text-[10px] font-bold text-aksen-800">
                {m.lencana}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>

      <div className="mt-8 rounded-xl bg-white/10 p-3">
        <p className="truncate text-sm font-semibold text-white">{nama}</p>
        <p className="mt-0.5 text-[11px] text-brand-200">{peran}</p>
        <Link
          href="/"
          className="mt-3 block rounded-lg bg-white/10 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-white/20"
        >
          Lihat situs warga
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Bilah atas seluler */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setBuka(true)}
          aria-label="Buka menu"
          className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <p className="text-sm font-bold text-slate-900">Panel Pengurus</p>
      </div>

      {buka && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 lg:hidden"
          onClick={() => setBuka(false)}
          role="presentation"
        >
          <aside
            className="h-full w-72 overflow-y-auto bg-brand-900 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {isi}
          </aside>
        </div>
      )}

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto bg-brand-900 p-4 lg:block">
        {isi}
      </aside>
    </>
  );
}
