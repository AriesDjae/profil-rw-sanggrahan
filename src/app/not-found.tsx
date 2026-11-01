import type { Metadata } from "next";
import Link from "next/link";

import TidakDitemukan from "@/components/ui/TidakDitemukan";

export const metadata: Metadata = { title: "Halaman tidak ditemukan" };

/**
 * 404 untuk alamat yang tidak cocok dengan rute mana pun. Halaman ini berada di
 * luar layout publik, jadi kopnya ditulis sendiri dan tidak menyentuh basis data:
 * alamat acak dari bot tidak boleh menghabiskan kueri.
 */
export default function HalamanTidakDitemukan() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-garis bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link href="/" className="flex min-h-10 items-center gap-3">
            <span
              aria-hidden
              className="grid h-10 w-10 shrink-0 place-items-center bg-brand-700 text-[13px] font-bold tracking-tight text-white"
            >
              RW
            </span>
            <span className="judul text-[15px] text-brand-900">Kampung Sanggrahan</span>
          </Link>
        </div>
      </header>
      <main id="konten" tabIndex={-1} className="flex-1">
        <TidakDitemukan />
      </main>
    </div>
  );
}
