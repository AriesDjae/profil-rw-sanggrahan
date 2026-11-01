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
import { STATUS_LAPORAN } from "@/lib/konstanta";
import { ringkasanLaporanPublik } from "@/lib/kueri";

const Skema = SkemaHalaman.extend(SkemaRw.shape).extend({
  tahun: z.coerce.number().int().min(2000).max(2100).optional(),
});

/** Ringkasan laporan kas yang sudah disetujui Ketua RW. */
export const GET = aman(async (permintaan: Request) => {
  const { data: kueri, jawaban } = bacaKueri(Skema, permintaan);
  if (!kueri) return jawaban;

  const rw = await cariRw(kueri.rw);
  if (!rw) return rwTidakAda();

  const { halaman, per_halaman: perHalaman, tahun } = kueri;
  const [daftar, total] = await Promise.all([
    ringkasanLaporanPublik({
      rwId: rw.rwId,
      tahun,
      ambil: perHalaman,
      lewati: (halaman - 1) * perHalaman,
    }),
    db.laporanKeuangan.count({
      where: {
        status: STATUS_LAPORAN.DISETUJUI,
        ...(tahun ? { tahun } : {}),
        ...(rw.rwId === null ? {} : { rt: { rwId: rw.rwId } }),
      },
    }),
  ]);

  return jawab(daftar, metaHalaman(halaman, perHalaman, total));
});
