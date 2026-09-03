"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { nilaiForm, type HasilAksi } from "@/lib/formulir";
import { PERAN_KONTEN } from "@/lib/konstanta";
import { wajibPeran } from "@/lib/otorisasi";

export type Hasil = HasilAksi;

function segarkan() {
  revalidatePath("/admin/pengumuman");
  revalidatePath("/");
}

export async function simpanPengumuman(_prev: Hasil, formData: FormData): Promise<Hasil> {
  const nilai = nilaiForm(formData);
  await wajibPeran(PERAN_KONTEN);

  const id = Number(formData.get("id")) || null;
  const judul = String(formData.get("judul") ?? "").trim();
  const isi = String(formData.get("isi") ?? "").trim();
  const berakhirTeks = String(formData.get("berakhir") ?? "");

  if (judul.length < 5) return { galat: "Judul pengumuman minimal 5 karakter.", nilai };
  if (isi.length < 10) return { galat: "Isi pengumuman minimal 10 karakter.", nilai };

  let berakhir: Date | null = null;
  if (berakhirTeks) {
    berakhir = new Date(`${berakhirTeks}T23:59:59`);
    if (Number.isNaN(berakhir.getTime())) return { galat: "Tanggal berakhir tidak valid.", nilai };
  }

  const data = {
    judul,
    isi,
    berakhir,
    penting: formData.get("penting") === "on",
    aktif: formData.get("aktif") === "on",
  };

  if (id) await db.pengumuman.update({ where: { id }, data });
  else await db.pengumuman.create({ data });

  segarkan();
  return { sukses: id ? "Pengumuman diperbarui." : "Pengumuman ditambahkan." };
}

export async function hapusPengumuman(formData: FormData) {
  await wajibPeran(PERAN_KONTEN);
  const id = Number(formData.get("id"));
  await db.pengumuman.delete({ where: { id } }).catch(() => null);
  segarkan();
}

export async function alihkanAktif(formData: FormData) {
  await wajibPeran(PERAN_KONTEN);
  const id = Number(formData.get("id"));
  const p = await db.pengumuman.findUnique({ where: { id } });
  if (!p) return;
  await db.pengumuman.update({ where: { id }, data: { aktif: !p.aktif } });
  segarkan();
}
