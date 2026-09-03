import "server-only";

import { db } from "./db";
import { umur } from "./format";
import { JENIS_TRANSAKSI, STATUS_KONTEN, STATUS_LAPORAN } from "./konstanta";

/** Berita yang sudah terbit, terbaru dulu. */
export function beritaTerbit(ambil = 6, lewati = 0, kategori?: string) {
  return db.berita.findMany({
    where: {
      status: STATUS_KONTEN.TERBIT,
      ...(kategori ? { kategori } : {}),
    },
    orderBy: { terbitAt: "desc" },
    take: ambil,
    skip: lewati,
    select: {
      id: true,
      slug: true,
      judul: true,
      ringkasan: true,
      kategori: true,
      gambar: true,
      terbitAt: true,
    },
  });
}

/** Kegiatan yang akan berlangsung (mulai hari ini ke depan). */
export function kegiatanMendatang(ambil = 5) {
  const awalHariIni = new Date();
  awalHariIni.setHours(0, 0, 0, 0);
  return db.kegiatan.findMany({
    where: { status: STATUS_KONTEN.TERBIT, mulai: { gte: awalHariIni } },
    orderBy: { mulai: "asc" },
    take: ambil,
    select: {
      id: true,
      slug: true,
      judul: true,
      deskripsi: true,
      mulai: true,
      selesai: true,
      lokasi: true,
      kategori: true,
      penyelenggara: true,
    },
  });
}

export function pengumumanAktif(ambil = 4) {
  const kini = new Date();
  return db.pengumuman.findMany({
    where: {
      aktif: true,
      mulai: { lte: kini },
      OR: [{ berakhir: null }, { berakhir: { gte: kini } }],
    },
    orderBy: [{ penting: "desc" }, { mulai: "desc" }],
    take: ambil,
  });
}

export type StatistikWarga = {
  totalJiwa: number;
  lakiLaki: number;
  perempuan: number;
  totalKk: number;
  perRt: { label: string; nilai: number }[];
  kkPerRt: { label: string; nilai: number }[];
  usia: { kelompok: string; lakiLaki: number; perempuan: number }[];
  pekerjaan: { label: string; nilai: number }[];
  pendidikan: { label: string; nilai: number }[];
  agama: { label: string; nilai: number }[];
};

const KELOMPOK_USIA = [
  { kelompok: "0-5", min: 0, max: 5 },
  { kelompok: "6-12", min: 6, max: 12 },
  { kelompok: "13-17", min: 13, max: 17 },
  { kelompok: "18-25", min: 18, max: 25 },
  { kelompok: "26-40", min: 26, max: 40 },
  { kelompok: "41-55", min: 41, max: 55 },
  { kelompok: "56-65", min: 56, max: 65 },
  { kelompok: "65+", min: 66, max: 200 },
];

/** Agregasi kependudukan untuk halaman publik (tanpa data pribadi). */
export async function statistikWarga(rtId?: number): Promise<StatistikWarga> {
  const warga = await db.warga.findMany({
    where: rtId ? { rtId } : undefined,
    select: {
      jenisKelamin: true,
      tanggalLahir: true,
      pekerjaan: true,
      pendidikan: true,
      agama: true,
      noKk: true,
      rt: { select: { nomor: true } },
    },
  });

  const hitung = (kunci: (w: (typeof warga)[number]) => string | null | undefined) => {
    const peta = new Map<string, number>();
    for (const w of warga) {
      const k = kunci(w);
      if (!k) continue;
      peta.set(k, (peta.get(k) ?? 0) + 1);
    }
    return [...peta.entries()].map(([label, nilai]) => ({ label, nilai }));
  };

  const usia = KELOMPOK_USIA.map((k) => ({ kelompok: k.kelompok, lakiLaki: 0, perempuan: 0 }));
  for (const w of warga) {
    const u = umur(w.tanggalLahir);
    if (u === null) continue;
    const idx = KELOMPOK_USIA.findIndex((k) => u >= k.min && u <= k.max);
    if (idx < 0) continue;
    if (w.jenisKelamin === "L") usia[idx].lakiLaki++;
    else usia[idx].perempuan++;
  }

  const kkPerRtPeta = new Map<string, Set<string>>();
  for (const w of warga) {
    const rt = w.rt?.nomor ?? "-";
    if (!kkPerRtPeta.has(rt)) kkPerRtPeta.set(rt, new Set());
    if (w.noKk) kkPerRtPeta.get(rt)!.add(w.noKk);
  }

  const semuaKk = new Set(warga.map((w) => w.noKk).filter(Boolean) as string[]);

  return {
    totalJiwa: warga.length,
    lakiLaki: warga.filter((w) => w.jenisKelamin === "L").length,
    perempuan: warga.filter((w) => w.jenisKelamin === "P").length,
    totalKk: semuaKk.size,
    perRt: hitung((w) => (w.rt ? `RT ${w.rt.nomor}` : null)).sort((a, b) =>
      a.label.localeCompare(b.label),
    ),
    kkPerRt: [...kkPerRtPeta.entries()]
      .map(([nomor, set]) => ({ label: `RT ${nomor}`, nilai: set.size }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    usia,
    pekerjaan: hitung((w) => w.pekerjaan),
    pendidikan: hitung((w) => w.pendidikan),
    agama: hitung((w) => w.agama),
  };
}

/** Laporan keuangan yang sudah disetujui berjenjang (tampil ke publik). */
export function laporanPublik(opsi?: { rtId?: number; tahun?: number; ambil?: number }) {
  return db.laporanKeuangan.findMany({
    where: {
      status: STATUS_LAPORAN.DISETUJUI,
      ...(opsi?.rtId ? { rtId: opsi.rtId } : {}),
      ...(opsi?.tahun ? { tahun: opsi.tahun } : {}),
    },
    orderBy: [{ tahun: "desc" }, { bulan: "desc" }, { rtId: "asc" }],
    take: opsi?.ambil,
    include: {
      rt: { select: { id: true, nomor: true, nama: true } },
      transaksi: { select: { jenis: true, jumlah: true } },
      persetujuanRwOleh: { select: { nama: true } },
      verifikasiRtOleh: { select: { nama: true } },
    },
  });
}

export type RingkasanLaporan = {
  id: number;
  judul: string;
  bulan: number;
  tahun: number;
  rt: { id: number; nomor: string; nama: string };
  saldoAwal: number;
  pemasukan: number;
  pengeluaran: number;
  saldoAkhir: number;
  disetujuiOleh: string | null;
  diverifikasiOleh: string | null;
  persetujuanRwAt: Date | null;
};

export function ringkasLaporan(
  laporan: Awaited<ReturnType<typeof laporanPublik>>,
): RingkasanLaporan[] {
  return laporan.map((l) => {
    const pemasukan = l.transaksi
      .filter((t) => t.jenis === JENIS_TRANSAKSI.PEMASUKAN)
      .reduce((a, t) => a + t.jumlah, 0);
    const pengeluaran = l.transaksi
      .filter((t) => t.jenis === JENIS_TRANSAKSI.PENGELUARAN)
      .reduce((a, t) => a + t.jumlah, 0);
    return {
      id: l.id,
      judul: l.judul,
      bulan: l.bulan,
      tahun: l.tahun,
      rt: l.rt,
      saldoAwal: l.saldoAwal,
      pemasukan,
      pengeluaran,
      saldoAkhir: l.saldoAwal + pemasukan - pengeluaran,
      disetujuiOleh: l.persetujuanRwOleh?.nama ?? null,
      diverifikasiOleh: l.verifikasiRtOleh?.nama ?? null,
      persetujuanRwAt: l.persetujuanRwAt,
    };
  });
}

/** Total kas seluruh RT untuk satu tahun, berdasarkan laporan yang telah disetujui. */
export async function rekapKeuanganTahun(tahun: number) {
  const laporan = await laporanPublik({ tahun });
  const ringkas = ringkasLaporan(laporan);

  const perBulan = new Map<number, { pemasukan: number; pengeluaran: number }>();
  for (const r of ringkas) {
    const s = perBulan.get(r.bulan) ?? { pemasukan: 0, pengeluaran: 0 };
    s.pemasukan += r.pemasukan;
    s.pengeluaran += r.pengeluaran;
    perBulan.set(r.bulan, s);
  }

  const perRt = new Map<string, { pemasukan: number; pengeluaran: number; saldo: number }>();
  for (const r of ringkas) {
    const kunci = `RT ${r.rt.nomor}`;
    const s = perRt.get(kunci) ?? { pemasukan: 0, pengeluaran: 0, saldo: 0 };
    s.pemasukan += r.pemasukan;
    s.pengeluaran += r.pengeluaran;
    perRt.set(kunci, s);
  }
  // Saldo akhir per RT diambil dari laporan terbaru masing-masing RT
  for (const r of ringkas) {
    const kunci = `RT ${r.rt.nomor}`;
    const s = perRt.get(kunci)!;
    if (s.saldo === 0) s.saldo = r.saldoAkhir; // ringkas sudah terurut terbaru dulu
  }

  return {
    ringkas,
    totalPemasukan: ringkas.reduce((a, r) => a + r.pemasukan, 0),
    totalPengeluaran: ringkas.reduce((a, r) => a + r.pengeluaran, 0),
    totalSaldo: [...perRt.values()].reduce((a, s) => a + s.saldo, 0),
    perBulan: [...perBulan.entries()].sort((a, b) => a[0] - b[0]),
    perRt: [...perRt.entries()].sort((a, b) => a[0].localeCompare(b[0])),
    jumlahLaporan: ringkas.length,
  };
}

export function daftarRt() {
  return db.rt.findMany({ orderBy: { nomor: "asc" } });
}
