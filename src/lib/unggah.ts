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
 * Menyimpan berkas unggahan ke public/unggahan/<folder> dan mengembalikan URL publik.
 * Mengembalikan null bila tidak ada berkas dipilih.
 */
export async function simpanBerkas(
  berkas: File | null,
  folder: string,
): Promise<string | null> {
  if (!berkas || typeof berkas === "string" || berkas.size === 0) return null;

  if (!TIPE_DIIZINKAN.has(berkas.type)) {
    throw new Error("Tipe berkas tidak didukung. Gunakan JPG, PNG, WEBP, GIF, atau PDF.");
  }
  if (berkas.size > BATAS_BYTE) {
    throw new Error("Ukuran berkas melebihi 4 MB.");
  }

  const aman = folder.replace(/[^a-z0-9-]/gi, "");
  const dir = path.join(process.cwd(), "public", "unggahan", aman);
  await mkdir(dir, { recursive: true });

  const nama = `${Date.now()}-${randomBytes(4).toString("hex")}${EKSTENSI[berkas.type]}`;
  const buffer = Buffer.from(await berkas.arrayBuffer());
  await writeFile(path.join(dir, nama), buffer);

  return `/unggahan/${aman}/${nama}`;
}
