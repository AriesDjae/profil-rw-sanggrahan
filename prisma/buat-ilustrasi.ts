// Menulis ilustrasi situs ke public/ilustrasi.
//
//   npm run ilustrasi
//
// Seluruh ilustrasi dihitung dari kode dengan benih tetap, jadi hasilnya selalu
// sama dan ukurannya tetap kecil. Gambar contoh untuk berita dan galeri dibuat
// oleh `npm run db:seed` lewat prisma/gambar.ts.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { gangBuntu, listrikPadam, panoramaKampung, siluetAtap } from "./ilustrasi/adegan";

const keluaran = path.join(process.cwd(), "public", "ilustrasi");
mkdirSync(keluaran, { recursive: true });

const berkas: Record<string, string> = {
  "panorama-kampung.svg": panoramaKampung(),
  "gang-buntu.svg": gangBuntu(),
  "listrik-padam.svg": listrikPadam(),
  "siluet-atap.svg": siluetAtap("#162542"),
};

for (const [nama, isi] of Object.entries(berkas)) {
  writeFileSync(path.join(keluaran, nama), isi, "utf8");
  console.log(`${nama}  ${(Buffer.byteLength(isi) / 1024).toFixed(1)} KB`);
}
