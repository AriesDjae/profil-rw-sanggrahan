"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { IkonMenu, IkonMenuAdmin } from "@/components/ui/Ikon";

export type ItemMenu = {
  href: string;
  label: string;
  ikon: string;
  lencana?: number;
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
            <IkonMenuAdmin nama={m.ikon} ukuran={17} />
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
          <IkonMenu ukuran={18} />
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
