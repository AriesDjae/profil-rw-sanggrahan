import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "./db";

/**
 * Pembantu REST API publik (/api/v1).
 *
 * API ini hanya-baca dan hanya menyajikan data yang memang sudah tampil di
 * situs: konten terbit dan laporan kas yang disetujui Ketua RW. Data warga
 * perorangan dan laporan yang masih berproses tidak punya jalur di sini.
 */

const HEADER_PUBLIK = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

export function jawab<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json(meta ? { data, meta } : { data }, { headers: HEADER_PUBLIK });
}

export function galat(status: number, kode: string, pesan: string, rincian?: unknown) {
  return NextResponse.json(
    { galat: { kode, pesan, ...(rincian ? { rincian } : {}) } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

/** Membungkus handler supaya galat tak terduga tetap berbentuk JSON yang sama. */
export function aman<A extends unknown[]>(handler: (...argumen: A) => Promise<Response>) {
  return async (...argumen: A): Promise<Response> => {
    try {
      return await handler(...argumen);
    } catch (e) {
      console.error("[api/v1]", e);
      return galat(500, "GALAT_SERVER", "Terjadi kesalahan di server.");
    }
  };
}

const PER_HALAMAN_MAKS = 50;

export const SkemaHalaman = z.object({
  halaman: z.coerce.number().int().min(1).default(1),
  per_halaman: z.coerce.number().int().min(1).max(PER_HALAMAN_MAKS).default(20),
});

export const SkemaRw = z.object({
  rw: z.coerce.number().int().min(1).optional(),
});

/** Membaca kueri alamat. Mengembalikan data, atau jawaban 400 yang siap dikirim. */
export function bacaKueri<S extends z.ZodType>(skema: S, permintaan: Request) {
  const kueri = Object.fromEntries(new URL(permintaan.url).searchParams);
  const hasil = skema.safeParse(kueri);
  if (hasil.success) return { data: hasil.data as z.output<S>, jawaban: null };

  const rincian = hasil.error.issues.map((i) => ({
    bidang: i.path.join("."),
    pesan: i.message,
  }));
  return { data: null, jawaban: galat(400, "KUERI_TIDAK_VALID", "Kueri tidak valid.", rincian) };
}

export function metaHalaman(halaman: number, perHalaman: number, total: number) {
  return {
    halaman,
    per_halaman: perHalaman,
    total,
    total_halaman: Math.ceil(total / perHalaman),
  };
}

/**
 * Menerjemahkan nomor RW di alamat (1, 2, 3) menjadi id barisnya.
 * `rwId: null` berarti tanpa saring; `null` berarti RW itu tidak ada.
 */
export async function cariRw(nomor?: number): Promise<{ rwId: number | null } | null> {
  if (nomor === undefined) return { rwId: null };
  const rw = await db.rw.findFirst({ where: { nomor, aktif: true }, select: { id: true } });
  return rw ? { rwId: rw.id } : null;
}

export const rwTidakAda = () => galat(404, "RW_TIDAK_DITEMUKAN", "RW tidak ditemukan.");
