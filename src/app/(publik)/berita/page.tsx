import type { Metadata } from "next";
import Link from "next/link";

import KartuBerita from "@/components/publik/KartuBerita";
import JudulBagian from "@/components/ui/JudulBagian";
import Kosong from "@/components/ui/Kosong";
import { db } from "@/lib/db";
import { STATUS_KONTEN } from "@/lib/konstanta";

export const metadata: Metadata = {
  title: "Berita",
  description: "Kabar dan informasi terbaru dari lingkungan RW 05 Sanggrahan.",
};

export const dynamic = "force-dynamic";

const PER_HALAMAN = 9;

export default async function HalamanBerita({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; halaman?: string }>;
}) {
  const sp = await searchParams;
  const halaman = Math.max(1, Number(sp.halaman ?? 1) || 1);
  const kategori = sp.kategori;

  const where = {
    status: STATUS_KONTEN.TERBIT,
    ...(kategori ? { kategori } : {}),
  };

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
      },
    }),
    db.berita.count({ where }),
    db.berita.groupBy({
      by: ["kategori"],
      where: { status: STATUS_KONTEN.TERBIT },
      _count: { kategori: true },
    }),
  ]);

  const totalHalaman = Math.max(1, Math.ceil(total / PER_HALAMAN));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <JudulBagian
        kicker="Kabar Warga"
        judul="Berita RW 05 Sanggrahan"
        tingkat="h1"
        keterangan="Seluruh kabar resmi yang dipublikasikan pengurus RW, terbaru lebih dulu."
      />

      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href="/berita"
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            !kategori
              ? "bg-brand-600 text-white"
              : "border border-slate-200 bg-white text-slate-600 hover:border-brand-200"
          }`}
        >
          Semua ({total === 0 && !kategori ? 0 : kategoriTersedia.reduce((a, k) => a + k._count.kategori, 0)})
        </Link>
        {kategoriTersedia
          .sort((a, b) => b._count.kategori - a._count.kategori)
          .map((k) => (
            <Link
              key={k.kategori}
              href={`/berita?kategori=${encodeURIComponent(k.kategori)}`}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                kategori === k.kategori
                  ? "bg-brand-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-brand-200"
              }`}
            >
              {k.kategori} ({k._count.kategori})
            </Link>
          ))}
      </div>

      {berita.length === 0 ? (
        <Kosong
          judul="Belum ada berita pada kategori ini"
          keterangan="Coba pilih kategori lain atau kembali lagi nanti."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {berita.map((b) => (
            <KartuBerita key={b.slug} berita={b} />
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
                href={`/berita${qs ? `?${qs}` : ""}`}
                aria-current={h === halaman ? "page" : undefined}
                className={`grid h-10 w-10 place-items-center rounded-lg text-sm font-semibold transition ${
                  h === halaman
                    ? "bg-brand-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-brand-300"
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
