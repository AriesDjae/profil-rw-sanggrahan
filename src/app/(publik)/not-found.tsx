import type { Metadata } from "next";

import TidakDitemukan from "@/components/ui/TidakDitemukan";

export const metadata: Metadata = { title: "Halaman tidak ditemukan" };

/** 404 untuk isi yang tidak ada, misalnya berita terhapus. Kop dan kaki tetap tampil. */
export default function IsiTidakDitemukan() {
  return <TidakDitemukan />;
}
