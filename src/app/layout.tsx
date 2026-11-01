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

// Teks: sedikit menyempit, terbaca pada layar kecil dan tabel angka.
const teks = localFont({
  variable: "--font-teks",
  display: "swap",
  src: [
    { path: "../fonts/instrument-sans-latin-400-normal.woff2", weight: "400" },
    { path: "../fonts/instrument-sans-latin-500-normal.woff2", weight: "500" },
    { path: "../fonts/instrument-sans-latin-600-normal.woff2", weight: "600" },
    { path: "../fonts/instrument-sans-latin-700-normal.woff2", weight: "700" },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(URL_SITUS),
  title: {
    default: "Kampung Sanggrahan — Portal Informasi Warga",
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
    <html lang="id">
      <body className={`${judul.variable} ${teks.variable} font-sans antialiased`}>
        <a href="#konten" className="tautan-lewati tanpa-cetak">
          Lewati ke konten utama
        </a>
        {children}
      </body>
    </html>
  );
}
