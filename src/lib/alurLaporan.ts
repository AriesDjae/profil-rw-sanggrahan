import type { Prisma, PrismaClient } from "@prisma/client";

import { STATUS_LAPORAN, type StatusLaporan } from "./konstanta";

/** Tahap ketika bendahara masih boleh mengubah isi laporan. */
export const STATUS_DAPAT_DISUNTING: StatusLaporan[] = [
  STATUS_LAPORAN.DRAFT,
  STATUS_LAPORAN.DITOLAK,
];

type Perpindahan = {
  id: number;
  /** Status yang dianggap sah sebagai titik berangkat. */
  dari: StatusLaporan[];
  ke: StatusLaporan;
  aksi: string;
  olehId: number;
  catatan?: string | null;
  /** Kolom lain yang ikut berubah, mis. siapa yang memverifikasi. */
  data?: Prisma.LaporanKeuanganUncheckedUpdateManyInput;
  /** Syarat tambahan, diperiksa bersamaan dengan statusnya. */
  syarat?: Prisma.LaporanKeuanganWhereInput;
};

/**
 * Memindahkan status laporan dan mencatat jejak auditnya sebagai satu kesatuan.
 *
 * Status diperiksa di dalam UPDATE, bukan dibaca lebih dulu lalu ditulis. Bila
 * dua pengurus menekan tombol bersamaan, hanya satu yang mengenai baris dan
 * yang lain menerima `false`. Status dan riwayat memakai satu transaksi, jadi
 * tidak mungkin ada perpindahan tanpa jejak.
 *
 * Klien Prisma diterima sebagai argumen supaya fungsi ini bisa diuji langsung
 * terhadap basis data, di luar lingkungan Next.js.
 */
export function pindahStatusLaporan(
  klien: PrismaClient,
  { id, dari, ke, aksi, olehId, catatan, data, syarat }: Perpindahan,
): Promise<boolean> {
  return klien.$transaction(async (tx) => {
    const { count } = await tx.laporanKeuangan.updateMany({
      where: { id, status: { in: dari }, ...syarat },
      data: { ...data, status: ke },
    });
    if (count === 0) return false;

    await tx.riwayatPersetujuan.create({
      data: { laporanId: id, aksi, olehId, catatan: catatan?.trim() || null },
    });
    return true;
  });
}
