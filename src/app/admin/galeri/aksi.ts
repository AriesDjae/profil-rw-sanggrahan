"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { nilaiForm, type HasilAksi } from "@/lib/formulir";
import { PERAN_KONTEN } from "@/lib/konstanta";
import { wajibPeran } from "@/lib/otorisasi";
import { slugUnik } from "@/lib/slug";
import { simpanBerkas } from "@/lib/unggah";

export type Hasil = HasilAksi;

function segarkan(slug?: string) {
  revalidatePath("/admin/galeri");
  revalidatePath("/galeri");
  revalidatePath("/");
  if (slug) revalidatePath(`/galeri/${slug}`);
}

export async function simpanAlbum(_prev: Hasil, formData: FormData): Promise<Hasil> {
  const nilai = nilaiForm(formData);
  await wajibPeran(PERAN_KONTEN);

  const id = Number(formData.get("id")) || null;
  const nama = String(formData.get("nama") ?? "").trim();
  const deskripsi = String(formData.get("deskripsi") ?? "").trim();
  const tanggalTeks = String(formData.get("tanggal") ?? "");

  if (nama.length < 3) return { galat: "Nama album minimal 3 karakter.", nilai };

  const tanggal = tanggalTeks ? new Date(tanggalTeks) : new Date();
  if (Number.isNaN(tanggal.getTime())) return { galat: "Tanggal tidak valid.", nilai };

  const slug = await slugUnik("album", nama, id ?? undefined);
  const data = { nama, slug, deskripsi: deskripsi || null, tanggal };

  const album = id
    ? await db.album.update({ where: { id }, data })
    : await db.album.create({ data });

  segarkan(album.slug);
  if (!id) redirect(`/admin/galeri/${album.id}`);
  return { sukses: "Album diperbarui." };
}

export async function hapusAlbum(formData: FormData) {
  await wajibPeran(PERAN_KONTEN);
  const id = Number(formData.get("id"));
  await db.album.delete({ where: { id } }).catch(() => null);
  segarkan();
  redirect("/admin/galeri?pesan=Album dihapus.");
}

export async function tambahFoto(_prev: Hasil, formData: FormData): Promise<Hasil> {
  const nilai = nilaiForm(formData);
  await wajibPeran(PERAN_KONTEN);

  const albumId = Number(formData.get("albumId"));
  const album = await db.album.findUnique({ where: { id: albumId } });
  if (!album) return { galat: "Album tidak ditemukan.", nilai };

  const berkas = formData.getAll("foto").filter((f): f is File => f instanceof File);
  const terpilih = berkas.filter((f) => f.size > 0);
  if (terpilih.length === 0) return { galat: "Pilih minimal satu foto.", nilai };

  const urutanTerakhir = await db.foto.aggregate({
    where: { albumId },
    _max: { urutan: true },
  });
  let urutan = (urutanTerakhir._max.urutan ?? -1) + 1;

  const judul = String(formData.get("judul") ?? "").trim();

  try {
    for (const f of terpilih) {
      const url = await simpanBerkas(f, "galeri");
      if (!url) continue;
      await db.foto.create({
        data: { albumId, url, judul: judul || null, urutan: urutan++ },
      });
    }
  } catch (e) {
    return { galat: e instanceof Error ? e.message : "Gagal mengunggah foto.", nilai };
  }

  segarkan(album.slug);
  return { sukses: `${terpilih.length} foto ditambahkan.` };
}

export async function hapusFoto(formData: FormData) {
  await wajibPeran(PERAN_KONTEN);
  const id = Number(formData.get("id"));
  const foto = await db.foto.findUnique({ where: { id }, include: { album: true } });
  if (!foto) return;
  await db.foto.delete({ where: { id } });
  segarkan(foto.album.slug);
}
