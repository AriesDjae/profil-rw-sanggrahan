import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Batasi akar Turbopack ke folder proyek ini saja
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  experimental: {
    serverActions: {
      // Cukup untuk unggahan foto kegiatan/bukti transaksi. Harus di atas batas
      // 12 MB di src/lib/unggah.ts, sebab pembungkus multipart menambah sedikit
      // dari ukuran berkas aslinya. Batas ini dijaga Next.js sebelum permintaan
      // sampai ke kode kita, jadi kalau lebih kecil dari batas unggahan, foto
      // besar ditolak tanpa pesan yang berguna bagi pengurus.
      bodySizeLimit: "14mb",
    },
  },
};

export default nextConfig;
