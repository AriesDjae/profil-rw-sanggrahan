"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { nilaiForm, type HasilAksi } from "@/lib/formulir";
import { PERAN } from "@/lib/konstanta";
import { lingkupRt, wajibMasuk } from "@/lib/otorisasi";

export type Hasil = HasilAksi;

const PERAN_BOLEH = [PERAN.ADMIN, PERAN.SEKRETARIS, PERAN.KETUA_RW, PERAN.KETUA_RT] as string[];

function segarkan() {
  revalidatePath("/admin/warga");
  revalidatePath("/data-warga");
  revalidatePath("/");
  revalidatePath("/profil");
}

export async function simpanWarga(_prev: Hasil, formData: FormData): Promise<Hasil> {
  const nilai = nilaiForm(formData);
  const pengguna = await wajibMasuk();
  if (!PERAN_BOLEH.includes(pengguna.peran)) {
    return { galat: "Anda tidak berhak mengubah data warga.", nilai };
  }

  const id = Number(formData.get("id")) || null;
  const nama = String(formData.get("nama") ?? "").trim();
  const jenisKelamin = String(formData.get("jenisKelamin") ?? "");
  const rtId = Number(formData.get("rtId"));

  if (nama.length < 3) return { galat: "Nama warga minimal 3 karakter.", nilai };
  if (jenisKelamin !== "L" && jenisKelamin !== "P") {
    return { galat: "Jenis kelamin belum dipilih.", nilai };
  }

  const lingkup = lingkupRt(pengguna);
  const rtTujuan = lingkup ?? rtId;
  if (!rtTujuan) return { galat: "RT belum dipilih.", nilai };
  if (lingkup && rtId && rtId !== lingkup) {
    return { galat: "Anda hanya dapat mengelola warga pada RT Anda sendiri.", nilai };
  }

  const nik = String(formData.get("nik") ?? "").trim();
  if (nik && !/^\d{16}$/.test(nik)) {
    return { galat: "NIK harus terdiri dari 16 digit angka.", nilai };
  }
  if (nik) {
    const kembar = await db.warga.findUnique({ where: { nik } });
    if (kembar && kembar.id !== id) {
      return { galat: `NIK tersebut sudah terdaftar atas nama ${kembar.nama}.` };
    }
  }

  const tanggalLahirTeks = String(formData.get("tanggalLahir") ?? "");
  let tanggalLahir: Date | null = null;
  if (tanggalLahirTeks) {
    tanggalLahir = new Date(tanggalLahirTeks);
    if (Number.isNaN(tanggalLahir.getTime())) return { galat: "Tanggal lahir tidak valid.", nilai };
  }

  const data = {
    nama,
    nik: nik || null,
    noKk: String(formData.get("noKk") ?? "").trim() || null,
    jenisKelamin,
    tempatLahir: String(formData.get("tempatLahir") ?? "").trim() || null,
    tanggalLahir,
    agama: String(formData.get("agama") ?? "").trim() || null,
    pendidikan: String(formData.get("pendidikan") ?? "").trim() || null,
    pekerjaan: String(formData.get("pekerjaan") ?? "").trim() || null,
    statusPerkawinan: String(formData.get("statusPerkawinan") ?? "").trim() || null,
    hubungan: String(formData.get("hubungan") ?? "ANGGOTA"),
    alamat: String(formData.get("alamat") ?? "").trim() || null,
    rtId: rtTujuan,
  };

  if (id) {
    const lama = await db.warga.findUnique({ where: { id } });
    if (!lama) return { galat: "Data warga tidak ditemukan.", nilai };
    if (lingkup && lama.rtId !== lingkup) {
      return { galat: "Anda tidak berhak mengubah data warga RT lain.", nilai };
    }
    await db.warga.update({ where: { id }, data });
  } else {
    await db.warga.create({ data });
  }

  segarkan();
  redirect(`/admin/warga?pesan=${encodeURIComponent(id ? "Data warga diperbarui." : "Warga baru ditambahkan.")}`);
}

export async function hapusWarga(formData: FormData) {
  const pengguna = await wajibMasuk();
  if (!PERAN_BOLEH.includes(pengguna.peran)) return;

  const id = Number(formData.get("id"));
  const warga = await db.warga.findUnique({ where: { id } });
  if (!warga) return;

  const lingkup = lingkupRt(pengguna);
  if (lingkup && warga.rtId !== lingkup) return;

  await db.warga.delete({ where: { id } });
  segarkan();
  redirect("/admin/warga?pesan=Data warga dihapus.");
}
