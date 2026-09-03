-- CreateTable
CREATE TABLE "Rt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nomor" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "wilayah" TEXT,
    "jumlahKk" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "peran" TEXT NOT NULL,
    "jabatan" TEXT,
    "telepon" TEXT,
    "foto" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "rtId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_rtId_fkey" FOREIGN KEY ("rtId") REFERENCES "Rt" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Berita" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "judul" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ringkasan" TEXT NOT NULL,
    "konten" TEXT NOT NULL,
    "gambar" TEXT,
    "kategori" TEXT NOT NULL DEFAULT 'Umum',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "terbitAt" DATETIME,
    "dilihat" INTEGER NOT NULL DEFAULT 0,
    "penulisId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Berita_penulisId_fkey" FOREIGN KEY ("penulisId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Kegiatan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "judul" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "mulai" DATETIME NOT NULL,
    "selesai" DATETIME,
    "lokasi" TEXT NOT NULL,
    "penyelenggara" TEXT,
    "kategori" TEXT NOT NULL DEFAULT 'Umum',
    "gambar" TEXT,
    "kontak" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "dibuatOlehId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Kegiatan_dibuatOlehId_fkey" FOREIGN KEY ("dibuatOlehId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pengumuman" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "judul" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "penting" BOOLEAN NOT NULL DEFAULT false,
    "mulai" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "berakhir" DATETIME,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Album" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "deskripsi" TEXT,
    "tanggal" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Foto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "albumId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "judul" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Foto_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Warga" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "nik" TEXT,
    "noKk" TEXT,
    "jenisKelamin" TEXT NOT NULL,
    "tempatLahir" TEXT,
    "tanggalLahir" DATETIME,
    "agama" TEXT,
    "pendidikan" TEXT,
    "pekerjaan" TEXT,
    "statusPerkawinan" TEXT,
    "hubungan" TEXT NOT NULL DEFAULT 'ANGGOTA',
    "alamat" TEXT,
    "rtId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Warga_rtId_fkey" FOREIGN KEY ("rtId") REFERENCES "Rt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LaporanKeuangan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "judul" TEXT NOT NULL,
    "bulan" INTEGER NOT NULL,
    "tahun" INTEGER NOT NULL,
    "rtId" INTEGER NOT NULL,
    "saldoAwal" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "catatan" TEXT,
    "dibuatOlehId" INTEGER,
    "verifikasiRtOlehId" INTEGER,
    "verifikasiRtAt" DATETIME,
    "catatanRt" TEXT,
    "persetujuanRwOlehId" INTEGER,
    "persetujuanRwAt" DATETIME,
    "catatanRw" TEXT,
    "diajukanAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LaporanKeuangan_rtId_fkey" FOREIGN KEY ("rtId") REFERENCES "Rt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LaporanKeuangan_dibuatOlehId_fkey" FOREIGN KEY ("dibuatOlehId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LaporanKeuangan_verifikasiRtOlehId_fkey" FOREIGN KEY ("verifikasiRtOlehId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LaporanKeuangan_persetujuanRwOlehId_fkey" FOREIGN KEY ("persetujuanRwOlehId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaksi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "laporanId" INTEGER NOT NULL,
    "tanggal" DATETIME NOT NULL,
    "jenis" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "keterangan" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "bukti" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaksi_laporanId_fkey" FOREIGN KEY ("laporanId") REFERENCES "LaporanKeuangan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RiwayatPersetujuan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "laporanId" INTEGER NOT NULL,
    "aksi" TEXT NOT NULL,
    "olehId" INTEGER,
    "catatan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RiwayatPersetujuan_laporanId_fkey" FOREIGN KEY ("laporanId") REFERENCES "LaporanKeuangan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RiwayatPersetujuan_olehId_fkey" FOREIGN KEY ("olehId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pengurus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "jabatan" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'RW',
    "rtId" INTEGER,
    "foto" TEXT,
    "telepon" TEXT,
    "periode" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Pengurus_rtId_fkey" FOREIGN KEY ("rtId") REFERENCES "Rt" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pengaturan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "namaRw" TEXT NOT NULL DEFAULT 'RW Sanggrahan',
    "tagline" TEXT NOT NULL DEFAULT 'Guyub, Rukun, Maju Bersama',
    "deskripsi" TEXT NOT NULL DEFAULT '',
    "sejarah" TEXT NOT NULL DEFAULT '',
    "visi" TEXT NOT NULL DEFAULT '',
    "misi" TEXT NOT NULL DEFAULT '',
    "alamat" TEXT NOT NULL DEFAULT '',
    "telepon" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "logo" TEXT,
    "heroFoto" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Rt_nomor_key" ON "Rt"("nomor");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_peran_idx" ON "User"("peran");

-- CreateIndex
CREATE UNIQUE INDEX "Berita_slug_key" ON "Berita"("slug");

-- CreateIndex
CREATE INDEX "Berita_status_terbitAt_idx" ON "Berita"("status", "terbitAt");

-- CreateIndex
CREATE UNIQUE INDEX "Kegiatan_slug_key" ON "Kegiatan"("slug");

-- CreateIndex
CREATE INDEX "Kegiatan_status_mulai_idx" ON "Kegiatan"("status", "mulai");

-- CreateIndex
CREATE UNIQUE INDEX "Album_slug_key" ON "Album"("slug");

-- CreateIndex
CREATE INDEX "Foto_albumId_urutan_idx" ON "Foto"("albumId", "urutan");

-- CreateIndex
CREATE UNIQUE INDEX "Warga_nik_key" ON "Warga"("nik");

-- CreateIndex
CREATE INDEX "Warga_rtId_idx" ON "Warga"("rtId");

-- CreateIndex
CREATE INDEX "Warga_noKk_idx" ON "Warga"("noKk");

-- CreateIndex
CREATE INDEX "LaporanKeuangan_status_idx" ON "LaporanKeuangan"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LaporanKeuangan_rtId_tahun_bulan_key" ON "LaporanKeuangan"("rtId", "tahun", "bulan");

-- CreateIndex
CREATE INDEX "Transaksi_laporanId_tanggal_idx" ON "Transaksi"("laporanId", "tanggal");

-- CreateIndex
CREATE INDEX "RiwayatPersetujuan_laporanId_idx" ON "RiwayatPersetujuan"("laporanId");

-- CreateIndex
CREATE INDEX "Pengurus_level_urutan_idx" ON "Pengurus"("level", "urutan");
