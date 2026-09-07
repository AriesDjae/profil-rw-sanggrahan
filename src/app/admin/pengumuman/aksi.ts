"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { segarkanLamanRw } from "@/lib/rw";
import { nilaiForm, type HasilAksi } from "@/lib/formulir";
import { PERAN_KONTEN } from "@/lib/konstanta";
import { rwUntukBarisBaru, seRw, wajibPeran } from "@/lib/otorisasi";

export type Hasil = HasilAksi;

async function segarkan() {
  revalidatePath("/admin/pengumuman");
  revalidatePath("/");
  // Beranda tiap RW dibangun statis dengan masa berlaku lima menit. Tanpa baris
  // ini, pengurus yang baru menyimpan perubahan membuka laman RW-nya dan tidak
  // melihat apa-apa selama beberapa menit — lalu mengira simpanannya gagal.
  await segarkanLamanRw();

}

export async function simpanPengumuman(_prev: Hasil, formData: FormData): Promise<Hasil> {
  const nilai = nilaiForm(formData);
  const pengguna = await wajibPeran(PERAN_KONTEN);

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

  if (id) {
    const lama = await db.pengumuman.findUnique({ where: { id } });
    if (!lama) return { galat: "Pengumuman tidak ditemukan.", nilai };
    if (!seRw(pengguna, lama.rwId)) {
      return { galat: "Pengumuman ini berada di luar kewenangan Anda.", nilai };
    }
  }

  const rwId = rwUntukBarisBaru(pengguna, Number(formData.get("rwId")) || null);

  const data = {
    rwId,
    judul,
    isi,
    berakhir,
    penting: formData.get("penting") === "on",
    aktif: formData.get("aktif") === "on",
  };

  if (id) await db.pengumuman.update({ where: { id }, data });
  else await db.pengumuman.create({ data });

  await segarkan();
  return { sukses: id ? "Pengumuman diperbarui." : "Pengumuman ditambahkan." };
}

export async function hapusPengumuman(formData: FormData) {
  const pengguna = await wajibPeran(PERAN_KONTEN);
  const id = Number(formData.get("id"));
  const lama = await db.pengumuman.findUnique({ where: { id } });
  if (!lama || !seRw(pengguna, lama.rwId)) return;

  await db.pengumuman.delete({ where: { id } }).catch(() => null);
  await segarkan();
}

export async function alihkanAktif(formData: FormData) {
  const pengguna = await wajibPeran(PERAN_KONTEN);
  const id = Number(formData.get("id"));
  const p = await db.pengumuman.findUnique({ where: { id } });
  if (!p || !seRw(pengguna, p.rwId)) return;
  await db.pengumuman.update({ where: { id }, data: { aktif: !p.aktif } });
  await segarkan();
}
