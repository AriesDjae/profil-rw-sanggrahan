"use server";

import { randomUUID } from "node:crypto";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "@/lib/db";
import type { Peran } from "@/lib/konstanta";
import {
  LAMA_KUNCI_MENIT,
  bersihkanGagalMasuk,
  catatGagalMasuk,
  sedangTerkunci,
} from "@/lib/pembatasMasuk";
import { buatSesi, hapusSesi } from "@/lib/sesi";
import { tujuanAman } from "@/lib/tautanAman";

const SkemaMasuk = z.object({
  email: z.string().trim().min(1, "Surel wajib diisi").email("Format surel tidak valid"),
  kataSandi: z.string().min(1, "Kata sandi wajib diisi"),
  next: z.string().optional(),
});

export type StatusMasuk = { galat?: string; email?: string };

let hashTipuan: string | undefined;

/**
 * Surel tak dikenal tetap menjalani bcrypt. Tanpa ini, jawabannya lebih cepat
 * daripada surel terdaftar, dan daftar akun bisa ditebak dari lamanya respons.
 */
async function hashPembanding(hash?: string): Promise<string> {
  if (hash) return hash;
  hashTipuan ??= await bcrypt.hash(randomUUID(), 10);
  return hashTipuan;
}

async function alamatIp(): Promise<string | null> {
  const daftar = await headers();
  return daftar.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

export async function masuk(
  _sebelumnya: StatusMasuk,
  formData: FormData,
): Promise<StatusMasuk> {
  const email0 = String(formData.get("email") ?? "");
  const hasil = SkemaMasuk.safeParse({
    email: formData.get("email"),
    kataSandi: formData.get("kataSandi"),
    next: formData.get("next") ?? undefined,
  });

  if (!hasil.success) {
    return { galat: hasil.error.issues[0]?.message ?? "Data tidak valid", email: email0 };
  }

  const { kataSandi, next } = hasil.data;
  const email = hasil.data.email.toLowerCase();
  const ip = await alamatIp();

  if (await sedangTerkunci(email, ip)) {
    return {
      galat: `Terlalu banyak percobaan masuk. Coba lagi dalam ${LAMA_KUNCI_MENIT} menit.`,
      email: email0,
    };
  }

  const pengguna = await db.user.findUnique({
    where: { email },
    include: { rt: { select: { rwId: true } } },
  });

  const cocok = await bcrypt.compare(kataSandi, await hashPembanding(pengguna?.passwordHash));

  if (!pengguna || !cocok) {
    await catatGagalMasuk(email, ip);
    // Pesan galat sengaja disamakan agar tidak membocorkan surel terdaftar
    return { galat: "Surel atau kata sandi tidak sesuai.", email: email0 };
  }

  if (!pengguna.aktif) {
    return { galat: "Akun Anda dinonaktifkan. Hubungi administrator RW.", email: email0 };
  }

  await bersihkanGagalMasuk(email);

  await buatSesi({
    uid: pengguna.id,
    peran: pengguna.peran as Peran,
    // RT yang menentukan RW bagi pengurus RT; sisanya memakai kolomnya sendiri.
    rwId: pengguna.rt ? pengguna.rt.rwId : pengguna.rwId,
    rtId: pengguna.rtId,
    nama: pengguna.nama,
  });

  redirect(tujuanAman(next));
}

export async function keluar() {
  await hapusSesi();
  redirect("/masuk");
}
