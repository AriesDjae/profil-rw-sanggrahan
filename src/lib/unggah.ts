import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

import { DAPAT_DIKECILKAN, optimasiGambar } from "./gambar";

const TIPE_DIIZINKAN = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const EKSTENSI: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
};

/** Foto boleh besar karena dikecilkan dulu sebelum disimpan. */
const BATAS_GAMBAR = 12 * 1024 * 1024; // 12 MB
/** GIF dan PDF disimpan apa adanya, jadi batasnya tetap ketat. */
const BATAS_BERKAS = 4 * 1024 * 1024; // 4 MB

/**
 * Penyimpanan berkas dengan dua tujuan:
 *
 * - Bila `BLOB_READ_WRITE_TOKEN` tersedia (mis. di Vercel), berkas diunggah ke
 *   Vercel Blob karena sistem berkas Vercel bersifat hanya-baca dan sementara.
 * - Bila tidak, berkas ditulis ke public/unggahan seperti biasa. Ini yang
 *   dipakai saat pengembangan di komputer maupun saat dipasang di VPS sendiri.
 *
 * Keduanya mengembalikan URL yang langsung bisa dipasang pada atribut src.
 */
function pakaiBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function periksa(berkas: File): string {
  if (!TIPE_DIIZINKAN.has(berkas.type)) {
    throw new Error("Tipe berkas tidak didukung. Gunakan JPG, PNG, WEBP, GIF, atau PDF.");
  }

  const batas = DAPAT_DIKECILKAN.has(berkas.type) ? BATAS_GAMBAR : BATAS_BERKAS;
  if (berkas.size > batas) {
    throw new Error(`Ukuran berkas melebihi ${Math.round(batas / 1024 / 1024)} MB.`);
  }

  return EKSTENSI[berkas.type];
}

/**
 * Menyimpan berkas unggahan dan mengembalikan URL publiknya.
 * Mengembalikan null bila tidak ada berkas dipilih.
 */
export async function simpanBerkas(
  berkas: File | null,
  folder: string,
): Promise<string | null> {
  if (!berkas || typeof berkas === "string" || berkas.size === 0) return null;

  let ekstensi = periksa(berkas);
  let tipe = berkas.type;
  let isi: Buffer = Buffer.from(await berkas.arrayBuffer());

  const kecil = await optimasiGambar(isi, tipe);
  if (kecil) {
    isi = kecil.data;
    tipe = kecil.tipe;
    ekstensi = kecil.ekstensi;
  } else if (isi.byteLength > BATAS_BERKAS) {
    // Foto besar yang gagal dikecilkan tidak boleh lolos lewat batas longgar
    // yang tadi diberikan justru karena foto itu mestinya bisa dikecilkan.
    throw new Error(
      "Foto tidak dapat diproses. Coba simpan ulang sebagai JPG, lalu unggah lagi.",
    );
  }

  const aman = folder.replace(/[^a-z0-9-]/gi, "");
  const nama = `${Date.now()}-${randomBytes(4).toString("hex")}${ekstensi}`;

  if (pakaiBlob()) {
    const { put } = await import("@vercel/blob");
    const hasil = await put(`${aman}/${nama}`, isi, {
      access: "public",
      contentType: tipe,
    });
    return hasil.url;
  }

  // Di Vercel sistem berkas hanya-baca, jadi kegagalan dijelaskan apa adanya
  // alih-alih memunculkan galat sistem berkas yang membingungkan pengurus.
  if (process.env.VERCEL) {
    throw new Error(
      "Penyimpanan berkas belum disiapkan pada lingkungan ini. Hubungkan Vercel Blob, lalu coba lagi.",
    );
  }

  const dir = path.join(process.cwd(), "public", "unggahan", aman);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, nama), isi);

  return `/unggahan/${aman}/${nama}`;
}
