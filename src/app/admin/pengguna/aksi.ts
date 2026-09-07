"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { nilaiForm, type HasilAksi } from "@/lib/formulir";
import {
  PERAN,
  PERAN_KELOLA_AKUN,
  PERAN_TERIKAT_RT,
  PERAN_TERIKAT_RW,
  type Peran,
} from "@/lib/konstanta";
import {
  bolehMemberiPeran,

  rwUntukBarisBaru,
  seRw,
  wajibPeran,
} from "@/lib/otorisasi";
import type { PenggunaSesi } from "@/lib/sesi";

export type Hasil = HasilAksi;

const PENGELOLA: Peran[] = PERAN_KELOLA_AKUN;

/**
 * Akun mana yang boleh disentuh pengelola ini.
 *
 * Ketua RW hanya berkuasa atas akun di RW-nya, dan tidak pernah atas akun
 * administrator kampung — kalau boleh, ia bisa menaikkan dirinya sendiri
 * melewati batas RW.
 */
function bolehSentuhAkun(
  pengelola: PenggunaSesi,
  target: { peran: string; rwId: number | null; rtId: number | null },
  rwTargetLewatRt: number | null,
): boolean {
  if (pengelola.peran === PERAN.ADMIN) return true;
  if (target.peran === PERAN.ADMIN) return false;
  return seRw(pengelola, target.rtId ? rwTargetLewatRt : target.rwId);
}

async function ambilTarget(id: number) {
  return db.user.findUnique({
    where: { id },
    include: { rt: { select: { rwId: true } } },
  });
}

function segarkan() {
  revalidatePath("/admin/pengguna");
}

export async function simpanPengguna(_prev: Hasil, formData: FormData): Promise<Hasil> {
  const nilai = nilaiForm(formData);
  const pengelola = await wajibPeran(PENGELOLA);

  const id = Number(formData.get("id")) || null;
  const nama = String(formData.get("nama") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const peran = String(formData.get("peran") ?? "");
  const kataSandi = String(formData.get("kataSandi") ?? "");

  if (nama.length < 3) return { galat: "Nama minimal 3 karakter.", nilai };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { galat: "Format surel tidak valid.", nilai };
  if (!Object.values(PERAN).includes(peran as Peran)) return { galat: "Peran tidak valid.", nilai };
  if (!bolehMemberiPeran(pengelola, peran as Peran)) {
    return {
      galat: "Hanya administrator kampung yang boleh mengangkat administrator baru.",
      nilai,
    };
  }

  // Ketua RW tidak diberi pilihan RW: apa pun isi formulirnya, akunnya jatuh di
  // RW-nya sendiri. Yang dikirim formulir hanya dipakai bila pengelolanya ADMIN.
  const rwId = rwUntukBarisBaru(pengelola, Number(formData.get("rwId")) || null);
  if (PERAN_TERIKAT_RW.includes(peran as Peran) && !rwId) {
    return { galat: "Peran ini wajib terhubung dengan satu RW.", nilai };
  }

  const rtId = Number(formData.get("rtId")) || null;
  if (PERAN_TERIKAT_RT.includes(peran as Peran) && !rtId) {
    return { galat: "Ketua RT dan Bendahara RT wajib terhubung dengan satu RT.", nilai };
  }

  // RT yang dipilih harus benar-benar berada di RW yang sama, jika tidak akun
  // ini akan melihat kas RW lain lewat pintu belakang relasi rt.
  if (rtId) {
    const rt = await db.rt.findUnique({ where: { id: rtId }, select: { rwId: true } });
    if (!rt) return { galat: "RT yang dipilih tidak ditemukan.", nilai };
    if (rt.rwId !== rwId) {
      return { galat: "RT yang dipilih bukan bagian dari RW tersebut.", nilai };
    }
  }

  if (id) {
    const target = await ambilTarget(id);
    if (!target) return { galat: "Akun tidak ditemukan.", nilai };
    if (!bolehSentuhAkun(pengelola, target, target.rt?.rwId ?? null)) {
      return { galat: "Akun tersebut berada di luar kewenangan Anda.", nilai };
    }
    // Administrator terakhir tidak boleh diturunkan perannya lewat formulir ini.
    if (target.peran === PERAN.ADMIN && peran !== PERAN.ADMIN) {
      const jumlahAdmin = await db.user.count({ where: { peran: PERAN.ADMIN, aktif: true } });
      if (jumlahAdmin <= 1) {
        return { galat: "Administrator kampung terakhir tidak boleh diubah perannya.", nilai };
      }
    }
  }

  const kembar = await db.user.findUnique({ where: { email } });
  if (kembar && kembar.id !== id) return { galat: "Surel tersebut sudah digunakan.", nilai };

  if (!id && kataSandi.length < 8) {
    return { galat: "Kata sandi awal minimal 8 karakter.", nilai };
  }
  if (id && kataSandi && kataSandi.length < 8) {
    return { galat: "Kata sandi baru minimal 8 karakter.", nilai };
  }

  const terikatRt = PERAN_TERIKAT_RT.includes(peran as Peran);
  const data = {
    nama,
    email,
    peran,
    // ADMIN sengaja disimpan tanpa RW — itulah tanda kewenangan lintas RW-nya.
    rwId: peran === PERAN.ADMIN ? null : rwId,
    rtId: terikatRt ? rtId : null,
    jabatan: String(formData.get("jabatan") ?? "").trim() || null,
    telepon: String(formData.get("telepon") ?? "").trim() || null,
    aktif: formData.get("aktif") === "on",
    ...(kataSandi ? { passwordHash: await bcrypt.hash(kataSandi, 10) } : {}),
  };

  if (id) {
    await db.user.update({ where: { id }, data });
  } else {
    await db.user.create({
      data: { ...data, passwordHash: await bcrypt.hash(kataSandi, 10) },
    });
  }

  segarkan();
  redirect(
    `/admin/pengguna?pesan=${encodeURIComponent(id ? "Akun diperbarui." : "Akun baru dibuat.")}`,
  );
}

export async function alihkanAktifPengguna(formData: FormData) {
  const pengelola = await wajibPeran(PENGELOLA);
  const id = Number(formData.get("id"));
  if (id === pengelola.id) return;

  const u = await ambilTarget(id);
  if (!u) return;
  if (!bolehSentuhAkun(pengelola, u, u.rt?.rwId ?? null)) {
    redirect("/admin/pengguna?galat=Akun tersebut berada di luar kewenangan Anda.");
  }

  // Menonaktifkan administrator terakhir akan mengunci seluruh kampung.
  if (u.peran === PERAN.ADMIN && u.aktif) {
    const jumlahAdmin = await db.user.count({ where: { peran: PERAN.ADMIN, aktif: true } });
    if (jumlahAdmin <= 1) {
      redirect("/admin/pengguna?galat=Administrator kampung terakhir tidak dapat dinonaktifkan.");
    }
  }

  await db.user.update({ where: { id }, data: { aktif: !u.aktif } });
  segarkan();
}

export async function hapusPengguna(formData: FormData) {
  const pengelola = await wajibPeran(PENGELOLA);
  const id = Number(formData.get("id"));

  if (id === pengelola.id) {
    redirect("/admin/pengguna?galat=Anda tidak dapat menghapus akun sendiri.");
  }

  const target = await ambilTarget(id);
  if (!target) return;

  if (!bolehSentuhAkun(pengelola, target, target.rt?.rwId ?? null)) {
    redirect("/admin/pengguna?galat=Akun tersebut berada di luar kewenangan Anda.");
  }

  if (target.peran === PERAN.ADMIN) {
    const jumlahAdmin = await db.user.count({ where: { peran: PERAN.ADMIN } });
    if (jumlahAdmin <= 1) {
      redirect("/admin/pengguna?galat=Administrator terakhir tidak dapat dihapus.");
    }
  }

  await db.user.delete({ where: { id } });
  segarkan();
  redirect("/admin/pengguna?pesan=Akun dihapus.");
}
