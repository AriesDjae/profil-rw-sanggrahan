import { JENIS_TRANSAKSI, STATUS_LAPORAN, type StatusLaporan } from "./konstanta";

export type TransaksiRingkas = { jenis: string; jumlah: number };

export type RingkasanKas = {
  pemasukan: number;
  pengeluaran: number;
  saldoAkhir: number;
};

export function hitungRingkasan(
  transaksi: TransaksiRingkas[],
  saldoAwal = 0,
): RingkasanKas {
  let pemasukan = 0;
  let pengeluaran = 0;
  for (const t of transaksi) {
    if (t.jenis === JENIS_TRANSAKSI.PEMASUKAN) pemasukan += t.jumlah;
    else pengeluaran += t.jumlah;
  }
  return { pemasukan, pengeluaran, saldoAkhir: saldoAwal + pemasukan - pengeluaran };
}

/** Langkah berikutnya pada alur persetujuan berjenjang. */
export function tahapBerikutnya(status: StatusLaporan): string {
  switch (status) {
    case STATUS_LAPORAN.DRAFT:
      return "Bendahara RT perlu mengajukan laporan ini.";
    case STATUS_LAPORAN.DIAJUKAN:
      return "Menunggu verifikasi Ketua RT.";
    case STATUS_LAPORAN.DIVERIFIKASI_RT:
      return "Menunggu persetujuan Ketua RW.";
    case STATUS_LAPORAN.DISETUJUI:
      return "Laporan sudah disetujui dan tampil di halaman publik.";
    case STATUS_LAPORAN.DITOLAK:
      return "Laporan dikembalikan untuk direvisi bendahara.";
    default:
      return "";
  }
}

/** Urutan tahapan untuk komponen stepper. */
export const TAHAPAN = [
  { kunci: "DRAFT", label: "Disusun Bendahara" },
  { kunci: "DIAJUKAN", label: "Verifikasi Ketua RT" },
  { kunci: "DIVERIFIKASI_RT", label: "Persetujuan Ketua RW" },
  { kunci: "DISETUJUI", label: "Terbit ke Warga" },
] as const;

export function indeksTahap(status: StatusLaporan): number {
  const i = TAHAPAN.findIndex((t) => t.kunci === status);
  return i < 0 ? 0 : i;
}
