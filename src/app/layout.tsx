import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "RW 05 Sanggrahan — Portal Informasi Warga",
    template: "%s | RW 05 Sanggrahan",
  },
  description:
    "Portal resmi RW 05 Sanggrahan: berita lingkungan, agenda kegiatan warga, data kependudukan, dan laporan keuangan kas RT yang transparan.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={`${jakarta.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
