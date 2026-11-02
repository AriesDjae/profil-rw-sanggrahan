// Uji aturan di basis data: CHECK, trigger, dan perpindahan status serentak.
//
// Uji ini menulis langsung ke basis data, jadi hanya mau berjalan di localhost:
//   DATABASE_URL=postgresql://.../localhost:... npm run uji:integritas
import { PrismaClient } from "@prisma/client";

import { pindahStatusLaporan } from "../src/lib/alurLaporan";

const alamat = new URL(process.env.DATABASE_URL ?? "postgresql://kosong");
if (!["localhost", "127.0.0.1"].includes(alamat.hostname)) {
  console.error(`Dibatalkan: DATABASE_URL mengarah ke ${alamat.hostname}, bukan localhost.`);
  process.exit(1);
}

const db = new PrismaClient();

let gagal = 0;
const cek = (nama: string, kondisi: boolean, catatan = "") => {
  console.log(`${kondisi ? "LULUS" : "GAGAL"}  ${nama}${catatan ? ` — ${catatan}` : ""}`);
  if (!kondisi) gagal++;
};

async function ditolak(nama: string, aksi: () => Promise<unknown>) {
  try {
    await aksi();
    cek(nama, false, "seharusnya ditolak basis data");
  } catch {
    cek(nama, true);
  }
}

const rt = await db.rt.findFirstOrThrow({ orderBy: { id: "asc" } });
const pengguna = await db.user.findFirstOrThrow({ where: { peran: "ADMIN" } });

// Tahun 2099 tidak dipakai seed, jadi laporan uji tidak bertabrakan dengannya.
const buatLaporan = (bulan: number) =>
  db.laporanKeuangan.create({
    data: {
      judul: `Uji integritas ${bulan}`,
      bulan,
      tahun: 2099,
      rtId: rt.id,
      transaksi: {
        create: {
          tanggal: new Date(),
          jenis: "PEMASUKAN",
          kategori: "Uji",
          keterangan: "Uji",
          jumlah: 1000,
        },
      },
    },
  });

await db.laporanKeuangan.deleteMany({ where: { tahun: 2099 } });

try {
  // ---------- Batasan nilai ----------
  const laporan = await buatLaporan(1);

  await ditolak("Status laporan di luar daftar", () =>
    db.laporanKeuangan.update({ where: { id: laporan.id }, data: { status: "PALSU" } }),
  );
  await ditolak("Bulan 13", () =>
    db.laporanKeuangan.update({ where: { id: laporan.id }, data: { bulan: 13 } }),
  );
  await ditolak("Disetujui tanpa waktu persetujuan", () =>
    db.laporanKeuangan.update({ where: { id: laporan.id }, data: { status: "DISETUJUI" } }),
  );
  await ditolak("Jumlah transaksi nol", () =>
    db.transaksi.create({
      data: {
        laporanId: laporan.id,
        tanggal: new Date(),
        jenis: "PEMASUKAN",
        kategori: "Uji",
        keterangan: "Uji",
        jumlah: 0,
      },
    }),
  );
  await ditolak("Peran pengguna di luar daftar", () =>
    db.user.update({ where: { id: pengguna.id }, data: { peran: "SUPER" } }),
  );

  // ---------- Perpindahan serentak ----------
  const hasil = await Promise.all(
    Array.from({ length: 10 }, () =>
      pindahStatusLaporan(db, {
        id: laporan.id,
        dari: ["DRAFT"],
        ke: "DIAJUKAN",
        aksi: "AJUKAN",
        olehId: pengguna.id,
      }),
    ),
  );
  cek("10 pengajuan serentak, hanya 1 yang berhasil", hasil.filter(Boolean).length === 1);

  const jejak = await db.riwayatPersetujuan.count({ where: { laporanId: laporan.id } });
  cek("Jejak audit tercatat tepat sekali", jejak === 1, `${jejak} baris`);

  // ---------- Transaksi dikunci selama proses ----------
  const transaksi = await db.transaksi.findFirstOrThrow({ where: { laporanId: laporan.id } });
  await ditolak("Tambah transaksi pada laporan yang diajukan", () =>
    db.transaksi.create({
      data: {
        laporanId: laporan.id,
        tanggal: new Date(),
        jenis: "PEMASUKAN",
        kategori: "Uji",
        keterangan: "Uji",
        jumlah: 500,
      },
    }),
  );
  await ditolak("Ubah jumlah transaksi pada laporan yang diajukan", () =>
    db.transaksi.update({ where: { id: transaksi.id }, data: { jumlah: 999_999 } }),
  );
  await ditolak("Hapus transaksi pada laporan yang diajukan", () =>
    db.transaksi.delete({ where: { id: transaksi.id } }),
  );

  // ---------- Status lama tidak bisa dipakai lagi ----------
  const salahTahap = await pindahStatusLaporan(db, {
    id: laporan.id,
    dari: ["DIVERIFIKASI_RT"],
    ke: "DISETUJUI",
    aksi: "SETUJUI_RW",
    olehId: pengguna.id,
    data: { persetujuanRwAt: new Date() },
  });
  cek("Persetujuan RW tidak bisa melompati verifikasi RT", salahTahap === false);

  // ---------- Syarat tambahan ----------
  const kosong = await db.laporanKeuangan.create({
    data: { judul: "Uji kosong", bulan: 2, tahun: 2099, rtId: rt.id },
  });
  const tanpaTransaksi = await pindahStatusLaporan(db, {
    id: kosong.id,
    dari: ["DRAFT"],
    ke: "DIAJUKAN",
    aksi: "AJUKAN",
    olehId: pengguna.id,
    syarat: { transaksi: { some: {} } },
  });
  cek("Laporan tanpa transaksi tidak bisa diajukan", tanpaTransaksi === false);

  // ---------- Jejak audit tidak bisa ditulis ulang ----------
  const riwayat = await db.riwayatPersetujuan.findFirstOrThrow({
    where: { laporanId: laporan.id },
  });
  await ditolak("Ubah catatan jejak audit", () =>
    db.riwayatPersetujuan.update({ where: { id: riwayat.id }, data: { catatan: "dipalsukan" } }),
  );
  await ditolak("Ganti pelaku jejak audit", () =>
    db.riwayatPersetujuan.update({
      where: { id: riwayat.id },
      data: { olehId: pengguna.id + 1 },
    }),
  );
  await db.riwayatPersetujuan.update({ where: { id: riwayat.id }, data: { olehId: null } });
  cek("Pelaku boleh kosong saat akunnya dihapus", true);

  // ---------- Arsip tidak ikut terhapus ----------
  await ditolak("Hapus RT yang masih punya laporan", () =>
    db.rt.delete({ where: { id: rt.id } }),
  );
} finally {
  // Penghapusan laporan membawa transaksinya lewat CASCADE, dan harus tetap lolos
  // trigger walau laporannya sudah berstatus DIAJUKAN.
  await db.laporanKeuangan.deleteMany({ where: { tahun: 2099 } });
  cek(
    "Laporan beserta transaksinya bisa dibersihkan",
    (await db.laporanKeuangan.count({ where: { tahun: 2099 } })) === 0,
  );
  await db.$disconnect();
}

console.log(gagal === 0 ? "\nSemua uji integritas lulus." : `\n${gagal} uji gagal.`);
process.exitCode = gagal === 0 ? 0 : 1;
