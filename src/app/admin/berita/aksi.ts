"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { nilaiForm, type HasilAksi } from "@/lib/formulir";
import { PERAN_KONTEN, STATUS_KONTEN } from "@/lib/konstanta";
import { wajibPeran } from "@/lib/otorisasi";
import { slugUnik } from "@/lib/slug";
import { simpanBerkas } from "@/lib/unggah";

export type Hasil = HasilAksi;

function segarkan(slug?: string) {
  revalidatePath("/admin/berita");
  revalidatePath("/berita");
  revalidatePath("/");
  if (slug) revalidatePath(`/berita/${slug}`);
}

export async function simpanBerita(_prev: Hasil, formData: FormData): Promise<Hasil> {
  const nilai = nilaiForm(formData);
  const pengguna = await wajibPeran(PERAN_KONTEN);

  const id = Number(formData.get("id")) || null;
  const judul = String(formData.get("judul") ?? "").trim();
  const ringkasan = String(formData.get("ringkasan") ?? "").trim();
  const konten = String(formData.get("konten") ?? "").trim();
  const kategori = String(formData.get("kategori") ?? "Umum");
  const status = String(formData.get("status") ?? STATUS_KONTEN.DRAFT);

  if (judul.length < 5) return { galat: "Judul minimal 5 karakter.", nilai };
  if (ringkasan.length < 20) return { galat: "Ringkasan minimal 20 karakter.", nilai };
  if (konten.length < 50) return { galat: "Isi berita minimal 50 karakter.", nilai };

  let gambar: string | null = null;
  try {
    gambar = await simpanBerkas(formData.get("gambar") as File | null, "berita");
  } catch (e) {
    return { galat: e instanceof Error ? e.message : "Gagal mengunggah gambar.", nilai };
  }

  const lama = id ? await db.berita.findUnique({ where: { id } }) : null;
  if (id && !lama) return { galat: "Berita tidak ditemukan.", nilai };

  const slug = await slugUnik("berita", judul, id ?? undefined);

  const terbitAt =
    status === STATUS_KONTEN.TERBIT ? (lama?.terbitAt ?? new Date()) : lama?.terbitAt ?? null;

  const data = {
    judul,
    slug,
    ringkasan,
    konten,
    kategori,
    status,
    terbitAt,
    ...(gambar ? { gambar } : {}),
  };

  const hasil = lama
    ? await db.berita.update({ where: { id: lama.id }, data })
    : await db.berita.create({ data: { ...data, penulisId: pengguna.id } });

  segarkan(hasil.slug);
  redirect(`/admin/berita?pesan=${encodeURIComponent(lama ? "Berita diperbarui." : "Berita tersimpan.")}`);
}

export async function hapusBerita(formData: FormData) {
  await wajibPeran(PERAN_KONTEN);
  const id = Number(formData.get("id"));
  const berita = await db.berita.findUnique({ where: { id } });
  if (!berita) return;

  await db.berita.delete({ where: { id } });
  segarkan(berita.slug);
  redirect("/admin/berita?pesan=Berita dihapus.");
}

export async function ubahStatusBerita(formData: FormData) {
  await wajibPeran(PERAN_KONTEN);
  const id = Number(formData.get("id"));
  const berita = await db.berita.findUnique({ where: { id } });
  if (!berita) return;

  const baru =
    berita.status === STATUS_KONTEN.TERBIT ? STATUS_KONTEN.DRAFT : STATUS_KONTEN.TERBIT;

  await db.berita.update({
    where: { id },
    data: {
      status: baru,
      terbitAt:
        baru === STATUS_KONTEN.TERBIT ? (berita.terbitAt ?? new Date()) : berita.terbitAt,
    },
  });

  segarkan(berita.slug);
}
