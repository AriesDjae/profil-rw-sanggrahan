import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Batasi akar Turbopack ke folder proyek ini saja
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  experimental: {
    serverActions: {
      // Cukup untuk unggahan foto kegiatan/bukti transaksi (batas per berkas 4 MB)
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
