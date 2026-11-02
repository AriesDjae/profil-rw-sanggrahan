import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { adeganUntuk, panoramaRw, panoramaKampung, potretPengurus } from "./ilustrasi/adegan";

/**
 * Membuat ilustrasi SVG sebagai gambar contoh, supaya proyek tidak bergantung
 * pada aset eksternal. Berkas ditulis ke public/contoh dan ikut disertakan dalam
 * repositori, sehingga tetap tampil saat di-deploy ke lingkungan yang sistem
 * berkasnya hanya-baca seperti Vercel. Ganti dengan foto asli lewat panel admin.
 *
 * Adegannya dipilih dari judul (lihat prisma/ilustrasi/adegan.ts), jadi kabar
 * kerja bakti memang bergambar kerja bakti.
 */

function ilustrasi(nama: string, judul: string, indeks: number, rasio: "lanskap" | "kotak"): string {
  if (nama === "hero-kampung") return panoramaKampung();
  const rw = /^hero-rw-(\d)$/.exec(nama);
  if (rw) return panoramaRw(Number(rw[1]));
  if (nama.startsWith("pengurus")) return potretPengurus(judul, indeks);
  return rasio === "kotak" ? adeganUntuk(judul, indeks, 900, 900) : adeganUntuk(judul, indeks);
}

/** Menulis SVG ke public/contoh dan mengembalikan URL publiknya. */
export function tulisGambar(
  nama: string,
  judul: string,
  indeks: number,
  rasio: "lanskap" | "kotak" = "lanskap",
): string {
  const dir = path.join(process.cwd(), "public", "contoh");
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, `${nama}.svg`), ilustrasi(nama, judul, indeks, rasio), "utf8");
  return `/contoh/${nama}.svg`;
}
