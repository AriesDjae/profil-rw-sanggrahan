import { z } from "zod";

import { aman, galat, jawab } from "@/lib/api";
import { db } from "@/lib/db";
import { hitungRingkasan } from "@/lib/keuangan";
import { STATUS_LAPORAN } from "@/lib/konstanta";

const SkemaId = z.coerce.number().int().min(1).max(2_147_483_647);

/**
 * Rincian satu laporan yang sudah disetujui. Laporan yang belum sah dijawab 404,
 * sama seperti yang tidak ada, supaya keberadaannya tidak terbaca dari luar.
 * Berkas bukti tidak disertakan karena bisa memuat data pribadi warga.
 */
export const GET = aman(
  async (_permintaan: Request, { params }: { params: Promise<{ id: string }> }) => {
    const id = SkemaId.safeParse((await params).id);
    if (!id.success) return galat(400, "ID_TIDAK_VALID", "Id laporan harus berupa angka.");

    const laporan = await db.laporanKeuangan.findFirst({
      where: { id: id.data, status: STATUS_LAPORAN.DISETUJUI },
      select: {
        id: true,
        judul: true,
        bulan: true,
        tahun: true,
        saldoAwal: true,
        persetujuanRwAt: true,
        rt: {
          select: { nomor: true, nama: true, rw: { select: { nomor: true, nama: true } } },
        },
        verifikasiRtOleh: { select: { nama: true } },
        persetujuanRwOleh: { select: { nama: true } },
        transaksi: {
          orderBy: { tanggal: "asc" },
          select: { tanggal: true, jenis: true, kategori: true, keterangan: true, jumlah: true },
        },
      },
    });

    if (!laporan) return galat(404, "LAPORAN_TIDAK_DITEMUKAN", "Laporan tidak ditemukan.");

    const { verifikasiRtOleh, persetujuanRwOleh, ...isi } = laporan;
    return jawab({
      ...isi,
      ...hitungRingkasan(laporan.transaksi, laporan.saldoAwal),
      diverifikasiOleh: verifikasiRtOleh?.nama ?? null,
      disetujuiOleh: persetujuanRwOleh?.nama ?? null,
    });
  },
);
