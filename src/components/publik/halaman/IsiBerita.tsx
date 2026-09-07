import Link from "next/link";

import KartuBerita from "@/components/publik/KartuBerita";
import JudulBagian from "@/components/ui/JudulBagian";
import Kosong from "@/components/ui/Kosong";
import { db } from "@/lib/db";
import { STATUS_KONTEN } from "@/lib/konstanta";
import { saringKontenRw } from "@/lib/rw";

import type { Lingkup } from "./lingkup";

const PER_HALAMAN = 9;

/**
 * Daftar berita — dipakai `/berita` (ketiga RW) dan `/rw/[n]/berita`.
 *
 * Di laman RW, berita tingkat kampung ikut tampil: kabar yang menyangkut
 * seluruh kampung juga menyangkut warga RW ini. Label RW hanya dipasang pada
 * daftar kampung, tempat pembaca memang perlu tahu asalnya.
 */
export default async function IsiBerita({
  lingkup,
  kategori,
  halaman,
}: {
  lingkup: Lingkup;
  kategori?: string;
  halaman: number;
}) {
  const rwId = lingkup.rw?.id ?? null;
  const saringDasar = { status: STATUS_KONTEN.TERBIT, ...saringKontenRw(rwId) };
  const where = { ...saringDasar, ...(kategori ? { kategori } : {}) };

  const [berita, total, kategoriTersedia] = await Promise.all([
    db.berita.findMany({
      where,
      orderBy: { terbitAt: "desc" },
      skip: (halaman - 1) * PER_HALAMAN,
      take: PER_HALAMAN,
      select: {
        slug: true,
        judul: true,
        ringkasan: true,
        kategori: true,
        gambar: true,
        terbitAt: true,
        rw: { select: { nomor: true, nama: true } },
      },
    }),
    db.berita.count({ where }),
    db.berita.groupBy({
      by: ["kategori"],
      where: saringDasar,
      _count: { kategori: true },
    }),
  ]);

  const totalHalaman = Math.max(1, Math.ceil(total / PER_HALAMAN));
  const dasar = `${lingkup.basis}/berita`;
  const semua = kategoriTersedia.reduce((a, k) => a + k._count.kategori, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <JudulBagian
        kicker="Kabar Warga"
        judul={`Berita ${lingkup.nama}`}
        tingkat="h1"
        keterangan={
          lingkup.rw
            ? `Kabar resmi dari pengurus ${lingkup.nama}, ditambah kabar yang berlaku untuk seluruh kampung. Terbaru lebih dulu.`
            : "Seluruh kabar resmi dari ketiga RW, terbaru lebih dulu. Nama RW tertera pada tiap kabar."
        }
      />

      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href={dasar}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            !kategori
              ? "bg-brand-600 text-white"
              : "border border-garis bg-white text-slate-600 hover:border-brand-200"
          }`}
        >
          Semua ({semua})
        </Link>
        {kategoriTersedia
          .sort((a, b) => b._count.kategori - a._count.kategori)
          .map((k) => (
            <Link
              key={k.kategori}
              href={`${dasar}?kategori=${encodeURIComponent(k.kategori)}`}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                kategori === k.kategori
                  ? "bg-brand-600 text-white"
                  : "border border-garis bg-white text-slate-600 hover:border-brand-200"
              }`}
            >
              {k.kategori} ({k._count.kategori})
            </Link>
          ))}
      </div>

      {berita.length === 0 ? (
        <Kosong
          judul={
            kategori
              ? "Belum ada berita pada kategori ini"
              : `Belum ada berita dari ${lingkup.nama}`
          }
          keterangan="Coba pilih kategori lain atau kembali lagi nanti."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {berita.map((b) => (
            <KartuBerita key={b.slug} berita={b} tampilkanRw={!lingkup.rw} />
          ))}
        </div>
      )}

      {totalHalaman > 1 && (
        <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Navigasi halaman">
          {Array.from({ length: totalHalaman }, (_, i) => i + 1).map((h) => {
            const query = new URLSearchParams();
            if (kategori) query.set("kategori", kategori);
            if (h > 1) query.set("halaman", String(h));
            const qs = query.toString();
            return (
              <Link
                key={h}
                href={`${dasar}${qs ? `?${qs}` : ""}`}
                aria-current={h === halaman ? "page" : undefined}
                className={`grid h-10 w-10 place-items-center rounded-lg text-sm font-semibold transition ${
                  h === halaman
                    ? "bg-brand-600 text-white"
                    : "border border-garis bg-white text-slate-600 hover:border-brand-300"
                }`}
              >
                {h}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
