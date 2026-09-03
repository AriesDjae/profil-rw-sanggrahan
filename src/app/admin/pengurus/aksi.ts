"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { nilaiForm, type HasilAksi } from "@/lib/formulir";
import { PERAN_KONTEN } from "@/lib/konstanta";
import { wajibPeran } from "@/lib/otorisasi";
import { simpanBerkas } from "@/lib/unggah";

export type Hasil = HasilAksi;

function segarkan() {
  revalidatePath("/admin/pengurus");
  revalidatePath("/profil");
}

export async function simpanPengurus(_prev: Hasil, formData: FormData): Promise<Hasil> {
  const nilai = nilaiForm(formData);
  await wajibPeran(PERAN_KONTEN);

  const id = Number(formData.get("id")) || null;
  const nama = String(formData.get("nama") ?? "").trim();
  const jabatan = String(formData.get("jabatan") ?? "").trim();
  const level = String(formData.get("level") ?? "RW");

  if (nama.length < 3) return { galat: "Nama pengurus minimal 3 karakter.", nilai };
  if (!jabatan) return { galat: "Jabatan wajib diisi.", nilai };
  if (!["RW", "RT", "LEMBAGA"].includes(level)) return { galat: "Level tidak valid.", nilai };

  let foto: string | null = null;
  try {
    foto = await simpanBerkas(formData.get("foto") as File | null, "pengurus");
  } catch (e) {
    return { galat: e instanceof Error ? e.message : "Gagal mengunggah foto.", nilai };
  }

  const rtId = Number(formData.get("rtId")) || null;

  const data = {
    nama,
    jabatan,
    level,
    rtId: level === "RT" ? rtId : null,
    telepon: String(formData.get("telepon") ?? "").trim() || null,
    periode: String(formData.get("periode") ?? "").trim() || null,
    urutan: Number(formData.get("urutan")) || 0,
    ...(foto ? { foto } : {}),
  };

  if (id) await db.pengurus.update({ where: { id }, data });
  else await db.pengurus.create({ data });

  segarkan();
  return { sukses: id ? "Data pengurus diperbarui." : "Pengurus ditambahkan." };
}

export async function hapusPengurus(formData: FormData) {
  await wajibPeran(PERAN_KONTEN);
  const id = Number(formData.get("id"));
  await db.pengurus.delete({ where: { id } }).catch(() => null);
  segarkan();
}
