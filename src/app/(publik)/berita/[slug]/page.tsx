import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import CatatDilihat from "@/components/publik/CatatDilihat";
import KartuBerita from "@/components/publik/KartuBerita";
import { IkonPanahKiri } from "@/components/ui/Ikon";
import Paragraf from "@/components/ui/Paragraf";
import { db } from "@/lib/db";
import { potong, tanggal } from "@/lib/format";
import { STATUS_KONTEN } from "@/lib/konstanta";

// Dirender sekali lalu disajikan dari cache. Setiap perubahan dari panel
// pengurus memanggil revalidatePath, jadi halaman ini tetap segar seketika;
// angka 600 detik hanya jaring pengaman bila ada perubahan di luar aplikasi.
export const revalidate = 600;

/**
 * Menyiapkan seluruh halaman ini saat build sehingga pembaca menerimanya dari
 * cache, bukan menunggu kueri basis data. Halaman baru yang belum ada saat
 * build tetap dilayani dan ikut tersimpan setelah permintaan pertama.
 */
export async function generateStaticParams() {
  const berita = await db.berita.findMany({
    where: { status: STATUS_KONTEN.TERBIT },
    select: { slug: true },
    orderBy: { terbitAt: "desc" },
    take: 100,
  });
  return berita.map((b) => ({ slug: b.slug }));
}

async function ambilBerita(slug: string) {
  return db.berita.findFirst({
    where: { slug, status: STATUS_KONTEN.TERBIT },
    include: {
      penulis: { select: { nama: true, jabatan: true } },
      rw: { select: { nomor: true, nama: true } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const berita = await ambilBerita(slug);
  if (!berita) return { title: "Berita tidak ditemukan" };
  return {
    title: berita.judul,
    description: potong(berita.ringkasan, 155),
  };
}

export default async function DetailBerita({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const berita = await ambilBerita(slug);
  if (!berita) notFound();

  const terkait = await db.berita.findMany({
    where: {
      status: STATUS_KONTEN.TERBIT,
      kategori: berita.kategori,
      NOT: { id: berita.id },
    },
    orderBy: { terbitAt: "desc" },
    take: 3,
    select: {
      slug: true,
      judul: true,
      ringkasan: true,
      kategori: true,
      gambar: true,
      terbitAt: true,
    },
  });

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500" aria-label="Remah roti">
        <Link href="/" className="hover:text-brand-700">
          Beranda
        </Link>
        <span aria-hidden>/</span>
        <Link href="/berita" className="hover:text-brand-700">
          Berita
        </Link>
        <span aria-hidden>/</span>
        <span className="truncate text-slate-700">{berita.judul}</span>
      </nav>

      <CatatDilihat slug={berita.slug} />

      <div className="flex flex-wrap items-center gap-2">
        {/* Dari RW mana kabar ini datang. Tautannya membawa pembaca masuk ke
            laman RW itu, bukan sekadar memberitahunya. */}
        {berita.rw ? (
          <Link
            href={`/rw/${berita.rw.nomor}`}
            className="inline-flex rounded-full bg-brand-700 px-3 py-1 text-xs font-semibold text-white transition hover:bg-brand-800"
          >
            {berita.rw.nama}
          </Link>
        ) : (
          <span className="inline-flex rounded-full bg-aksen-100 px-3 py-1 text-xs font-semibold text-aksen-800">
            Seluruh kampung
          </span>
        )}
        <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          {berita.kategori}
        </span>
      </div>

      <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
        {berita.judul}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
        <span>{tanggal(berita.terbitAt)}</span>
        {berita.penulis && (
          <span>
            Oleh <span className="font-medium text-slate-700">{berita.penulis.nama}</span>
            {berita.penulis.jabatan ? ` (${berita.penulis.jabatan})` : ""}
          </span>
        )}
        <span>{berita.dilihat} kali dibaca</span>
      </div>

      {berita.gambar && (
        <img
          src={berita.gambar}
          alt=""
          className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover shadow-sm"
        />
      )}

      <p className="mt-8 border-l-4 border-brand-300 bg-brand-50/60 py-3 pl-4 text-base font-medium leading-relaxed text-brand-900">
        {berita.ringkasan}
      </p>

      <div className="mt-8">
        <Paragraf teks={berita.konten} />
      </div>

      <div className="mt-12 border-t border-garis pt-8">
        <Link
          href="/berita"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          <IkonPanahKiri ukuran={15} />
          Kembali ke daftar berita
        </Link>
      </div>

      {terkait.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 text-lg font-bold text-slate-900">Berita lain seputar {berita.kategori}</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {terkait.map((b) => (
              <KartuBerita key={b.slug} berita={b} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
