import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { tanggal } from "@/lib/format";

export const dynamic = "force-dynamic";

async function ambilAlbum(slug: string) {
  return db.album.findUnique({
    where: { slug },
    include: { foto: { orderBy: { urutan: "asc" } } },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const album = await ambilAlbum(slug);
  return { title: album ? album.nama : "Album tidak ditemukan" };
}

export default async function DetailAlbum({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const album = await ambilAlbum(slug);
  if (!album) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500" aria-label="Remah roti">
        <Link href="/" className="hover:text-brand-700">
          Beranda
        </Link>
        <span aria-hidden>/</span>
        <Link href="/galeri" className="hover:text-brand-700">
          Galeri
        </Link>
        <span aria-hidden>/</span>
        <span className="truncate text-slate-700">{album.nama}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {album.nama}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {tanggal(album.tanggal)} · {album.foto.length} foto
        </p>
        {album.deskripsi && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
            {album.deskripsi}
          </p>
        )}
      </header>

      <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
        {album.foto.map((f) => (
          <a
            key={f.id}
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 block overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            <img
              src={f.url}
              alt={f.judul ?? album.nama}
              loading="lazy"
              className="w-full transition duration-500 hover:scale-105"
            />
            {f.judul && <p className="px-3 py-2 text-xs text-slate-600">{f.judul}</p>}
          </a>
        ))}
      </div>
    </div>
  );
}
