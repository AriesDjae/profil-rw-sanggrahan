import type { RwRingkas } from "@/lib/rw";

/**
 * Lingkup sebuah halaman publik: satu RW, atau seluruh kampung.
 *
 * Tiap bagian situs — berita, kegiatan, galeri, data warga, keuangan, profil —
 * punya dua alamat yang menampilkan isi yang sama bentuknya: `/berita` untuk
 * kampung dan `/rw/2/berita` untuk satu RW. Yang membedakan hanya nilai ini.
 *
 * Isinya sengaja ditulis satu kali sebagai komponen bersama di folder ini, lalu
 * dipakai kedua alamat. Kalau tidak, dua salinan akan menyimpang perlahan dan
 * warga RW 2 akhirnya melihat halaman yang tertinggal beberapa perbaikan dari
 * halaman kampung.
 */
export type Lingkup = {
  /** RW yang sedang dibuka, atau null untuk halaman tingkat kampung. */
  rw: RwRingkas | null;
  /** Awalan alamat: "" untuk kampung, "/rw/2" untuk RW 02. */
  basis: string;
  /** Nama yang dipakai pada judul dan kalimat. */
  nama: string;
};

export function lingkupKampung(namaKampung: string): Lingkup {
  return { rw: null, basis: "", nama: namaKampung };
}

export function lingkupRwHalaman(rw: RwRingkas): Lingkup {
  return { rw, basis: `/rw/${rw.nomor}`, nama: rw.nama };
}

/** Merangkai alamat di dalam lingkup ini: tautan("/berita") -> "/rw/2/berita". */
export function tautan(lingkup: Lingkup, jalur: string): string {
  return `${lingkup.basis}${jalur}`;
}
