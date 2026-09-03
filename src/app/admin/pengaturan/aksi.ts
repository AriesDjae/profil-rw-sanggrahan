"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { nilaiForm, type HasilAksi } from "@/lib/formulir";
import { PERAN, type Peran } from "@/lib/konstanta";
import { wajibPeran } from "@/lib/otorisasi";
import { simpanBerkas } from "@/lib/unggah";

export type Hasil = HasilAksi;

const PENGELOLA: Peran[] = [PERAN.ADMIN, PERAN.KETUA_RW];

function segarkan() {
  revalidatePath("/", "layout");
}

export async function simpanPengaturan(_prev: Hasil, formData: FormData): Promise<Hasil> {
  const nilai = nilaiForm(formData);
  await wajibPeran(PENGELOLA);

  const namaRw = String(formData.get("namaRw") ?? "").trim();
  if (namaRw.length < 3) return { galat: "Nama RW minimal 3 karakter.", nilai };

  let heroFoto: string | null = null;
  try {
    heroFoto = await simpanBerkas(formData.get("heroFoto") as File | null, "situs");
  } catch (e) {
    return { galat: e instanceof Error ? e.message : "Gagal mengunggah gambar.", nilai };
  }

  const data = {
    namaRw,
    tagline: String(formData.get("tagline") ?? "").trim(),
    deskripsi: String(formData.get("deskripsi") ?? "").trim(),
    sejarah: String(formData.get("sejarah") ?? "").trim(),
    visi: String(formData.get("visi") ?? "").trim(),
    misi: String(formData.get("misi") ?? "").trim(),
    alamat: String(formData.get("alamat") ?? "").trim(),
    telepon: String(formData.get("telepon") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    ...(heroFoto ? { heroFoto } : {}),
  };

  await db.pengaturan.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });

  segarkan();
  return { sukses: "Pengaturan situs tersimpan." };
}

export async function simpanRt(_prev: Hasil, formData: FormData): Promise<Hasil> {
  const nilai = nilaiForm(formData);
  await wajibPeran(PENGELOLA);

  const id = Number(formData.get("id")) || null;
  const nomor = String(formData.get("nomor") ?? "").trim();
  if (!/^\d{1,3}$/.test(nomor)) return { galat: "Nomor RT harus berupa angka, misalnya 01.", nilai };

  const kembar = await db.rt.findUnique({ where: { nomor } });
  if (kembar && kembar.id !== id) return { galat: `RT ${nomor} sudah terdaftar.` };

  const data = {
    nomor,
    nama: String(formData.get("nama") ?? "").trim() || `RT ${nomor}`,
    wilayah: String(formData.get("wilayah") ?? "").trim() || null,
  };

  if (id) await db.rt.update({ where: { id }, data });
  else await db.rt.create({ data });

  segarkan();
  return { sukses: id ? "Data RT diperbarui." : `RT ${nomor} ditambahkan.` };
}

export async function hapusRt(formData: FormData) {
  await wajibPeran(PENGELOLA);
  const id = Number(formData.get("id"));

  const jumlahWarga = await db.warga.count({ where: { rtId: id } });
  const jumlahLaporan = await db.laporanKeuangan.count({ where: { rtId: id } });
  if (jumlahWarga > 0 || jumlahLaporan > 0) return;

  await db.rt.delete({ where: { id } }).catch(() => null);
  segarkan();
}
