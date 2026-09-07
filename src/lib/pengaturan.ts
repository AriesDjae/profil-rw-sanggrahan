import "server-only";

import { cache } from "react";

import { db } from "./db";

const BAWAAN = {
  id: 1,
  namaKampung: "Kampung Sanggrahan",
  kelurahan: "Semaki",
  kemantren: "Umbulharjo",
  kota: "Kota Yogyakarta",
  tagline: "Guyub, Rukun, Maju Bersama",
  deskripsi: "",
  sejarah: "",
  visi: "",
  misi: "",
  alamat: "",
  telepon: "",
  email: "",
  logo: null as string | null,
  heroFoto: null as string | null,
};

/**
 * Pengaturan tingkat kampung; dibuat otomatis bila belum ada.
 *
 * Isinya menerangkan Kampung Sanggrahan sebagai satu kesatuan — nama, wilayah,
 * sekretariat. Yang khas satu RW (sejarah, visi, misi, foto kop) ada di model
 * Rw dan dibaca lewat src/lib/rw.ts.
 */
export const ambilPengaturan = cache(async () => {
  const ada = await db.pengaturan.findUnique({ where: { id: 1 } });
  if (ada) return ada;
  return db.pengaturan.create({ data: { id: 1 } }).catch(() => BAWAAN as never);
});
