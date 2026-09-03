"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { nilaiForm, type HasilAksi } from "@/lib/formulir";
import { PERAN, PERAN_TERIKAT_RT, type Peran } from "@/lib/konstanta";
import { wajibPeran } from "@/lib/otorisasi";

export type Hasil = HasilAksi;

const PENGELOLA: Peran[] = [PERAN.ADMIN, PERAN.KETUA_RW];

function segarkan() {
  revalidatePath("/admin/pengguna");
}

export async function simpanPengguna(_prev: Hasil, formData: FormData): Promise<Hasil> {
  const nilai = nilaiForm(formData);
  await wajibPeran(PENGELOLA);

  const id = Number(formData.get("id")) || null;
  const nama = String(formData.get("nama") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const peran = String(formData.get("peran") ?? "");
  const kataSandi = String(formData.get("kataSandi") ?? "");

  if (nama.length < 3) return { galat: "Nama minimal 3 karakter.", nilai };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { galat: "Format surel tidak valid.", nilai };
  if (!Object.values(PERAN).includes(peran as Peran)) return { galat: "Peran tidak valid.", nilai };

  const rtId = Number(formData.get("rtId")) || null;
  if (PERAN_TERIKAT_RT.includes(peran as Peran) && !rtId) {
    return { galat: "Ketua RT dan Bendahara RT wajib terhubung dengan satu RT.", nilai };
  }

  const kembar = await db.user.findUnique({ where: { email } });
  if (kembar && kembar.id !== id) return { galat: "Surel tersebut sudah digunakan.", nilai };

  if (!id && kataSandi.length < 8) {
    return { galat: "Kata sandi awal minimal 8 karakter.", nilai };
  }
  if (id && kataSandi && kataSandi.length < 8) {
    return { galat: "Kata sandi baru minimal 8 karakter.", nilai };
  }

  const data = {
    nama,
    email,
    peran,
    rtId: PERAN_TERIKAT_RT.includes(peran as Peran) ? rtId : null,
    jabatan: String(formData.get("jabatan") ?? "").trim() || null,
    telepon: String(formData.get("telepon") ?? "").trim() || null,
    aktif: formData.get("aktif") === "on",
    ...(kataSandi ? { passwordHash: await bcrypt.hash(kataSandi, 10) } : {}),
  };

  if (id) {
    await db.user.update({ where: { id }, data });
  } else {
    await db.user.create({
      data: { ...data, passwordHash: await bcrypt.hash(kataSandi, 10) },
    });
  }

  segarkan();
  redirect(
    `/admin/pengguna?pesan=${encodeURIComponent(id ? "Akun diperbarui." : "Akun baru dibuat.")}`,
  );
}

export async function alihkanAktifPengguna(formData: FormData) {
  const pengelola = await wajibPeran(PENGELOLA);
  const id = Number(formData.get("id"));
  if (id === pengelola.id) return;

  const u = await db.user.findUnique({ where: { id } });
  if (!u) return;

  await db.user.update({ where: { id }, data: { aktif: !u.aktif } });
  segarkan();
}

export async function hapusPengguna(formData: FormData) {
  const pengelola = await wajibPeran(PENGELOLA);
  const id = Number(formData.get("id"));

  if (id === pengelola.id) {
    redirect("/admin/pengguna?galat=Anda tidak dapat menghapus akun sendiri.");
  }

  const target = await db.user.findUnique({ where: { id } });
  if (!target) return;

  if (target.peran === PERAN.ADMIN) {
    const jumlahAdmin = await db.user.count({ where: { peran: PERAN.ADMIN } });
    if (jumlahAdmin <= 1) {
      redirect("/admin/pengguna?galat=Administrator terakhir tidak dapat dihapus.");
    }
  }

  await db.user.delete({ where: { id } });
  segarkan();
  redirect("/admin/pengguna?pesan=Akun dihapus.");
}
