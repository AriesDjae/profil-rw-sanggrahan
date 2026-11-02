import Link from "next/link";

import type { RwRingkas } from "@/lib/rw";

const WARNA_BILAH = ["bg-brand-700", "bg-soga-700", "bg-daun"];
const MIRING = ["lg:-rotate-1", "lg:rotate-[0.8deg]", "lg:-rotate-[0.6deg]"];

/**
 * Pilihan RW berupa papan penunjuk jalan, seperti yang berdiri di mulut gang
 * kampung. Warga memang mencari wilayahnya dengan cara itu.
 *
 * Tautannya sendiri tidak dipotong, hanya bilah di dalamnya, supaya penanda fokus
 * papan ketik tetap tergambar utuh.
 */
export default function PapanArah({ daftar }: { daftar: RwRingkas[] }) {
  return (
    <nav aria-label="Masuk ke laman RW" className="papan-arah">
      <ul className="relative flex flex-col gap-2.5 lg:gap-3">
        {daftar.map((rw, i) => (
          <li key={rw.id} className={`${MIRING[i % MIRING.length]}`}>
            <Link href={`/rw/${rw.nomor}`} className="block">
              <span
                className={`bilah-arah flex min-h-16 flex-col justify-center py-2.5 pr-8 pl-5 text-white ${
                  WARNA_BILAH[i % WARNA_BILAH.length]
                }`}
              >
                <span className="judul text-[1.3rem] leading-tight">{rw.nama}</span>
                <span className="mt-0.5 truncate text-[13px] text-white/85">
                  {rw.tagline || "Buka laman RW ini"}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
