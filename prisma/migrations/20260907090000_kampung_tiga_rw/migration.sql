-- Kampung Sanggrahan: satu situs untuk RW 01, RW 02, dan RW 03.
--
-- Migrasi ini ditulis supaya aman dijalankan di basis data yang sudah berisi.
-- Urutannya: buat tabel Rw, isi tiga RW, tambahkan kolom rwId dalam keadaan
-- boleh kosong, alihkan seluruh isi lama ke RW 1, baru kolom yang memang wajib
-- (Rt.rwId) dikunci NOT NULL. Dengan begitu tidak ada baris yang perlu dihapus
-- lebih dulu, dan basis data kosong pun melewati jalur yang sama.

-- CreateTable
CREATE TABLE "Rw" (
    "id" SERIAL NOT NULL,
    "nomor" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT NOT NULL DEFAULT '',
    "deskripsi" TEXT NOT NULL DEFAULT '',
    "sejarah" TEXT NOT NULL DEFAULT '',
    "visi" TEXT NOT NULL DEFAULT '',
    "misi" TEXT NOT NULL DEFAULT '',
    "alamat" TEXT NOT NULL DEFAULT '',
    "telepon" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "logo" TEXT,
    "heroFoto" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rw_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rw_nomor_key" ON "Rw"("nomor");
CREATE UNIQUE INDEX "Rw_slug_key" ON "Rw"("slug");

-- Tiga RW Kampung Sanggrahan. Ditulis di migrasi, bukan hanya di seed, supaya
-- basis data produksi yang tidak pernah di-seed tetap punya ketiganya.
INSERT INTO "Rw" ("nomor", "nama", "slug", "updatedAt") VALUES
    (1, 'RW 01', 'rw-01', CURRENT_TIMESTAMP),
    (2, 'RW 02', 'rw-02', CURRENT_TIMESTAMP),
    (3, 'RW 03', 'rw-03', CURRENT_TIMESTAMP)
ON CONFLICT ("nomor") DO NOTHING;

-- AlterTable: kolom lingkup RW
ALTER TABLE "Rt" ADD COLUMN "rwId" INTEGER;
ALTER TABLE "User" ADD COLUMN "rwId" INTEGER;
ALTER TABLE "Berita" ADD COLUMN "rwId" INTEGER;
ALTER TABLE "Kegiatan" ADD COLUMN "rwId" INTEGER;
ALTER TABLE "Pengumuman" ADD COLUMN "rwId" INTEGER;
ALTER TABLE "Album" ADD COLUMN "rwId" INTEGER;
ALTER TABLE "Pengurus" ADD COLUMN "rwId" INTEGER;

-- Isi lama dianggap milik RW 1. Untuk Rt ini wajib; untuk konten sebetulnya
-- boleh dibiarkan kosong (= milik kampung), tetapi menaruhnya di RW 1 lebih
-- jujur: tulisan itu memang ditulis pengurus satu RW, bukan tiga RW.
UPDATE "Rt"         SET "rwId" = (SELECT "id" FROM "Rw" WHERE "nomor" = 1) WHERE "rwId" IS NULL;
UPDATE "User"       SET "rwId" = (SELECT "id" FROM "Rw" WHERE "nomor" = 1) WHERE "rwId" IS NULL AND "peran" <> 'ADMIN';
UPDATE "Berita"     SET "rwId" = (SELECT "id" FROM "Rw" WHERE "nomor" = 1) WHERE "rwId" IS NULL;
UPDATE "Kegiatan"   SET "rwId" = (SELECT "id" FROM "Rw" WHERE "nomor" = 1) WHERE "rwId" IS NULL;
UPDATE "Pengumuman" SET "rwId" = (SELECT "id" FROM "Rw" WHERE "nomor" = 1) WHERE "rwId" IS NULL;
UPDATE "Album"      SET "rwId" = (SELECT "id" FROM "Rw" WHERE "nomor" = 1) WHERE "rwId" IS NULL;
UPDATE "Pengurus"   SET "rwId" = (SELECT "id" FROM "Rw" WHERE "nomor" = 1) WHERE "rwId" IS NULL AND "level" <> 'KAMPUNG';

-- Rt wajib punya RW; sisanya boleh kosong dan artinya "milik kampung".
ALTER TABLE "Rt" ALTER COLUMN "rwId" SET NOT NULL;

-- Nomor RT tidak lagi unik se-kampung, melainkan unik di dalam RW-nya, supaya
-- RT 01 boleh ada di RW 1, RW 2, dan RW 3 sekaligus.
DROP INDEX IF EXISTS "Rt_nomor_key";
CREATE UNIQUE INDEX "Rt_rwId_nomor_key" ON "Rt"("rwId", "nomor");

-- AddForeignKey
ALTER TABLE "Rt"         ADD CONSTRAINT "Rt_rwId_fkey"         FOREIGN KEY ("rwId") REFERENCES "Rw"("id") ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "User"       ADD CONSTRAINT "User_rwId_fkey"       FOREIGN KEY ("rwId") REFERENCES "Rw"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Berita"     ADD CONSTRAINT "Berita_rwId_fkey"     FOREIGN KEY ("rwId") REFERENCES "Rw"("id") ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "Kegiatan"   ADD CONSTRAINT "Kegiatan_rwId_fkey"   FOREIGN KEY ("rwId") REFERENCES "Rw"("id") ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "Pengumuman" ADD CONSTRAINT "Pengumuman_rwId_fkey" FOREIGN KEY ("rwId") REFERENCES "Rw"("id") ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "Album"      ADD CONSTRAINT "Album_rwId_fkey"      FOREIGN KEY ("rwId") REFERENCES "Rw"("id") ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "Pengurus"   ADD CONSTRAINT "Pengurus_rwId_fkey"   FOREIGN KEY ("rwId") REFERENCES "Rw"("id") ON DELETE CASCADE  ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Rt_rwId_idx"                    ON "Rt"("rwId");
CREATE INDEX "User_rwId_idx"                  ON "User"("rwId");
CREATE INDEX "Berita_rwId_status_terbitAt_idx" ON "Berita"("rwId", "status", "terbitAt");
CREATE INDEX "Kegiatan_rwId_status_mulai_idx"  ON "Kegiatan"("rwId", "status", "mulai");
CREATE INDEX "Pengumuman_rwId_aktif_idx"       ON "Pengumuman"("rwId", "aktif");
CREATE INDEX "Album_rwId_tanggal_idx"          ON "Album"("rwId", "tanggal");
CREATE INDEX "Pengurus_rwId_urutan_idx"        ON "Pengurus"("rwId", "urutan");

-- Pengaturan sekarang menerangkan kampung, bukan satu RW.
ALTER TABLE "Pengaturan" RENAME COLUMN "namaRw" TO "namaKampung";
ALTER TABLE "Pengaturan" ALTER COLUMN "namaKampung" SET DEFAULT 'Kampung Sanggrahan';
UPDATE "Pengaturan" SET "namaKampung" = 'Kampung Sanggrahan' WHERE "namaKampung" IN ('RW Sanggrahan', 'RW 05 Sanggrahan');
ALTER TABLE "Pengaturan" ADD COLUMN "kelurahan" TEXT NOT NULL DEFAULT 'Semaki';
ALTER TABLE "Pengaturan" ADD COLUMN "kemantren" TEXT NOT NULL DEFAULT 'Umbulharjo';
ALTER TABLE "Pengaturan" ADD COLUMN "kota"      TEXT NOT NULL DEFAULT 'Kota Yogyakarta';
