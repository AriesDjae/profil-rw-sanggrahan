"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { segarkanLamanRw } from "@/lib/rw";
import { nilaiForm, type HasilAksi } from "@/lib/formulir";
import { PERAN_KONTEN } from "@/lib/konstanta";
import { rwUntukBarisBaru, seRw, wajibPeran } from "@/lib/otorisasi";
import { slugUnik } from "@/lib/slug";
import { simpanBerkas } from "@/lib/unggah";

export type Hasil = HasilAksi;

const STATUS_SAH = ["DRAFT", "TERBIT", "SELESAI", "BATAL"];

async function segarkan(slug?: string) {
  revalidatePath("/admin/kegiatan");
  revalidatePath("/kegiatan");
  revalidatePath("/");
  if (slug) revalidatePath(`/kegiatan/${slug}`);
  // Beranda tiap RW dibangun statis dengan masa berlaku lima menit. Tanpa baris
  // ini, pengurus yang baru menyimpan perubahan membuka laman RW-nya dan tidak
  // melihat apa-apa selama beberapa menit — lalu mengira simpanannya gagal.
  await segarkanLamanRw();

}

export async function simpanKegiatan(_prev: Hasil, formData: FormData): Promise<Hasil> {
  const nilai = nilaiForm(formData);
  const pengguna = await wajibPeran(PERAN_KONTEN);

  const id = Number(formData.get("id")) || null;
  const judul = String(formData.get("judul") ?? "").trim();
  const deskripsi = String(formData.get("deskripsi") ?? "").trim();
  const lokasi = String(formData.get("lokasi") ?? "").trim();
  const mulaiTeks = String(formData.get("mulai") ?? "");
  const selesaiTeks = String(formData.get("selesai") ?? "");
  const status = String(formData.get("status") ?? "DRAFT");

  if (judul.length < 5) return { galat: "Judul kegiatan minimal 5 karakter.", nilai };
  if (deskripsi.length < 20) return { galat: "Keterangan kegiatan minimal 20 karakter.", nilai };
  if (!lokasi) return { galat: "Lokasi kegiatan wajib diisi.", nilai };
  if (!STATUS_SAH.includes(status)) return { galat: "Status tidak valid.", nilai };

  const mulai = new Date(mulaiTeks);
  if (Number.isNaN(mulai.getTime())) return { galat: "Waktu mulai tidak valid.", nilai };

  let selesai: Date | null = null;
  if (selesaiTeks) {
    selesai = new Date(selesaiTeks);
    if (Number.isNaN(selesai.getTime())) return { galat: "Waktu selesai tidak valid.", nilai };
    if (selesai <= mulai) return { galat: "Waktu selesai harus setelah waktu mulai.", nilai };
  }

  let gambar: string | null = null;
  try {
    gambar = await simpanBerkas(formData.get("gambar") as File | null, "kegiatan");
  } catch (e) {
    return { galat: e instanceof Error ? e.message : "Gagal mengunggah gambar.", nilai };
  }

  const lama = id ? await db.kegiatan.findUnique({ where: { id } }) : null;
  if (id && !lama) return { galat: "Kegiatan tidak ditemukan.", nilai };
  if (lama && !seRw(pengguna, lama.rwId)) {
    return { galat: "Kegiatan ini berada di luar kewenangan Anda.", nilai };
  }

  const rwId = rwUntukBarisBaru(pengguna, Number(formData.get("rwId")) || null);

  const slug = await slugUnik("kegiatan", judul, id ?? undefined);

  const data = {
    rwId,
    judul,
    slug,
    deskripsi,
    mulai,
    selesai,
    lokasi,
    penyelenggara: String(formData.get("penyelenggara") ?? "").trim() || null,
    kategori: String(formData.get("kategori") ?? "Umum"),
    kontak: String(formData.get("kontak") ?? "").trim() || null,
    status,
    ...(gambar ? { gambar } : {}),
  };

  const hasil = lama
    ? await db.kegiatan.update({ where: { id: lama.id }, data })
    : await db.kegiatan.create({ data: { ...data, dibuatOlehId: pengguna.id } });

  await segarkan(hasil.slug);
  // Mengganti judul juga mengganti slug, jadi alamat lamanya ikut disegarkan.
  // Tanpa ini halaman di alamat lama tetap tersaji dari cache dengan isi usang
  // sampai masa berlakunya habis — padahal barisnya sudah pindah alamat.
  if (lama && lama.slug !== hasil.slug) revalidatePath(`/kegiatan/${lama.slug}`);
  redirect(
    `/admin/kegiatan?pesan=${encodeURIComponent(lama ? "Kegiatan diperbarui." : "Kegiatan tersimpan.")}`,
  );
}

export async function hapusKegiatan(formData: FormData) {
  const pengguna = await wajibPeran(PERAN_KONTEN);
  const id = Number(formData.get("id"));
  const kegiatan = await db.kegiatan.findUnique({ where: { id } });
  if (!kegiatan || !seRw(pengguna, kegiatan.rwId)) return;

  await db.kegiatan.delete({ where: { id } });
  await segarkan(kegiatan.slug);
  redirect("/admin/kegiatan?pesan=Kegiatan dihapus.");
}

export async function ubahStatusKegiatan(formData: FormData) {
  const pengguna = await wajibPeran(PERAN_KONTEN);
  const id = Number(formData.get("id"));
  const status = String(formData.get("status"));
  if (!STATUS_SAH.includes(status)) return;

  const lama = await db.kegiatan.findUnique({ where: { id } });
  if (!lama || !seRw(pengguna, lama.rwId)) return;

  const kegiatan = await db.kegiatan.update({ where: { id }, data: { status } });
  await segarkan(kegiatan.slug);
}
