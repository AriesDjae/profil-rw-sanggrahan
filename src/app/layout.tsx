import type { Metadata } from "next";
import localFont from "next/font/local";

import { OG_BAWAAN, URL_SITUS } from "@/lib/situs";

import "./globals.css";

// Berkas font disimpan di repositori (src/fonts), bukan diunduh next/font/google
// saat build: build tidak lagi bergantung pada Google, dan pemuat font Google di
// Turbopack 16.3.4 gagal dengan "queries have exactly one entry".

// Judul: grotesk dengan karakter poster kampung, rapat dan tegas.
const judul = localFont({
  variable: "--font-judul",
  display: "swap",
  src: [
    { path: "../fonts/bricolage-grotesque-latin-600-normal.woff2", weight: "600" },
    { path: "../fonts/bricolage-grotesque-latin-700-normal.woff2", weight: "700" },
    { path: "../fonts/bricolage-grotesque-latin-800-normal.woff2", weight: "800" },
  ],
});

// Teks: Gantari, rancangan Lafontype dari Indonesia. Bentuknya bulat dan ramah,
// tetap jelas pada ukuran kecil dan tabel angka.
const teks = localFont({
  variable: "--font-teks",
  display: "swap",
  src: [
    { path: "../fonts/gantari-latin-400-normal.woff2", weight: "400" },
    { path: "../fonts/gantari-latin-500-normal.woff2", weight: "500" },
    { path: "../fonts/gantari-latin-600-normal.woff2", weight: "600" },
    { path: "../fonts/gantari-latin-700-normal.woff2", weight: "700" },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(URL_SITUS),
  title: {
    default: "Kampung Sanggrahan, Portal Informasi Warga",
    template: "%s | Kampung Sanggrahan",
  },
  description:
    "Portal warga Kampung Sanggrahan, Kelurahan Semaki, Kemantren Umbulharjo, Kota Yogyakarta. Satu situs untuk RW 01, RW 02, dan RW 03: berita lingkungan, agenda kegiatan, data kependudukan, dan laporan kas RT yang transparan.",
  openGraph: OG_BAWAAN,
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // Kelas font harus di <html>, bukan <body>: --font-sans di globals.css berada di
    // :root dan merujuk --font-teks. Kalau variabelnya baru ada di <body>, rujukan itu
    // tidak sah dan peramban diam-diam memakai font sistem.
    <html lang="id" className={`${judul.variable} ${teks.variable}`}>
      <body className="font-sans antialiased">
        <a href="#konten" className="tautan-lewati tanpa-cetak">
          Lewati ke konten utama
        </a>
        {children}
      </body>
    </html>
  );
}
