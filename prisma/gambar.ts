import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Membuat berkas SVG dekoratif sebagai gambar contoh, supaya proyek tidak
 * bergantung pada aset eksternal. Berkas ditulis ke public/contoh dan ikut
 * disertakan dalam repositori, sehingga tetap tampil saat di-deploy ke
 * lingkungan yang sistem berkasnya hanya-baca seperti Vercel.
 * Ganti dengan foto asli lewat panel admin.
 */

const PALET = [
  ["#0f766e", "#14b8a6", "#99f6e4"],
  ["#1d4ed8", "#3b82f6", "#bfdbfe"],
  ["#b45309", "#f59e0b", "#fde68a"],
  ["#9333ea", "#a855f7", "#e9d5ff"],
  ["#be123c", "#f43f5e", "#fecdd3"],
  ["#15803d", "#22c55e", "#bbf7d0"],
  ["#0369a1", "#0ea5e9", "#bae6fd"],
  ["#7c2d12", "#ea580c", "#fed7aa"],
];

function acak(seed: number) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function svgHias(judul: string, indeks: number, lebar = 1200, tinggi = 675): string {
  const [gelap, sedang, terang] = PALET[indeks % PALET.length];
  const rng = acak(indeks + 7);
  const bentuk: string[] = [];

  for (let i = 0; i < 7; i++) {
    const cx = rng() * lebar;
    const cy = rng() * tinggi;
    const r = 60 + rng() * 220;
    const warna = [sedang, terang, "#ffffff"][i % 3];
    bentuk.push(
      `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="${warna}" opacity="${(0.08 + rng() * 0.16).toFixed(2)}"/>`,
    );
  }
  for (let i = 0; i < 4; i++) {
    const x = rng() * lebar;
    const y = tinggi * 0.55 + rng() * tinggi * 0.4;
    const w = 90 + rng() * 190;
    const h = 70 + rng() * 200;
    bentuk.push(
      `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" rx="14" fill="${terang}" opacity="${(0.1 + rng() * 0.14).toFixed(2)}"/>`,
    );
  }

  const inisial = judul
    .split(/\s+/)
    .filter((k) => k.length > 2)
    .slice(0, 3)
    .map((k) => k[0].toUpperCase())
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lebar} ${tinggi}" width="${lebar}" height="${tinggi}" role="img" aria-label="${escapeXml(judul)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${gelap}"/>
      <stop offset="100%" stop-color="${sedang}"/>
    </linearGradient>
  </defs>
  <rect width="${lebar}" height="${tinggi}" fill="url(#g)"/>
  ${bentuk.join("\n  ")}
  <text x="${lebar / 2}" y="${tinggi / 2 + 26}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="120" font-weight="700" fill="#ffffff" opacity="0.85">${escapeXml(inisial)}</text>
</svg>`;
}

function escapeXml(t: string): string {
  return t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Menulis SVG ke public/contoh dan mengembalikan URL publiknya. */
export function tulisGambar(nama: string, judul: string, indeks: number, rasio: "lanskap" | "kotak" = "lanskap"): string {
  const dir = path.join(process.cwd(), "public", "contoh");
  mkdirSync(dir, { recursive: true });
  const isi = rasio === "kotak" ? svgHias(judul, indeks, 900, 900) : svgHias(judul, indeks);
  writeFileSync(path.join(dir, `${nama}.svg`), isi, "utf8");
  return `/contoh/${nama}.svg`;
}
