import KerangkaMuat from "@/components/ui/KerangkaMuat";

/**
 * Kerangka muat sengaja hanya membungkus halaman daftar di grup ini, yang tidak
 * mungkin 404. Di bawah loading.tsx tanggapan sudah mulai dikirim sebelum halaman
 * selesai, jadi notFound() di sana dijawab 200. Karena itu halaman rincian seperti
 * /berita/[slug] berada di luar grup ini.
 */
export default function MemuatDaftar() {
  return <KerangkaMuat />;
}
