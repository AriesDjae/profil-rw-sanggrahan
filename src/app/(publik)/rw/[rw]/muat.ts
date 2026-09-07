import { notFound } from "next/navigation";

import { lingkupRwHalaman, type Lingkup } from "@/components/publik/halaman/lingkup";
import { ambilRw, bacaNomorRw } from "@/lib/rw";

/**
 * Menerjemahkan potongan alamat /rw/<x> menjadi lingkup halaman.
 *
 * Semua halaman di bawah folder ini memanggilnya lebih dulu, sehingga hanya ada
 * satu tempat yang memutuskan apa arti "RW tidak ditemukan" — dan RW yang
 * dinonaktifkan pengurus benar-benar hilang dari situs publik, bukan sekadar
 * lenyap dari menu.
 */
export async function muatLingkupRw(params: Promise<{ rw: string }>): Promise<Lingkup> {
  const { rw: segmen } = await params;
  const nomor = bacaNomorRw(segmen);
  if (nomor === null) notFound();

  const rw = await ambilRw(nomor);
  if (!rw || !rw.aktif) notFound();

  return lingkupRwHalaman({
    id: rw.id,
    nomor: rw.nomor,
    nama: rw.nama,
    slug: rw.slug,
    tagline: rw.tagline,
  });
}

/** Judul dan keterangan untuk metadata halaman RW. */
export async function judulRw(params: Promise<{ rw: string }>, bagian?: string) {
  const { rw: segmen } = await params;
  const nomor = bacaNomorRw(segmen);
  const rw = nomor === null ? null : await ambilRw(nomor);
  const nama = rw?.nama ?? `RW ${segmen}`;
  return bagian ? `${bagian} ${nama}` : nama;
}
