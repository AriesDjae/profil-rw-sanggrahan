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
import { STATUS_KONTEN } from "@/lib/konstanta";
import { beritaTerbit } from "@/lib/kueri";
import { saringKontenRw } from "@/lib/rw";

const Skema = SkemaHalaman.extend(SkemaRw.shape).extend({
  kategori: z.string().trim().min(1).max(60).optional(),
});

/** Berita terbit. Saringan `rw` ikut menyertakan berita tingkat kampung. */
export const GET = aman(async (permintaan: Request) => {
  const { data: kueri, jawaban } = bacaKueri(Skema, permintaan);
  if (!kueri) return jawaban;

  const rw = await cariRw(kueri.rw);
  if (!rw) return rwTidakAda();

  const { halaman, per_halaman: perHalaman, kategori } = kueri;
  const [daftar, total] = await Promise.all([
    beritaTerbit(perHalaman, (halaman - 1) * perHalaman, kategori, rw.rwId),
    db.berita.count({
      where: {
        status: STATUS_KONTEN.TERBIT,
        ...saringKontenRw(rw.rwId),
        ...(kategori ? { kategori } : {}),
      },
    }),
  ]);

  return jawab(daftar, metaHalaman(halaman, perHalaman, total));
});
