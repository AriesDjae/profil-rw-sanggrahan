import "server-only";

import { notFound, redirect } from "next/navigation";

import { db } from "./db";
import { PERAN, PERAN_KELOLA_AKUN, PERAN_KONTEN, type Peran } from "./konstanta";
import { penggunaSaatIni, type PenggunaSesi } from "./sesi";

/**
 * Kewenangan di situs tiga RW.
 *
 * Satu aturan menanggung hampir seluruh berkas ini: **kecuali ADMIN, seorang
 * pengurus hanya berkuasa di dalam RW-nya sendiri.** Karena itu setiap
 * pemeriksaan di bawah selalu menanyakan dua hal, bukan satu — perannya tepat,
 * dan barisnya berada di RW yang sama dengan penggunanya. Peran saja tidak
 * pernah cukup: Ketua RW 02 punya peran yang persis sama dengan Ketua RW 01.
 */

/** Wajib login. Mengalihkan ke halaman masuk bila belum. */
export async function wajibMasuk(kembaliKe?: string): Promise<PenggunaSesi> {
  const pengguna = await penggunaSaatIni();
  if (!pengguna) {
    redirect(kembaliKe ? `/masuk?next=${encodeURIComponent(kembaliKe)}` : "/masuk");
  }
  return pengguna;
}

/** Wajib login dengan salah satu peran tertentu. */
export async function wajibPeran(peran: Peran[]): Promise<PenggunaSesi> {
  const pengguna = await wajibMasuk();
  if (!peran.includes(pengguna.peran)) redirect("/admin?galat=akses");
  return pengguna;
}

/** Benar bila pengguna berwenang di seluruh kampung, bukan satu RW saja. */
export function lintasRw(pengguna: PenggunaSesi): boolean {
  return pengguna.peran === PERAN.ADMIN;
}

/**
 * RW mana yang boleh disentuh pengguna ini. null = seluruh RW (ADMIN).
 *
 * Inilah nilai yang dipakai menyaring hampir semua kueri panel pengurus.
 */
export function lingkupRw(pengguna: PenggunaSesi): number | null {
  return lintasRw(pengguna) ? null : pengguna.rwId;
}

/** RT mana saja yang boleh dilihat pengguna ini. null = semua RT dalam lingkupnya. */
export function lingkupRt(pengguna: PenggunaSesi): number | null {
  if (pengguna.peran === PERAN.KETUA_RT || pengguna.peran === PERAN.BENDAHARA_RT) {
    return pengguna.rtId;
  }
  return null;
}

/** Benar bila baris ber-RW tersebut berada dalam lingkup pengguna. */
export function seRw(pengguna: PenggunaSesi, rwId: number | null): boolean {
  const lingkup = lingkupRw(pengguna);
  if (lingkup === null) return true;
  // rwId kosong = milik kampung. Hanya ADMIN yang boleh menyuntingnya, supaya
  // pengurus satu RW tidak bisa mengubah tulisan yang tampil di ketiga RW.
  return rwId === lingkup;
}

/**
 * Potongan `where` Prisma untuk menyaring baris ber-kolom rwId sesuai lingkup
 * pengguna. Konten milik kampung ikut terbaca supaya pengurus RW tetap melihat
 * apa yang tampil di lamannya, walau tidak boleh menyuntingnya.
 */
export function saringRw(pengguna: PenggunaSesi, ikutKampung = true) {
  const lingkup = lingkupRw(pengguna);
  if (lingkup === null) return {};
  return ikutKampung ? { OR: [{ rwId: lingkup }, { rwId: null }] } : { rwId: lingkup };
}

/** Potongan `where` untuk baris yang ber-RW lewat relasi rt. */
export function saringRwLewatRt(pengguna: PenggunaSesi) {
  const rt = lingkupRt(pengguna);
  if (rt !== null) return { rtId: rt };
  const lingkup = lingkupRw(pengguna);
  if (lingkup === null) return {};
  return { rt: { rwId: lingkup } };
}

/**
 * Menghentikan permintaan bila baris yang dituju berada di RW lain.
 * Dipakai server action dan halaman detail, tempat id-nya datang dari formulir
 * atau alamat dan karena itu tidak boleh dipercaya begitu saja.
 */
export function wajibSeRw(pengguna: PenggunaSesi, rwId: number | null): void {
  if (!seRw(pengguna, rwId)) redirect("/admin?galat=akses");
}

/** Versi untuk halaman: RW lain diperlakukan sebagai tidak ada, bukan ditolak. */
export function wajibSeRwAtau404(pengguna: PenggunaSesi, rwId: number | null): void {
  if (!seRw(pengguna, rwId)) notFound();
}

export function bolehKelolaKonten(pengguna: PenggunaSesi): boolean {
  return PERAN_KONTEN.includes(pengguna.peran);
}

export function bolehKelolaPengguna(pengguna: PenggunaSesi): boolean {
  return PERAN_KELOLA_AKUN.includes(pengguna.peran);
}

/**
 * Ketua RW boleh mengurus akun di RW-nya, tetapi tidak boleh mengangkat
 * administrator kampung — kalau boleh, batas antar-RW bisa dibuka sendiri
 * dari dalam.
 */
export function bolehMemberiPeran(pengguna: PenggunaSesi, peran: Peran): boolean {
  if (!bolehKelolaPengguna(pengguna)) return false;
  if (peran === PERAN.ADMIN) return pengguna.peran === PERAN.ADMIN;
  return true;
}

/** Bendahara RT (atau admin) boleh membuat & mengubah laporan kas RT tersebut. */
export function bolehSuntingLaporan(pengguna: PenggunaSesi, rtId: number): boolean {
  if (pengguna.peran === PERAN.ADMIN) return true;
  return pengguna.peran === PERAN.BENDAHARA_RT && pengguna.rtId === rtId;
}

/** Ketua RT dari RT bersangkutan (atau admin) boleh memverifikasi. */
export function bolehVerifikasiRt(pengguna: PenggunaSesi, rtId: number): boolean {
  if (pengguna.peran === PERAN.ADMIN) return true;
  return pengguna.peran === PERAN.KETUA_RT && pengguna.rtId === rtId;
}

/**
 * Persetujuan akhir diberikan Ketua RW **yang menaungi RT itu**. Ketua RW 01
 * tidak boleh mengesahkan kas RT milik RW 03 — itulah gunanya rwId di sini,
 * dan alasan fungsi ini tidak lagi bisa dipanggil tanpa argumen.
 */
export function bolehSetujuiRw(pengguna: PenggunaSesi, rwId: number | null): boolean {
  if (pengguna.peran === PERAN.ADMIN) return true;
  return pengguna.peran === PERAN.KETUA_RW && rwId !== null && pengguna.rwId === rwId;
}

/** Boleh melihat detail laporan (termasuk yang belum terbit). */
export function bolehLihatLaporan(
  pengguna: PenggunaSesi,
  rtId: number,
  rwId: number | null,
): boolean {
  const rt = lingkupRt(pengguna);
  if (rt !== null) return rt === rtId;
  const lingkup = lingkupRw(pengguna);
  return lingkup === null || lingkup === rwId;
}

/**
 * RT yang boleh dipilih pengguna pada formulir — selalu terbatas pada RW-nya.
 * Formulir yang menawarkan RT dari RW lain akan menghasilkan baris yang tidak
 * bisa disunting kembali oleh pembuatnya, jadi daftarnya disaring di sumber.
 */
export function daftarRtTerjangkau(pengguna: PenggunaSesi) {
  const rt = lingkupRt(pengguna);
  if (rt !== null) return db.rt.findMany({ where: { id: rt }, orderBy: { nomor: "asc" } });
  const lingkup = lingkupRw(pengguna);
  return db.rt.findMany({
    where: lingkup === null ? {} : { rwId: lingkup },
    orderBy: [{ rwId: "asc" }, { nomor: "asc" }],
    include: { rw: { select: { nomor: true, nama: true } } },
  });
}

/** RW yang boleh dipilih pengguna pada formulir. */
export function daftarRwTerjangkau(pengguna: PenggunaSesi) {
  const lingkup = lingkupRw(pengguna);
  return db.rw.findMany({
    where: lingkup === null ? {} : { id: lingkup },
    orderBy: { nomor: "asc" },
    select: { id: true, nomor: true, nama: true },
  });
}

/**
 * Bahan bidang "Tampil di" pada formulir konten.
 *
 * Mengembalikan daftar RW yang boleh dipilih, dan — bila penggunanya terikat
 * satu RW — RW itu sebagai nilai terkunci. Dikumpulkan di sini supaya kelima
 * modul konten memuat aturan yang sama, bukan lima tafsiran yang mirip.
 */
export async function opsiRw(pengguna: PenggunaSesi) {
  const rwList = await daftarRwTerjangkau(pengguna);
  const terkunci = lintasRw(pengguna) ? null : (rwList[0] ?? null);
  return {
    rwList: rwList.map((r) => ({ id: r.id, nama: r.nama })),
    rwTerkunci: terkunci ? { id: terkunci.id, nama: terkunci.nama } : null,
  };
}

/**
 * RW yang akan dipasang pada baris baru. Pengurus RW tidak diberi pilihan —
 * apa pun yang dikirim formulirnya, barisnya jatuh di RW-nya sendiri.
 */
export function rwUntukBarisBaru(
  pengguna: PenggunaSesi,
  diminta: number | null,
): number | null {
  const lingkup = lingkupRw(pengguna);
  return lingkup === null ? diminta : lingkup;
}
