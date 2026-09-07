import "server-only";

import { db } from "./db";
import { STATUS_KONTEN, STATUS_LAPORAN } from "./konstanta";
import { saringKontenRw } from "./rw";

/**
 * Kueri halaman publik.
 *
 * Hampir semuanya menerima `rwId`. Artinya seragam di seluruh berkas ini:
 * **null berarti se-kampung** (halaman kampung yang menggabungkan ketiga RW),
 * sedangkan angka berarti laman satu RW — dan untuk konten, laman RW ikut
 * menampilkan tulisan tingkat kampung, karena tulisan itu memang ditujukan
 * kepada warganya juga.
 */

/** Berita yang sudah terbit, terbaru dulu. */
export function beritaTerbit(
  ambil = 6,
  lewati = 0,
  kategori?: string,
  rwId: number | null = null,
) {
  return db.berita.findMany({
    where: {
      status: STATUS_KONTEN.TERBIT,
      ...saringKontenRw(rwId),
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
      rw: { select: { nomor: true, nama: true } },
    },
  });
}

/** Kegiatan yang akan berlangsung (mulai hari ini ke depan). */
export function kegiatanMendatang(ambil = 5, rwId: number | null = null) {
  const awalHariIni = new Date();
  awalHariIni.setHours(0, 0, 0, 0);
  return db.kegiatan.findMany({
    where: {
      status: STATUS_KONTEN.TERBIT,
      mulai: { gte: awalHariIni },
      ...saringKontenRw(rwId),
    },
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
      rw: { select: { nomor: true, nama: true } },
    },
  });
}

/**
 * Pengumuman yang sedang berlaku.
 *
 * `rwId` angka  = milik RW itu ditambah yang bertingkat kampung.
 * `rwId` null   = seluruh pengumuman, dipakai panel dan halaman gabungan.
 * Untuk beranda kampung yang hanya boleh memuat pengumuman lintas RW, pakai
 * pengumumanKampung() di bawah — `null` di sini berarti "semua", bukan "kampung".
 */
export function pengumumanAktif(ambil = 4, rwId: number | null = null) {
  const kini = new Date();
  return db.pengumuman.findMany({
    where: {
      aktif: true,
      mulai: { lte: kini },
      // Dua syarat "atau" pada satu kueri harus digabung lewat AND, kalau tidak
      // yang belakangan menimpa yang duluan dan pengumuman kedaluwarsa ikut muncul.
      AND: [
        { OR: [{ berakhir: null }, { berakhir: { gte: kini } }] },
        rwId === null ? {} : { OR: [{ rwId }, { rwId: null }] },
      ],
    },
    include: { rw: { select: { nomor: true, nama: true } } },
    orderBy: [{ penting: "desc" }, { mulai: "desc" }],
    take: ambil,
  });
}

/** Hanya pengumuman tingkat kampung (rwId kosong), untuk beranda kampung. */
export function pengumumanKampung(ambil = 4) {
  const kini = new Date();
  return db.pengumuman.findMany({
    where: {
      aktif: true,
      rwId: null,
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
  /** Satu baris per RT. Pada lingkup se-kampung label menyebut RW-nya juga,
   *  karena nomor RT berulang di ketiga RW. */
  perRt: { rtId: number; label: string; nilai: number }[];
  kkPerRt: { rtId: number; label: string; nilai: number }[];
  usia: { kelompok: string; lakiLaki: number; perempuan: number }[];
  pekerjaan: { label: string; nilai: number }[];
  pendidikan: { label: string; nilai: number }[];
  agama: { label: string; nilai: number }[];
};

const KELOMPOK_USIA = ["0-5", "6-12", "13-17", "18-25", "26-40", "41-55", "56-65", "65+"];

type BarisStatistik = {
  total: { jiwa: number; laki: number; perempuan: number; kk: number };
  perRt: { rtid: number; nomor: string; rwnomor: number; jiwa: number; kk: number }[] | null;
  usia: { kelompok: string; laki: number; perempuan: number }[] | null;
  kategori: { jenis: string; label: string | null; n: number }[] | null;
};

/**
 * Agregasi kependudukan untuk halaman publik (tanpa data pribadi).
 *
 * Seluruhnya dikerjakan PostgreSQL dalam satu kali perjalanan. Basis data
 * berada di Singapura, sehingga tiap kueri terpisah menambah sekitar 40-60 ms
 * hanya untuk perjalanan bolak-balik. Menggabungkan enam agregasi menjadi satu
 * kueri jauh lebih hemat daripada menjalankannya paralel, sekaligus
 * menghindari penarikan seluruh baris warga ke aplikasi.
 */
export async function statistikWarga(
  rtId?: number,
  rwId?: number | null,
): Promise<StatistikWarga> {
  const saring = rtId ?? null;
  const saringRw = rwId ?? null;

  const [baris] = await db.$queryRaw<{ hasil: BarisStatistik }[]>`
    WITH dasar AS (
      SELECT w.* FROM "Warga" w
      JOIN "Rt" rt ON rt.id = w."rtId"
      WHERE (${saring}::int IS NULL OR w."rtId" = ${saring}::int)
        AND (${saringRw}::int IS NULL OR rt."rwId" = ${saringRw}::int)
    ),
    tot AS (
      SELECT COUNT(*)::int AS jiwa,
             COUNT(*) FILTER (WHERE "jenisKelamin" = 'L')::int AS laki,
             COUNT(*) FILTER (WHERE "jenisKelamin" = 'P')::int AS perempuan,
             COUNT(DISTINCT "noKk")::int AS kk
      FROM dasar
    ),
    perrt AS (
      -- Dikelompokkan menurut id RT, bukan nomornya. RT 01 ada di RW 1, 2, dan 3;
      -- mengelompokkan per nomor akan meleburkan ketiganya jadi satu baris.
      SELECT r.id AS rtid, r.nomor, w.nomor AS rwnomor,
             COUNT(*)::int AS jiwa, COUNT(DISTINCT d."noKk")::int AS kk
      FROM dasar d
      JOIN "Rt" r ON r.id = d."rtId"
      JOIN "Rw" w ON w.id = r."rwId"
      GROUP BY r.id, r.nomor, w.nomor
      ORDER BY w.nomor, r.nomor
    ),
    umur AS (
      SELECT "jenisKelamin", CASE
        WHEN u <= 5 THEN '0-5' WHEN u <= 12 THEN '6-12' WHEN u <= 17 THEN '13-17'
        WHEN u <= 25 THEN '18-25' WHEN u <= 40 THEN '26-40' WHEN u <= 55 THEN '41-55'
        WHEN u <= 65 THEN '56-65' ELSE '65+' END AS kelompok
      FROM (
        SELECT "jenisKelamin", EXTRACT(YEAR FROM AGE(NOW(), "tanggalLahir"))::int AS u
        FROM dasar WHERE "tanggalLahir" IS NOT NULL
      ) a
    ),
    usia AS (
      SELECT kelompok,
             COUNT(*) FILTER (WHERE "jenisKelamin" = 'L')::int AS laki,
             COUNT(*) FILTER (WHERE "jenisKelamin" = 'P')::int AS perempuan
      FROM umur GROUP BY kelompok
    ),
    kategori AS (
      SELECT 'pekerjaan' AS jenis, pekerjaan AS label, COUNT(*)::int AS n
      FROM dasar WHERE pekerjaan IS NOT NULL GROUP BY pekerjaan
      UNION ALL
      SELECT 'pendidikan', pendidikan, COUNT(*)::int FROM dasar
      WHERE pendidikan IS NOT NULL GROUP BY pendidikan
      UNION ALL
      SELECT 'agama', agama, COUNT(*)::int FROM dasar
      WHERE agama IS NOT NULL GROUP BY agama
    )
    SELECT json_build_object(
      'total',    (SELECT row_to_json(t) FROM tot t),
      'perRt',    (SELECT json_agg(p) FROM perrt p),
      'usia',     (SELECT json_agg(u) FROM usia u),
      'kategori', (SELECT json_agg(k) FROM kategori k)
    ) AS hasil`;

  const h = baris?.hasil;
  const total = h?.total ?? { jiwa: 0, laki: 0, perempuan: 0, kk: 0 };
  const perRt = h?.perRt ?? [];
  const kategori = h?.kategori ?? [];

  const petaUsia = new Map((h?.usia ?? []).map((u) => [u.kelompok, u]));
  const usia = KELOMPOK_USIA.map((k) => ({
    kelompok: k,
    lakiLaki: petaUsia.get(k)?.laki ?? 0,
    perempuan: petaUsia.get(k)?.perempuan ?? 0,
  }));

  const ambil = (jenis: string) =>
    kategori
      .filter((k) => k.jenis === jenis && k.label)
      .map((k) => ({ label: k.label as string, nilai: k.n }));

  // Di lingkup satu RW nomor RT sudah cukup; se-kampung tidak, jadi RW-nya
  // ikut ditulis supaya tiga batang "RT 01" bisa dibedakan.
  const labelRt = (r: { nomor: string; rwnomor: number }) =>
    saringRw === null && saring === null
      ? `RT ${r.nomor} · RW ${String(r.rwnomor).padStart(2, "0")}`
      : `RT ${r.nomor}`;

  return {
    totalJiwa: total.jiwa,
    lakiLaki: total.laki,
    perempuan: total.perempuan,
    totalKk: total.kk,
    perRt: perRt.map((r) => ({ rtId: r.rtid, label: labelRt(r), nilai: r.jiwa })),
    kkPerRt: perRt.map((r) => ({ rtId: r.rtid, label: labelRt(r), nilai: r.kk })),
    usia,
    pekerjaan: ambil("pekerjaan"),
    pendidikan: ambil("pendidikan"),
    agama: ambil("agama"),
  };
}

export type RingkasanLaporan = {
  id: number;
  judul: string;
  bulan: number;
  tahun: number;
  rt: { id: number; nomor: string; nama: string };
  rw: { id: number; nomor: number; nama: string };
  saldoAwal: number;
  pemasukan: number;
  pengeluaran: number;
  saldoAkhir: number;
  disetujuiOleh: string | null;
  diverifikasiOleh: string | null;
  persetujuanRwAt: Date | null;
};

/**
 * Laporan yang sudah disetujui berjenjang, lengkap dengan total pemasukan dan
 * pengeluarannya. Penjumlahan transaksi dikerjakan PostgreSQL, sehingga baris
 * transaksi tidak perlu ditarik seluruhnya ke aplikasi hanya untuk dijumlahkan.
 */
export async function ringkasanLaporanPublik(opsi?: {
  rtId?: number;
  tahun?: number;
  rwId?: number | null;
}): Promise<RingkasanLaporan[]> {
  const baris = await db.$queryRaw<
    {
      id: number;
      judul: string;
      bulan: number;
      tahun: number;
      rtid: number;
      nomor: string;
      namart: string;
      rwid: number;
      rwnomor: number;
      rwnama: string;
      saldoawal: number;
      pemasukan: number;
      pengeluaran: number;
      disetujuioleh: string | null;
      diverifikasioleh: string | null;
      persetujuanrwat: Date | null;
    }[]
  >`
    SELECT l.id, l.judul, l.bulan, l.tahun,
           r.id AS rtid, r.nomor, r.nama AS namart,
           w.id AS rwid, w.nomor AS rwnomor, w.nama AS rwnama,
           l."saldoAwal" AS saldoawal,
           COALESCE(SUM(t.jumlah) FILTER (WHERE t.jenis = 'PEMASUKAN'), 0)::int AS pemasukan,
           COALESCE(SUM(t.jumlah) FILTER (WHERE t.jenis = 'PENGELUARAN'), 0)::int AS pengeluaran,
           urw.nama AS disetujuioleh,
           urt.nama AS diverifikasioleh,
           l."persetujuanRwAt" AS persetujuanrwat
    FROM "LaporanKeuangan" l
    JOIN "Rt" r ON r.id = l."rtId"
    JOIN "Rw" w ON w.id = r."rwId"
    LEFT JOIN "Transaksi" t ON t."laporanId" = l.id
    LEFT JOIN "User" urw ON urw.id = l."persetujuanRwOlehId"
    LEFT JOIN "User" urt ON urt.id = l."verifikasiRtOlehId"
    WHERE l.status = ${STATUS_LAPORAN.DISETUJUI}
      AND (${opsi?.rtId ?? null}::int IS NULL OR l."rtId" = ${opsi?.rtId ?? null}::int)
      AND (${opsi?.tahun ?? null}::int IS NULL OR l.tahun = ${opsi?.tahun ?? null}::int)
      AND (${opsi?.rwId ?? null}::int IS NULL OR r."rwId" = ${opsi?.rwId ?? null}::int)
    GROUP BY l.id, r.id, w.id, urw.nama, urt.nama
    ORDER BY l.tahun DESC, l.bulan DESC, w.nomor ASC, r.nomor ASC`;

  return baris.map((b) => ({
    id: b.id,
    judul: b.judul,
    bulan: b.bulan,
    tahun: b.tahun,
    rt: { id: b.rtid, nomor: b.nomor, nama: b.namart },
    rw: { id: b.rwid, nomor: b.rwnomor, nama: b.rwnama },
    saldoAwal: b.saldoawal,
    pemasukan: b.pemasukan,
    pengeluaran: b.pengeluaran,
    saldoAkhir: b.saldoawal + b.pemasukan - b.pengeluaran,
    disetujuiOleh: b.disetujuioleh,
    diverifikasiOleh: b.diverifikasioleh,
    persetujuanRwAt: b.persetujuanrwat,
  }));
}

/** Total kas seluruh RT untuk satu tahun, berdasarkan laporan yang telah disetujui. */
export async function rekapKeuanganTahun(tahun: number, rwId: number | null = null) {
  const ringkas = await ringkasanLaporanPublik({ tahun, rwId });

  const perBulan = new Map<number, { pemasukan: number; pengeluaran: number }>();
  for (const r of ringkas) {
    const s = perBulan.get(r.bulan) ?? { pemasukan: 0, pengeluaran: 0 };
    s.pemasukan += r.pemasukan;
    s.pengeluaran += r.pengeluaran;
    perBulan.set(r.bulan, s);
  }

  // Saldo akhir per RT diambil dari laporan terbaru masing-masing RT.
  // Kuncinya wajib menyebut RW: "RT 01" ada di ketiga RW, jadi tanpa itu saldo
  // tiga RT yang berbeda akan saling menimpa.
  const saldoPerRt = new Map<string, number>();
  for (const r of ringkas) {
    const kunci = rwId === null ? `RT ${r.rt.nomor} · ${r.rw.nama}` : `RT ${r.rt.nomor}`;
    if (!saldoPerRt.has(kunci)) saldoPerRt.set(kunci, r.saldoAkhir);
  }

  return {
    ringkas,
    totalPemasukan: ringkas.reduce((a, r) => a + r.pemasukan, 0),
    totalPengeluaran: ringkas.reduce((a, r) => a + r.pengeluaran, 0),
    totalSaldo: [...saldoPerRt.values()].reduce((a, b) => a + b, 0),
    perBulan: [...perBulan.entries()].sort((a, b) => a[0] - b[0]),
    perRt: [...saldoPerRt.entries()].sort((a, b) => a[0].localeCompare(b[0])),
    jumlahLaporan: ringkas.length,
  };
}

/** RT dalam satu RW, atau seluruh RT se-kampung bila rwId null. */
export function daftarRt(rwId: number | null = null) {
  return db.rt.findMany({
    where: rwId === null ? {} : { rwId },
    orderBy: [{ rwId: "asc" }, { nomor: "asc" }],
    include: { rw: { select: { id: true, nomor: true, nama: true } } },
  });
}
