import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";

import "./globals.css";

// Judul: grotesk dengan karakter poster kampung, rapat dan tegas.
const judul = Bricolage_Grotesque({
  variable: "--font-judul",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700", "800"],
});

// Teks: sedikit menyempit, terbaca pada layar kecil dan tabel angka.
const teks = Instrument_Sans({
  variable: "--font-teks",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Kampung Sanggrahan — Portal Informasi Warga",
    template: "%s | Kampung Sanggrahan",
  },
  description:
    "Portal warga Kampung Sanggrahan, Kelurahan Semaki, Kemantren Umbulharjo, Kota Yogyakarta. Satu situs untuk RW 01, RW 02, dan RW 03: berita lingkungan, agenda kegiatan, data kependudukan, dan laporan kas RT yang transparan.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={`${judul.variable} ${teks.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
