import { z } from "zod";

import {
  SkemaHalaman,
  SkemaRw,
  aman,
  bacaKueri,
  cariRw,
  jawab,
  metaHalaman,
  rwTidakAda,
} from "@/lib/api";
import { db } from "@/lib/db";
import { saringKontenRw } from "@/lib/rw";

const Skema = SkemaHalaman.extend(SkemaRw.shape).extend({
  waktu: z.enum(["mendatang", "semua"]).default("semua"),
});

/** Kegiatan yang tampil di situs: terbit dan yang sudah selesai (arsip). */
export const GET = aman(async (permintaan: Request) => {
  const { data: kueri, jawaban } = bacaKueri(Skema, permintaan);
  if (!kueri) return jawaban;

  const rw = await cariRw(kueri.rw);
  if (!rw) return rwTidakAda();

  const { halaman, per_halaman: perHalaman, waktu } = kueri;
  const mendatang = waktu === "mendatang";

  const where = {
    status: mendatang ? "TERBIT" : { in: ["TERBIT", "SELESAI"] },
    ...(mendatang ? { mulai: { gte: new Date() } } : {}),
    ...saringKontenRw(rw.rwId),
  };

  const [daftar, total] = await Promise.all([
    db.kegiatan.findMany({
      where,
      orderBy: { mulai: mendatang ? "asc" : "desc" },
      take: perHalaman,
      skip: (halaman - 1) * perHalaman,
      select: {
        slug: true,
        judul: true,
        deskripsi: true,
        mulai: true,
        selesai: true,
        lokasi: true,
        kategori: true,
        penyelenggara: true,
        status: true,
        rw: { select: { nomor: true, nama: true } },
      },
    }),
    db.kegiatan.count({ where }),
  ]);

  return jawab(daftar, metaHalaman(halaman, perHalaman, total));
});
