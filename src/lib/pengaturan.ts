import "server-only";

import { cache } from "react";

import { db } from "./db";

const BAWAAN = {
  id: 1,
  namaRw: "RW Sanggrahan",
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

/** Pengaturan situs; dibuat otomatis bila belum ada. */
export const ambilPengaturan = cache(async () => {
  const ada = await db.pengaturan.findUnique({ where: { id: 1 } });
  if (ada) return ada;
  return db.pengaturan.create({ data: { id: 1 } }).catch(() => BAWAAN as never);
});
