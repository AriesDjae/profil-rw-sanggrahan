"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { segarkanLamanRw } from "@/lib/rw";
import { nilaiForm, type HasilAksi } from "@/lib/formulir";
import { PERAN } from "@/lib/konstanta";
import { lingkupRt, lingkupRw, wajibMasuk } from "@/lib/otorisasi";

export type Hasil = HasilAksi;

const PERAN_BOLEH = [PERAN.ADMIN, PERAN.SEKRETARIS, PERAN.KETUA_RW, PERAN.KETUA_RT] as string[];

async function segarkan() {
  revalidatePath("/admin/warga");
  revalidatePath("/data-warga");
  revalidatePath("/");
  revalidatePath("/profil");
  // Beranda tiap RW dibangun statis dengan masa berlaku lima menit. Tanpa baris
  // ini, pengurus yang baru menyimpan perubahan membuka laman RW-nya dan tidak
  // melihat apa-apa selama beberapa menit — lalu mengira simpanannya gagal.
  await segarkanLamanRw();

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

  // Sekretaris dan Ketua RW tidak terikat satu RT, tetapi tetap terikat RW-nya.
  // Tanpa pemeriksaan ini, mengganti angka rtId di formulir cukup untuk
  // menuliskan warga ke RW sebelah.
  const rwSaya = lingkupRw(pengguna);
  if (rwSaya !== null) {
    const rt = await db.rt.findUnique({ where: { id: rtTujuan }, select: { rwId: true } });
    if (!rt || rt.rwId !== rwSaya) {
      return { galat: "RT tersebut berada di luar RW Anda.", nilai };
    }
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
    const lama = await db.warga.findUnique({
      where: { id },
      include: { rt: { select: { rwId: true } } },
    });
    if (!lama) return { galat: "Data warga tidak ditemukan.", nilai };
    if (lingkup && lama.rtId !== lingkup) {
      return { galat: "Anda tidak berhak mengubah data warga RT lain.", nilai };
    }
    if (rwSaya !== null && lama.rt.rwId !== rwSaya) {
      return { galat: "Warga tersebut terdaftar di RW lain.", nilai };
    }
    await db.warga.update({ where: { id }, data });
  } else {
    await db.warga.create({ data });
  }

  await segarkan();
  // Daftar warga diurut per RT dan berhalaman 25 baris. Tanpa penyaring, warga
  // yang baru ditambahkan bisa jatuh di halaman keempat dan pengurus mengira
  // simpanannya gagal. Karena itu setelah menambah, daftar langsung disaring ke
  // RT tujuan — di situ barisnya pasti terlihat.
  const tujuan = id
    ? `/admin/warga?pesan=${encodeURIComponent("Data warga diperbarui.")}`
    : `/admin/warga?rt=${rtTujuan}&pesan=${encodeURIComponent("Warga baru ditambahkan.")}`;
  redirect(tujuan);
}

export async function hapusWarga(formData: FormData) {
  const pengguna = await wajibMasuk();
  if (!PERAN_BOLEH.includes(pengguna.peran)) return;

  const id = Number(formData.get("id"));
  const warga = await db.warga.findUnique({
    where: { id },
    include: { rt: { select: { rwId: true } } },
  });
  if (!warga) return;

  const lingkup = lingkupRt(pengguna);
  if (lingkup && warga.rtId !== lingkup) return;

  const rwSaya = lingkupRw(pengguna);
  if (rwSaya !== null && warga.rt.rwId !== rwSaya) return;

  await db.warga.delete({ where: { id } });
  await segarkan();
  redirect("/admin/warga?pesan=Data warga dihapus.");
}
