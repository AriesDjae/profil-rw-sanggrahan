/**
 * Mode demo: deployment terpisah tempat siapa pun boleh mencoba panel pengurus.
 *
 * Situs utama dan situs demo memakai kode yang sama. Yang membedakan hanya
 * variabel lingkungan di proyek Vercel-nya:
 *
 * - `MODE_DEMO=nyala` hanya dipasang di proyek demo, yang memakai basis data
 *   `rw_demo` tersendiri. Jangan pernah memasangnya di situs utama: mode ini
 *   membuka panel tanpa kata sandi.
 * - `NEXT_PUBLIC_URL_DEMO` dipasang di situs utama agar pita "Situs demo"
 *   menautkan pengunjung ke situs demo.
 *
 * Basis data demo dikembalikan ke isi seed oleh .github/workflows/reset-demo.yml.
 */

export function modeDemo(): boolean {
  return process.env.MODE_DEMO === "nyala";
}

/** Alamat situs demo, dipakai situs utama untuk menautkannya. */
export const URL_DEMO = (process.env.NEXT_PUBLIC_URL_DEMO ?? "").replace(/\/+$/, "");

/** Jarak antar-reset; harus sama dengan jadwal cron di reset-demo.yml. */
export const JAM_RESET_DEMO = 6;

export type AkunDemo = {
  kunci: string;
  email: string;
  label: string;
  keterangan: string;
};

/**
 * Akun yang bisa dimasuki satu klik, diurutkan mengikuti alur laporan kas.
 * Semuanya berada di RT 01 / RW 01 supaya satu laporan bisa diikuti dari
 * penyusunan sampai terbit dengan berganti peran.
 */
export const AKUN_DEMO: AkunDemo[] = [
  {
    kunci: "bendahara-rt",
    email: "bendaharart01.rw1@sanggrahan.id",
    label: "Bendahara RT 01",
    keterangan: "Menyusun laporan kas, mencatat transaksi, lalu mengajukannya.",
  },
  {
    kunci: "ketua-rt",
    email: "ketuart01.rw1@sanggrahan.id",
    label: "Ketua RT 01",
    keterangan: "Memverifikasi laporan atau mengembalikannya dengan catatan.",
  },
  {
    kunci: "ketua-rw",
    email: "ketuarw1@sanggrahan.id",
    label: "Ketua RW 01",
    keterangan: "Memberi persetujuan akhir; laporan lalu terbit untuk warga.",
  },
  {
    kunci: "sekretaris-rw",
    email: "sekretaris.rw1@sanggrahan.id",
    label: "Sekretaris RW 01",
    keterangan: "Mengelola berita, kegiatan, galeri, dan data warga RW 01.",
  },
  {
    kunci: "admin",
    email: "admin@sanggrahan.id",
    label: "Administrator kampung",
    keterangan: "Satu-satunya akun lintas RW: akun, pengaturan, ketiga RW.",
  },
];

const SUREL_DEMO = new Set(AKUN_DEMO.map((a) => a.email));

/**
 * Akun demo tidak boleh diubah, dinonaktifkan, atau dihapus di situs demo.
 * Kalau boleh, satu pengunjung bisa mematahkan tombol masuk bagi pengunjung
 * berikutnya sampai reset berikutnya.
 */
export function akunDemoTerkunci(email: string): boolean {
  return modeDemo() && SUREL_DEMO.has(email.toLowerCase());
}

export const PESAN_AKUN_DEMO =
  "Akun ini dipakai tombol masuk demo, jadi tidak bisa diubah di situs demo. Coba buat akun baru.";

export const PESAN_UNGGAH_DEMO =
  "Unggahan berkas dimatikan di situs demo. Simpan tanpa foto untuk mencoba alurnya.";
