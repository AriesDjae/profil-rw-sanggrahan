import titik from "@/data/titik-usaha.json";

/**
 * Titik usaha warga di peta kampung.
 *
 * Sumbernya registri Usaha Warga Sanggrahan (situs terpisah, data/umkm/*.json),
 * disalin apa adanya tanpa nama pemilik atau nomor kontak. Sebagian besar titik
 * ditarik dari banner peta kampung lalu dicocokkan ke jalan OpenStreetMap, jadi
 * tandanya `perkiraan` harus tetap ditampilkan kepada pembaca.
 */
export type TitikUsaha = {
  nama: string;
  slug: string;
  rw: number;
  kategori: string;
  lat: number;
  lng: number;
  perkiraan: boolean;
};

export const TITIK_USAHA: readonly TitikUsaha[] = titik;

/** Tengah Kampung Sanggrahan, sama dengan yang dipakai situs Usaha Warga. */
export const PUSAT_KAMPUNG = { lat: -7.7935, lng: 110.3858 } as const;
