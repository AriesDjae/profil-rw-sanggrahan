import "server-only";

import { createHash } from "node:crypto";

import { db } from "./db";

/** Batas per surel lebih ketat; satu IP bisa dipakai beberapa pengurus. */
const BATAS_SUREL = 5;
const BATAS_IP = 30;
const JENDELA_MS = 15 * 60 * 1000;
const LAMA_KUNCI_MS = 15 * 60 * 1000;
const UMUR_BARIS_MS = 24 * 60 * 60 * 1000;

export const LAMA_KUNCI_MENIT = LAMA_KUNCI_MS / 60_000;

/** Surel disimpan sebagai hash: salah ketik kadang berisi kata sandi. */
function kunci(jenis: "surel" | "ip", nilai: string): string {
  const hash = createHash("sha256").update(nilai.toLowerCase()).digest("hex");
  return `${jenis}:${hash}`;
}

function daftarKunci(email: string, ip: string | null) {
  const hasil = [{ nilai: kunci("surel", email), batas: BATAS_SUREL }];
  if (ip) hasil.push({ nilai: kunci("ip", ip), batas: BATAS_IP });
  return hasil;
}

export async function sedangTerkunci(email: string, ip: string | null): Promise<boolean> {
  const jumlah = await db.percobaanMasuk.count({
    where: {
      kunci: { in: daftarKunci(email, ip).map((k) => k.nilai) },
      terkunciSampai: { gt: new Date() },
    },
  });
  return jumlah > 0;
}

export async function catatGagalMasuk(email: string, ip: string | null): Promise<void> {
  const sekarang = new Date();

  for (const { nilai, batas } of daftarKunci(email, ip)) {
    // Kenaikan hitungan dikerjakan basis data, jadi percobaan yang bersamaan
    // tidak saling menimpa.
    const baris = await db.percobaanMasuk.upsert({
      where: { kunci: nilai },
      create: { kunci: nilai, jumlah: 1, mulaiAt: sekarang },
      update: { jumlah: { increment: 1 } },
    });

    if (sekarang.getTime() - baris.mulaiAt.getTime() > JENDELA_MS) {
      await db.percobaanMasuk.update({
        where: { kunci: nilai },
        data: { jumlah: 1, mulaiAt: sekarang, terkunciSampai: null },
      });
    } else if (baris.jumlah >= batas) {
      await db.percobaanMasuk.update({
        where: { kunci: nilai },
        data: { terkunciSampai: new Date(sekarang.getTime() + LAMA_KUNCI_MS) },
      });
    }
  }

  await db.percobaanMasuk.deleteMany({
    where: { mulaiAt: { lt: new Date(sekarang.getTime() - UMUR_BARIS_MS) } },
  });
}

/** Hitungan IP sengaja dibiarkan, supaya satu akun sah tidak menghapusnya. */
export async function bersihkanGagalMasuk(email: string): Promise<void> {
  await db.percobaanMasuk.deleteMany({ where: { kunci: kunci("surel", email) } });
}
