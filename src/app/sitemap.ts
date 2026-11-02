import type { MetadataRoute } from "next";

import { db } from "@/lib/db";
import { STATUS_KONTEN, STATUS_LAPORAN } from "@/lib/konstanta";
import { daftarRw, tautanRw } from "@/lib/rw";
import { URL_SITUS } from "@/lib/situs";

// Tulisan baru cukup masuk peta situs dalam satu jam; mesin pencari sendiri
// tidak membacanya lebih sering dari itu.
export const revalidate = 3600;

const HALAMAN = ["", "/profil", "/berita", "/kegiatan", "/keuangan", "/data-warga", "/galeri"];

/** Hanya isi yang memang terbuka untuk warga. Draf dan laporan berproses tidak ikut. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [rw, berita, kegiatan, album, laporan] = await Promise.all([
    daftarRw(),
    db.berita.findMany({
      where: { status: STATUS_KONTEN.TERBIT },
      select: { slug: true, updatedAt: true },
    }),
    db.kegiatan.findMany({
      where: { status: { in: ["TERBIT", "SELESAI"] } },
      select: { slug: true, updatedAt: true },
    }),
    db.album.findMany({ select: { slug: true, updatedAt: true } }),
    db.laporanKeuangan.findMany({
      where: { status: STATUS_LAPORAN.DISETUJUI },
      select: { id: true, updatedAt: true },
    }),
  ]);

  const alamat = (jalur: string, lastModified?: Date) => ({
    url: `${URL_SITUS}${jalur}`,
    lastModified,
  });

  return [
    ...HALAMAN.map((h) => alamat(h)),
    ...rw.flatMap((r) => HALAMAN.map((h) => alamat(tautanRw(r.nomor, h)))),
    ...berita.map((b) => alamat(`/berita/${b.slug}`, b.updatedAt)),
    ...kegiatan.map((k) => alamat(`/kegiatan/${k.slug}`, k.updatedAt)),
    ...album.map((a) => alamat(`/galeri/${a.slug}`, a.updatedAt)),
    ...laporan.map((l) => alamat(`/keuangan/${l.id}`, l.updatedAt)),
  ];
}
