import "server-only";

import { revalidatePath } from "next/cache";
import { cache } from "react";

import { db } from "./db";

/**
 * Tiga RW Kampung Sanggrahan.
 *
 * Baris RW-nya sendiri dibuat oleh migrasi, bukan oleh kode ini — situs harus
 * tetap benar di basis data yang tidak pernah di-seed. Modul ini hanya
 * membacanya, dan menyediakan satu tempat untuk menerjemahkan nomor RW pada
 * alamat halaman (/rw/2) menjadi baris basis data.
 */

export type RwRingkas = {
  id: number;
  nomor: number;
  nama: string;
  slug: string;
  tagline: string;
};

const PILIH_RINGKAS = {
  id: true,
  nomor: true,
  nama: true,
  slug: true,
  tagline: true,
} as const;

/** Seluruh RW yang aktif, urut nomor. */
export const daftarRw = cache(async (): Promise<RwRingkas[]> => {
  return db.rw.findMany({
    where: { aktif: true },
    orderBy: { nomor: "asc" },
    select: PILIH_RINGKAS,
  });
});

/** Seluruh RW termasuk yang dinonaktifkan — dipakai panel pengurus. */
export const daftarRwSemua = cache(async () => {
  return db.rw.findMany({ orderBy: { nomor: "asc" } });
});

/** Satu RW lengkap dengan profilnya, dicari dari nomor di alamat halaman. */
export const ambilRw = cache(async (nomor: number) => {
  if (!Number.isInteger(nomor)) return null;
  return db.rw.findUnique({ where: { nomor } });
});

export const ambilRwId = cache(async (id: number) => {
  return db.rw.findUnique({ where: { id }, select: PILIH_RINGKAS });
});

/**
 * Membaca nomor RW dari potongan alamat. Menerima "2", "02", dan "rw-02"
 * supaya tautan lama maupun yang diketik tangan tidak berakhir 404.
 */
export function bacaNomorRw(segmen: string): number | null {
  const angka = Number(segmen.replace(/^rw-?/i, ""));
  return Number.isInteger(angka) && angka > 0 ? angka : null;
}

/** "RW 02" — dipakai label di daftar yang mencampur ketiga RW. */
export function labelRw(rw: { nomor: number } | null | undefined): string {
  return rw ? `RW ${String(rw.nomor).padStart(2, "0")}` : "Kampung";
}

/** Alamat laman sebuah RW. */
export function tautanRw(nomor: number, sub = ""): string {
  return `/rw/${nomor}${sub}`;
}

/**
 * Syarat `where` untuk konten yang tampil di laman sebuah RW: miliknya sendiri
 * ditambah yang bertingkat kampung (rwId kosong). Dipanggil dengan null untuk
 * halaman kampung, yang memang menampilkan semuanya.
 */
export function saringKontenRw(rwId: number | null) {
  return rwId === null ? {} : { OR: [{ rwId }, { rwId: null }] };
}

/**
 * Menyegarkan beranda tiap RW setelah pengurus menyimpan sesuatu.
 *
 * Beranda RW (/rw/1, /rw/2, /rw/3) satu-satunya halaman RW yang dibangun statis
 * dengan masa berlaku lima menit; sub-halamannya dirender per permintaan.
 *
 * Alamatnya disebut satu per satu, bukan lewat pola `revalidatePath("/rw/[rw]",
 * "page")` — pola itu tidak membatalkan hasil prerender di sini (diperiksa lewat
 * kepala tanggapan `x-nextjs-cache: HIT`), sehingga pengurus baru melihat
 * perubahannya setelah cache kedaluwarsa sendiri.
 */
export async function segarkanLamanRw(): Promise<void> {
  const daftar = await daftarRw();
  for (const rw of daftar) revalidatePath(`/rw/${rw.nomor}`);
}
