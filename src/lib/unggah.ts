import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

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

const BATAS_BYTE = 4 * 1024 * 1024; // 4 MB

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
  if (berkas.size > BATAS_BYTE) {
    throw new Error("Ukuran berkas melebihi 4 MB.");
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

  const ekstensi = periksa(berkas);
  const aman = folder.replace(/[^a-z0-9-]/gi, "");
  const nama = `${Date.now()}-${randomBytes(4).toString("hex")}${ekstensi}`;

  if (pakaiBlob()) {
    const { put } = await import("@vercel/blob");
    const hasil = await put(`${aman}/${nama}`, berkas, {
      access: "public",
      contentType: berkas.type,
    });
    return hasil.url;
  }

  const dir = path.join(process.cwd(), "public", "unggahan", aman);
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await berkas.arrayBuffer());
  await writeFile(path.join(dir, nama), buffer);

  return `/unggahan/${aman}/${nama}`;
}
