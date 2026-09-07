"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { nilaiForm, type HasilAksi } from "@/lib/formulir";
import { PERAN, PERAN_KELOLA_AKUN, type Peran } from "@/lib/konstanta";
import { lingkupRw, seRw, wajibPeran } from "@/lib/otorisasi";
import { simpanBerkas } from "@/lib/unggah";

export type Hasil = HasilAksi;

const PENGELOLA: Peran[] = PERAN_KELOLA_AKUN;

function segarkan() {
  revalidatePath("/", "layout");
}

/**
 * Identitas tingkat kampung — nama, wilayah administratif, sekretariat.
 * Hanya administrator kampung: nilainya tampil di kop ketiga laman RW, jadi
 * satu Ketua RW tidak boleh mengubahnya bagi dua RW lainnya.
 */
export async function simpanPengaturan(_prev: Hasil, formData: FormData): Promise<Hasil> {
  const nilai = nilaiForm(formData);
  await wajibPeran([PERAN.ADMIN]);

  const namaKampung = String(formData.get("namaKampung") ?? "").trim();
  if (namaKampung.length < 3) return { galat: "Nama kampung minimal 3 karakter.", nilai };

  let heroFoto: string | null = null;
  try {
    heroFoto = await simpanBerkas(formData.get("heroFoto") as File | null, "situs");
  } catch (e) {
    return { galat: e instanceof Error ? e.message : "Gagal mengunggah gambar.", nilai };
  }

  const data = {
    namaKampung,
    kelurahan: String(formData.get("kelurahan") ?? "").trim(),
    kemantren: String(formData.get("kemantren") ?? "").trim(),
    kota: String(formData.get("kota") ?? "").trim(),
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
  return { sukses: "Pengaturan kampung tersimpan." };
}

/**
 * Profil satu RW: yang tampil di /rw/1, /rw/2, /rw/3.
 *
 * Ketua RW menyunting RW-nya sendiri; administrator kampung menyunting semua.
 * Nomor RW tidak bisa diubah dari sini — nomor itu sudah terpakai di alamat
 * halaman, tautan yang tersebar, dan penomoran RT.
 */
export async function simpanProfilRw(_prev: Hasil, formData: FormData): Promise<Hasil> {
  const nilai = nilaiForm(formData);
  const pengguna = await wajibPeran(PENGELOLA);

  const id = Number(formData.get("id"));
  const rw = await db.rw.findUnique({ where: { id } });
  if (!rw) return { galat: "RW tidak ditemukan.", nilai };
  if (!seRw(pengguna, rw.id)) {
    return { galat: `Anda tidak berwenang mengubah profil ${rw.nama}.`, nilai };
  }

  const nama = String(formData.get("nama") ?? "").trim();
  if (nama.length < 2) return { galat: "Nama RW minimal 2 karakter.", nilai };

  let heroFoto: string | null = null;
  try {
    heroFoto = await simpanBerkas(formData.get("heroFoto") as File | null, "situs");
  } catch (e) {
    return { galat: e instanceof Error ? e.message : "Gagal mengunggah gambar.", nilai };
  }

  await db.rw.update({
    where: { id },
    data: {
      nama,
      tagline: String(formData.get("tagline") ?? "").trim(),
      deskripsi: String(formData.get("deskripsi") ?? "").trim(),
      sejarah: String(formData.get("sejarah") ?? "").trim(),
      visi: String(formData.get("visi") ?? "").trim(),
      misi: String(formData.get("misi") ?? "").trim(),
      alamat: String(formData.get("alamat") ?? "").trim(),
      telepon: String(formData.get("telepon") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      ...(heroFoto ? { heroFoto } : {}),
    },
  });

  segarkan();
  return { sukses: `Profil ${nama} tersimpan.` };
}

export async function simpanRt(_prev: Hasil, formData: FormData): Promise<Hasil> {
  const nilai = nilaiForm(formData);
  const pengguna = await wajibPeran(PENGELOLA);

  const id = Number(formData.get("id")) || null;
  const nomor = String(formData.get("nomor") ?? "").trim();
  if (!/^\d{1,3}$/.test(nomor)) return { galat: "Nomor RT harus berupa angka, misalnya 01.", nilai };

  // RT yang sedang disunting tidak boleh berpindah RW: warga, kas, dan akun
  // pengurusnya ikut menggantung di sana.
  let rwId: number;
  if (id) {
    const lama = await db.rt.findUnique({ where: { id }, select: { rwId: true } });
    if (!lama) return { galat: "RT tidak ditemukan.", nilai };
    rwId = lama.rwId;
  } else {
    const lingkup = lingkupRw(pengguna);
    rwId = lingkup ?? Number(formData.get("rwId"));
    if (!rwId) return { galat: "RW belum dipilih.", nilai };
  }

  if (!seRw(pengguna, rwId)) {
    return { galat: "RT tersebut berada di luar RW Anda.", nilai };
  }

  const rw = await db.rw.findUnique({ where: { id: rwId }, select: { nama: true } });
  if (!rw) return { galat: "RW tidak ditemukan.", nilai };

  // Nomor RT hanya perlu unik di dalam RW-nya — RT 01 boleh ada di ketiga RW.
  const kembar = await db.rt.findUnique({ where: { rwId_nomor: { rwId, nomor } } });
  if (kembar && kembar.id !== id) {
    return { galat: `RT ${nomor} sudah terdaftar di ${rw.nama}.`, nilai };
  }

  const data = {
    rwId,
    nomor,
    nama: String(formData.get("nama") ?? "").trim() || `RT ${nomor} / ${rw.nama}`,
    wilayah: String(formData.get("wilayah") ?? "").trim() || null,
  };

  if (id) await db.rt.update({ where: { id }, data });
  else await db.rt.create({ data });

  segarkan();
  return { sukses: id ? "Data RT diperbarui." : `RT ${nomor} ${rw.nama} ditambahkan.` };
}

export async function hapusRt(formData: FormData) {
  const pengguna = await wajibPeran(PENGELOLA);
  const id = Number(formData.get("id"));

  const rt = await db.rt.findUnique({ where: { id }, select: { rwId: true } });
  if (!rt || !seRw(pengguna, rt.rwId)) return;

  const jumlahWarga = await db.warga.count({ where: { rtId: id } });
  const jumlahLaporan = await db.laporanKeuangan.count({ where: { rtId: id } });
  if (jumlahWarga > 0 || jumlahLaporan > 0) return;

  await db.rt.delete({ where: { id } }).catch(() => null);
  segarkan();
}
