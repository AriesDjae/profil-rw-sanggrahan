import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

/**
 * Menyajikan berkas yang diunggah pengurus dari `public/unggahan`.
 *
 * Kenapa perlu rute sendiri, padahal berkasnya sudah berada di `public/`:
 * Next.js mendaftar isi `public/` **saat build**. Foto yang diunggah pengurus
 * ditulis jauh sesudah itu, sehingga `next start` menjawab 404 — foto tampak
 * berhasil diunggah di panel, lalu muncul sebagai gambar rusak bagi warga.
 * Di Vercel hal ini tidak terasa karena unggahan dialihkan ke Vercel Blob dan
 * URL-nya menunjuk ke sana; yang terkena justru pemasangan di VPS sendiri.
 *
 * Rute ini membaca berkasnya dari disk pada saat diminta, jadi berlaku untuk
 * berkas yang baru diunggah semenit lalu sekalipun.
 */

const AKAR = path.join(process.cwd(), "public", "unggahan");

const TIPE: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
};

export async function GET(
  _permintaan: Request,
  { params }: { params: Promise<{ jalur: string[] }> },
) {
  const { jalur } = await params;

  // Tiap potongan alamat diperiksa satu per satu, bukan hasil gabungannya:
  // memeriksa setelah digabung membuka celah bagi "%2e%2e" yang baru menjadi
  // ".." setelah diurai peramban dan kerangka kerja.
  const bersih = jalur.every((p) => /^[A-Za-z0-9._-]+$/.test(p) && p !== "." && p !== "..");
  if (!bersih || jalur.length === 0 || jalur.length > 4) {
    return new Response("Tidak ditemukan", { status: 404 });
  }

  const ekstensi = path.extname(jalur[jalur.length - 1]).toLowerCase();
  const tipe = TIPE[ekstensi];
  if (!tipe) return new Response("Tidak ditemukan", { status: 404 });

  const berkas = path.join(AKAR, ...jalur);

  // Sabuk pengaman kedua: hasil akhirnya harus benar-benar berada di dalam
  // folder unggahan, apa pun yang lolos pemeriksaan di atas.
  if (path.relative(AKAR, berkas).startsWith("..")) {
    return new Response("Tidak ditemukan", { status: 404 });
  }

  let ukuran: number;
  try {
    const info = await stat(berkas);
    if (!info.isFile()) return new Response("Tidak ditemukan", { status: 404 });
    ukuran = info.size;
  } catch {
    return new Response("Tidak ditemukan", { status: 404 });
  }

  const aliran = Readable.toWeb(createReadStream(berkas)) as ReadableStream;

  return new Response(aliran, {
    headers: {
      "Content-Type": tipe,
      "Content-Length": String(ukuran),
      // Nama berkas mengandung cap waktu dan angka acak, jadi tidak pernah
      // dipakai ulang untuk isi yang berbeda — aman disimpan lama.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
