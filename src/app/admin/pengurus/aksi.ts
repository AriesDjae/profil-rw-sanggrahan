"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { segarkanLamanRw } from "@/lib/rw";
import { nilaiForm, type HasilAksi } from "@/lib/formulir";
import { LEVEL_PENGURUS, PERAN_KONTEN } from "@/lib/konstanta";
import { lingkupRw, rwUntukBarisBaru, seRw, wajibPeran } from "@/lib/otorisasi";
import { simpanBerkas } from "@/lib/unggah";

export type Hasil = HasilAksi;

async function segarkan() {
  revalidatePath("/admin/pengurus");
  revalidatePath("/profil");
  // Beranda tiap RW dibangun statis dengan masa berlaku lima menit. Tanpa baris
  // ini, pengurus yang baru menyimpan perubahan membuka laman RW-nya dan tidak
  // melihat apa-apa selama beberapa menit — lalu mengira simpanannya gagal.
  await segarkanLamanRw();

}

export async function simpanPengurus(_prev: Hasil, formData: FormData): Promise<Hasil> {
  const nilai = nilaiForm(formData);
  const pengguna = await wajibPeran(PERAN_KONTEN);

  const id = Number(formData.get("id")) || null;
  const nama = String(formData.get("nama") ?? "").trim();
  const jabatan = String(formData.get("jabatan") ?? "").trim();
  const level = String(formData.get("level") ?? "RW");

  if (nama.length < 3) return { galat: "Nama pengurus minimal 3 karakter.", nilai };
  if (!jabatan) return { galat: "Jabatan wajib diisi.", nilai };
  if (![LEVEL_PENGURUS.KAMPUNG, LEVEL_PENGURUS.RW, LEVEL_PENGURUS.RT, "LEMBAGA"].includes(level)) {
    return { galat: "Level tidak valid.", nilai };
  }
  // Kepengurusan tingkat kampung menaungi ketiga RW, jadi hanya ADMIN yang boleh
  // menyusunnya.
  if (level === LEVEL_PENGURUS.KAMPUNG && lingkupRw(pengguna) !== null) {
    return { galat: "Hanya administrator kampung yang mendaftar pengurus tingkat kampung.", nilai };
  }

  if (id) {
    const lama = await db.pengurus.findUnique({ where: { id } });
    if (!lama) return { galat: "Data pengurus tidak ditemukan.", nilai };
    if (!seRw(pengguna, lama.rwId)) {
      return { galat: "Pengurus ini terdaftar di RW lain.", nilai };
    }
  }

  let foto: string | null = null;
  try {
    foto = await simpanBerkas(formData.get("foto") as File | null, "pengurus");
  } catch (e) {
    return { galat: e instanceof Error ? e.message : "Gagal mengunggah foto.", nilai };
  }

  const rtId = Number(formData.get("rtId")) || null;
  const rwId =
    level === LEVEL_PENGURUS.KAMPUNG
      ? null
      : rwUntukBarisBaru(pengguna, Number(formData.get("rwId")) || null);

  // RT yang dipilih harus berada di RW yang sama, kalau tidak namanya muncul di
  // laman RW yang bukan tempatnya bertugas.
  if (level === LEVEL_PENGURUS.RT && rtId) {
    const rt = await db.rt.findUnique({ where: { id: rtId }, select: { rwId: true } });
    if (!rt) return { galat: "RT yang dipilih tidak ditemukan.", nilai };
    if (rwId !== null && rt.rwId !== rwId) {
      return { galat: "RT yang dipilih bukan bagian dari RW tersebut.", nilai };
    }
  }

  const data = {
    nama,
    jabatan,
    level,
    rwId,
    rtId: level === LEVEL_PENGURUS.RT ? rtId : null,
    telepon: String(formData.get("telepon") ?? "").trim() || null,
    periode: String(formData.get("periode") ?? "").trim() || null,
    urutan: Number(formData.get("urutan")) || 0,
    ...(foto ? { foto } : {}),
  };

  if (id) await db.pengurus.update({ where: { id }, data });
  else await db.pengurus.create({ data });

  await segarkan();
  return { sukses: id ? "Data pengurus diperbarui." : "Pengurus ditambahkan." };
}

export async function hapusPengurus(formData: FormData) {
  const pengguna = await wajibPeran(PERAN_KONTEN);
  const id = Number(formData.get("id"));
  const lama = await db.pengurus.findUnique({ where: { id } });
  if (!lama || !seRw(pengguna, lama.rwId)) return;

  await db.pengurus.delete({ where: { id } }).catch(() => null);
  await segarkan();
}
