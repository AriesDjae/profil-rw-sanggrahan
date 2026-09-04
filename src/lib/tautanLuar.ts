/**
 * Situs warga lain yang berdiri sendiri tetapi melayani warga yang sama.
 *
 * Registri Usaha Warga Sanggrahan adalah aplikasi terpisah dengan basis data
 * dan panel pengurusnya sendiri. Yang menghubungkan keduanya hanyalah tautan
 * di kop dan kaki halaman — warga yang datang ke sini mencari usaha tetangga
 * berhak diantar ke sana, bukan dibiarkan buntu.
 *
 * Alamatnya bisa ditimpa lewat env `NEXT_PUBLIC_URL_UMKM` tanpa mengubah kode,
 * misalnya saat situs itu pindah ke domain kelurahan.
 */
export const UMKM = {
  nama: "Usaha Warga Sanggrahan",
  ringkas: "Usaha Warga",
  keterangan: "Registri UMKM dan jasa warga RW 1 dan RW 3",
  url: process.env.NEXT_PUBLIC_URL_UMKM || "https://umkm-sanggrahan.vercel.app",
} as const;
