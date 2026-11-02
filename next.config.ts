import path from "node:path";
import type { NextConfig } from "next";

const pengembangan = process.env.NODE_ENV === "development";

/**
 * Content-Security-Policy tanpa nonce. Nonce mewajibkan setiap halaman dirender
 * per permintaan, padahal halaman publik sengaja disajikan dari cache. Harganya,
 * `'unsafe-inline'` tetap dibutuhkan untuk skrip sebaris buatan Next.js; yang
 * dijaga di sini adalah asal skrip, gambar, formulir, dan bingkai dari luar.
 */
const KEBIJAKAN_KONTEN = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${pengembangan ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://tile.openstreetmap.org",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // Batasi akar Turbopack ke folder proyek ini saja
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  images: {
    // Unggahan pengurus tersimpan di Vercel Blob.
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
    // Foto sudah dikecilkan ke lebar 1600px saat diunggah (src/lib/gambar.ts).
    deviceSizes: [640, 828, 1080, 1200, 1600],
    // Nama berkas unggahan acak dan tidak pernah ditimpa, jadi aman disimpan lama.
    minimumCacheTTL: 60 * 60 * 24 * 31,
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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: KEBIJAKAN_KONTEN },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
