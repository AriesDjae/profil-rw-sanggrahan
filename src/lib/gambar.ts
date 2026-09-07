import "server-only";

/**
 * Mengecilkan foto sebelum disimpan.
 *
 * Foto dari HP pengurus lazimnya 3-5 MB dan berukuran 4000px lebih, padahal
 * situs tidak pernah menampilkannya lebih lebar dari sekitar 1600px. Menyimpan
 * berkas mentahnya berarti membayar penyimpanan dan kuota unduh untuk piksel
 * yang tidak pernah dilihat siapa pun. Di sini foto dikecilkan sekali saat
 * diunggah, lalu disimpan sebagai WEBP.
 *
 * Efek sampingnya disengaja: sharp membuang metadata EXIF, termasuk titik
 * koordinat GPS yang ikut tertanam pada foto dari HP. Alamat rumah warga tidak
 * ikut terbawa ke situs.
 */

/** Tipe yang aman dikecilkan. GIF sengaja tidak masuk supaya animasinya utuh. */
export const DAPAT_DIKECILKAN = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

/** Sisi terpanjang setelah dikecilkan. Cukup untuk layar lebar dan cetak layar. */
const SISI_MAKS = 1600;

/** Mutu WEBP. 80 praktis tidak terbedakan dari aslinya pada foto. */
const MUTU = 80;

export type HasilOptimasi = {
  data: Buffer;
  tipe: string;
  ekstensi: string;
};

/**
 * Mengembalikan versi kecil dari sebuah foto, atau null bila tipenya memang
 * tidak dikecilkan, hasilnya justru lebih besar, atau berkasnya gagal dibaca.
 * Pemanggil yang menerima null menyimpan berkas aslinya.
 */
export async function optimasiGambar(
  asal: Buffer,
  tipe: string,
): Promise<HasilOptimasi | null> {
  if (!DAPAT_DIKECILKAN.has(tipe)) return null;

  const { default: sharp } = await import("sharp");

  try {
    const data = await sharp(asal, { failOn: "none" })
      // Diputar dulu mengikuti EXIF, sebab metadatanya hilang setelah ini.
      .rotate()
      .resize({
        width: SISI_MAKS,
        height: SISI_MAKS,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: MUTU })
      .toBuffer();

    // Berkas yang sudah rapi kadang justru membengkak setelah disandikan ulang.
    if (data.byteLength >= asal.byteLength) return null;

    return { data, tipe: "image/webp", ekstensi: ".webp" };
  } catch {
    // Berkas rusak atau format yang tidak terbaca sharp. Biar pemanggilnya yang
    // memutuskan: berkas kecil disimpan apa adanya, yang besar ditolak.
    return null;
  }
}
