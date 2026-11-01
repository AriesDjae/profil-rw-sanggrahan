/**
 * Alamat kanonik situs: dasar tautan pada sitemap, robots.txt, dan tag Open Graph.
 *
 * Bisa ditimpa lewat env `NEXT_PUBLIC_SITE_URL`, misalnya saat situs pindah ke
 * domain kelurahan atau dipasang di VPS sendiri.
 */
export const URL_SITUS = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://profil-rw-sanggrahan.vercel.app"
).replace(/\/+$/, "");

/**
 * Judul dan deskripsi sengaja tidak ada di sini. Next.js mengisinya dari judul
 * tiap halaman; kalau diisi, semua tautan yang dibagikan bertajuk beranda.
 */
export const OG_BAWAAN = {
  siteName: "Kampung Sanggrahan",
  locale: "id_ID",
  type: "website",
} as const;

/**
 * Tambahan metadata agar foto sebuah tulisan ikut tampil saat tautannya dibagikan.
 *
 * Next.js menimpa seluruh objek `openGraph` milik induk, jadi nilai bawaan harus
 * ikut disertakan. WhatsApp dan Facebook tidak membaca SVG, sehingga gambar contoh
 * dilewati dan halaman itu tetap memakai opengraph-image bawaan situs.
 */
export function gambarBagikan(url: string | null | undefined) {
  if (!url || url.toLowerCase().endsWith(".svg")) return undefined;
  return { openGraph: { ...OG_BAWAAN, images: [url] } };
}
