"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "@/lib/db";
import type { Peran } from "@/lib/konstanta";
import { buatSesi, hapusSesi } from "@/lib/sesi";

const SkemaMasuk = z.object({
  email: z.string().trim().min(1, "Surel wajib diisi").email("Format surel tidak valid"),
  kataSandi: z.string().min(1, "Kata sandi wajib diisi"),
  next: z.string().optional(),
});

export type StatusMasuk = { galat?: string; email?: string };

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

  const { email, kataSandi, next } = hasil.data;

  const pengguna = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Pesan galat sengaja disamakan agar tidak membocorkan surel terdaftar
  const pesanGagal = "Surel atau kata sandi tidak sesuai.";
  if (!pengguna) return { galat: pesanGagal, email: email0 };

  const cocok = await bcrypt.compare(kataSandi, pengguna.passwordHash);
  if (!cocok) return { galat: pesanGagal, email: email0 };

  if (!pengguna.aktif) {
    return { galat: "Akun Anda dinonaktifkan. Hubungi administrator RW.", email: email0 };
  }

  await buatSesi({
    uid: pengguna.id,
    peran: pengguna.peran as Peran,
    rtId: pengguna.rtId,
    nama: pengguna.nama,
  });

  const tujuan = next && next.startsWith("/") ? next : "/admin";
  redirect(tujuan);
}

export async function keluar() {
  await hapusSesi();
  redirect("/masuk");
}
