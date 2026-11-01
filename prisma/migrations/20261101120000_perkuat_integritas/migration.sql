-- Memindahkan aturan penting ke basis data, supaya tetap berlaku walau ada
-- jalur tulis yang lupa memeriksanya: skrip, konsol, atau bug di aplikasi.
-- Seluruh berkas dijalankan dalam satu transaksi. Bila ada baris lama yang
-- melanggar, migrasi gagal utuh dan tidak ada perubahan yang tertinggal.

-- ---------------------------------------------------------------------------
-- 1. Batasan nilai
-- ---------------------------------------------------------------------------
ALTER TABLE "User"
  ADD CONSTRAINT "User_peran_valid"
  CHECK ("peran" IN ('ADMIN', 'KETUA_RW', 'SEKRETARIS', 'KETUA_RT', 'BENDAHARA_RT'));

ALTER TABLE "Berita"
  ADD CONSTRAINT "Berita_status_valid" CHECK ("status" IN ('DRAFT', 'TERBIT')),
  ADD CONSTRAINT "Berita_dilihat_positif" CHECK ("dilihat" >= 0);

ALTER TABLE "Kegiatan"
  ADD CONSTRAINT "Kegiatan_status_valid"
  CHECK ("status" IN ('DRAFT', 'TERBIT', 'SELESAI', 'BATAL')),
  ADD CONSTRAINT "Kegiatan_rentang_waktu" CHECK ("selesai" IS NULL OR "selesai" >= "mulai");

ALTER TABLE "LaporanKeuangan"
  ADD CONSTRAINT "LaporanKeuangan_status_valid"
  CHECK ("status" IN ('DRAFT', 'DIAJUKAN', 'DIVERIFIKASI_RT', 'DISETUJUI', 'DITOLAK')),
  ADD CONSTRAINT "LaporanKeuangan_bulan_valid" CHECK ("bulan" BETWEEN 1 AND 12),
  ADD CONSTRAINT "LaporanKeuangan_tahun_valid" CHECK ("tahun" BETWEEN 2000 AND 2100),
  -- Laporan yang tampil ke warga wajib punya penanggung jawab dan waktu sah.
  ADD CONSTRAINT "LaporanKeuangan_disetujui_lengkap"
  CHECK ("status" <> 'DISETUJUI' OR "persetujuanRwAt" IS NOT NULL);

ALTER TABLE "Transaksi"
  ADD CONSTRAINT "Transaksi_jenis_valid" CHECK ("jenis" IN ('PEMASUKAN', 'PENGELUARAN')),
  ADD CONSTRAINT "Transaksi_jumlah_positif" CHECK ("jumlah" > 0);

ALTER TABLE "RiwayatPersetujuan"
  ADD CONSTRAINT "RiwayatPersetujuan_aksi_valid"
  CHECK ("aksi" IN ('BUAT', 'AJUKAN', 'VERIFIKASI_RT', 'TOLAK_RT', 'SETUJUI_RW', 'TOLAK_RW'));

-- ---------------------------------------------------------------------------
-- 2. Arsip keuangan dan data warga tidak ikut terhapus bersama RT
-- ---------------------------------------------------------------------------
-- Aplikasi sudah menolak menghapus RT yang masih punya warga atau laporan,
-- tetapi penghapusan RW lewat jalur lain tetap akan menurun lewat CASCADE.
ALTER TABLE "LaporanKeuangan" DROP CONSTRAINT "LaporanKeuangan_rtId_fkey";
ALTER TABLE "LaporanKeuangan"
  ADD CONSTRAINT "LaporanKeuangan_rtId_fkey"
  FOREIGN KEY ("rtId") REFERENCES "Rt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Warga" DROP CONSTRAINT "Warga_rtId_fkey";
ALTER TABLE "Warga"
  ADD CONSTRAINT "Warga_rtId_fkey"
  FOREIGN KEY ("rtId") REFERENCES "Rt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 3. Jejak audit tidak bisa ditulis ulang
-- ---------------------------------------------------------------------------
-- olehId tetap boleh berubah menjadi NULL karena relasi ke User memakai
-- ON DELETE SET NULL. Isi catatannya tidak boleh disentuh.
CREATE FUNCTION "jaga_riwayat_persetujuan"() RETURNS trigger AS $$
BEGIN
  IF NEW."laporanId" IS DISTINCT FROM OLD."laporanId"
     OR NEW."aksi" IS DISTINCT FROM OLD."aksi"
     OR NEW."catatan" IS DISTINCT FROM OLD."catatan"
     OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt"
     OR (NEW."olehId" IS DISTINCT FROM OLD."olehId" AND NEW."olehId" IS NOT NULL)
  THEN
    RAISE EXCEPTION 'Jejak persetujuan tidak dapat diubah';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "riwayat_persetujuan_tetap"
  BEFORE UPDATE ON "RiwayatPersetujuan"
  FOR EACH ROW EXECUTE FUNCTION "jaga_riwayat_persetujuan"();

-- ---------------------------------------------------------------------------
-- 4. Transaksi laporan yang sedang diproses atau sudah sah dikunci
-- ---------------------------------------------------------------------------
CREATE FUNCTION "jaga_transaksi_laporan"() RETURNS trigger AS $$
DECLARE
  status_laporan TEXT;
  id_laporan INTEGER := COALESCE(NEW."laporanId", OLD."laporanId");
BEGIN
  -- FOR SHARE menahan laporan selama transaksi ini berjalan, jadi laporan tidak
  -- bisa berpindah ke DIAJUKAN di tengah penambahan transaksi.
  SELECT "status" INTO status_laporan
  FROM "LaporanKeuangan" WHERE "id" = id_laporan FOR SHARE;

  -- Baris laporan sudah tidak ada berarti ini penghapusan berantai dari laporan.
  IF status_laporan IS NOT NULL AND status_laporan NOT IN ('DRAFT', 'DITOLAK') THEN
    RAISE EXCEPTION 'Transaksi laporan berstatus % tidak dapat diubah', status_laporan;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "transaksi_terkunci"
  BEFORE INSERT OR UPDATE OR DELETE ON "Transaksi"
  FOR EACH ROW EXECUTE FUNCTION "jaga_transaksi_laporan"();

-- ---------------------------------------------------------------------------
-- 5. Pembatas percobaan masuk
-- ---------------------------------------------------------------------------
CREATE TABLE "PercobaanMasuk" (
  "kunci" TEXT NOT NULL,
  "jumlah" INTEGER NOT NULL DEFAULT 0,
  "mulaiAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "terkunciSampai" TIMESTAMP(3),

  CONSTRAINT "PercobaanMasuk_pkey" PRIMARY KEY ("kunci")
);

CREATE INDEX "PercobaanMasuk_mulaiAt_idx" ON "PercobaanMasuk"("mulaiAt");
