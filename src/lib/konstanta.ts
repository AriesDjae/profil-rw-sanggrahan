/** Nilai-nilai tetap yang dipakai di seluruh aplikasi. */

export const PERAN = {
  ADMIN: "ADMIN",
  KETUA_RW: "KETUA_RW",
  SEKRETARIS: "SEKRETARIS",
  KETUA_RT: "KETUA_RT",
  BENDAHARA_RT: "BENDAHARA_RT",
} as const;

export type Peran = (typeof PERAN)[keyof typeof PERAN];

export const LABEL_PERAN: Record<Peran, string> = {
  ADMIN: "Administrator",
  KETUA_RW: "Ketua RW",
  SEKRETARIS: "Sekretaris RW",
  KETUA_RT: "Ketua RT",
  BENDAHARA_RT: "Bendahara RT",
};

/** Peran yang wajib terikat pada satu RT tertentu. */
export const PERAN_TERIKAT_RT: Peran[] = [PERAN.KETUA_RT, PERAN.BENDAHARA_RT];

/** Peran yang boleh mengelola konten publik (berita, kegiatan, galeri, warga, profil). */
export const PERAN_KONTEN: Peran[] = [PERAN.ADMIN, PERAN.SEKRETARIS, PERAN.KETUA_RW];

export const STATUS_LAPORAN = {
  DRAFT: "DRAFT",
  DIAJUKAN: "DIAJUKAN",
  DIVERIFIKASI_RT: "DIVERIFIKASI_RT",
  DISETUJUI: "DISETUJUI",
  DITOLAK: "DITOLAK",
} as const;

export type StatusLaporan = (typeof STATUS_LAPORAN)[keyof typeof STATUS_LAPORAN];

export const LABEL_STATUS_LAPORAN: Record<StatusLaporan, string> = {
  DRAFT: "Draf",
  DIAJUKAN: "Menunggu Verifikasi RT",
  DIVERIFIKASI_RT: "Menunggu Persetujuan RW",
  DISETUJUI: "Disetujui & Terbit",
  DITOLAK: "Ditolak / Perlu Revisi",
};

/** Kelas warna badge untuk tiap status laporan. */
export const WARNA_STATUS_LAPORAN: Record<StatusLaporan, string> = {
  DRAFT: "bg-slate-100 text-slate-700 ring-slate-200",
  DIAJUKAN: "bg-amber-50 text-amber-800 ring-amber-200",
  DIVERIFIKASI_RT: "bg-sky-50 text-sky-800 ring-sky-200",
  DISETUJUI: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  DITOLAK: "bg-rose-50 text-rose-800 ring-rose-200",
};

export const AKSI_RIWAYAT = {
  BUAT: "BUAT",
  AJUKAN: "AJUKAN",
  VERIFIKASI_RT: "VERIFIKASI_RT",
  TOLAK_RT: "TOLAK_RT",
  SETUJUI_RW: "SETUJUI_RW",
  TOLAK_RW: "TOLAK_RW",
} as const;

export const LABEL_AKSI: Record<string, string> = {
  BUAT: "Laporan dibuat",
  AJUKAN: "Diajukan oleh bendahara",
  VERIFIKASI_RT: "Diverifikasi Ketua RT",
  TOLAK_RT: "Ditolak Ketua RT",
  SETUJUI_RW: "Disetujui Ketua RW",
  TOLAK_RW: "Ditolak Ketua RW",
};

export const JENIS_TRANSAKSI = {
  PEMASUKAN: "PEMASUKAN",
  PENGELUARAN: "PENGELUARAN",
} as const;

export const KATEGORI_PEMASUKAN = [
  "Iuran Warga",
  "Iuran Keamanan",
  "Iuran Kebersihan",
  "Sumbangan",
  "Bantuan Pemerintah",
  "Hasil Usaha",
  "Lain-lain",
];

export const KATEGORI_PENGELUARAN = [
  "Honor Petugas Keamanan",
  "Honor Petugas Kebersihan",
  "Listrik & Air",
  "Kegiatan Sosial",
  "Perbaikan Fasilitas",
  "Konsumsi Rapat",
  "Administrasi",
  "Lain-lain",
];

export const STATUS_KONTEN = {
  DRAFT: "DRAFT",
  TERBIT: "TERBIT",
} as const;

export const KATEGORI_BERITA = [
  "Umum",
  "Pembangunan",
  "Kesehatan",
  "Sosial",
  "Keamanan",
  "Lingkungan",
  "Pendidikan",
];

export const KATEGORI_KEGIATAN = [
  "Umum",
  "Kerja Bakti",
  "Rapat",
  "Posyandu",
  "Keagamaan",
  "Olahraga",
  "Perayaan",
  "Pelatihan",
];

export const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const AGAMA = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"];

export const PENDIDIKAN = [
  "Belum Sekolah",
  "SD",
  "SMP",
  "SMA/SMK",
  "D1-D3",
  "S1",
  "S2",
  "S3",
];

export const PEKERJAAN = [
  "Belum/Tidak Bekerja",
  "Pelajar/Mahasiswa",
  "Petani",
  "Buruh",
  "Karyawan Swasta",
  "Wiraswasta",
  "PNS/TNI/Polri",
  "Guru/Dosen",
  "Pensiunan",
  "Ibu Rumah Tangga",
  "Lainnya",
];

export const STATUS_PERKAWINAN = ["Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"];

export const HUBUNGAN_KELUARGA = [
  "KEPALA_KELUARGA",
  "ISTRI",
  "ANAK",
  "ANGGOTA",
];

export const LABEL_HUBUNGAN: Record<string, string> = {
  KEPALA_KELUARGA: "Kepala Keluarga",
  ISTRI: "Istri",
  ANAK: "Anak",
  ANGGOTA: "Anggota Keluarga",
};
