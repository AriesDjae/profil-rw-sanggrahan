import "server-only";

import { redirect } from "next/navigation";

import { PERAN, PERAN_KONTEN, type Peran } from "./konstanta";
import { penggunaSaatIni, type PenggunaSesi } from "./sesi";

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

export function bolehKelolaKonten(pengguna: PenggunaSesi): boolean {
  return PERAN_KONTEN.includes(pengguna.peran);
}

export function bolehKelolaPengguna(pengguna: PenggunaSesi): boolean {
  return pengguna.peran === PERAN.ADMIN || pengguna.peran === PERAN.KETUA_RW;
}

/** RT mana saja yang boleh dilihat pengguna ini. null = semua RT. */
export function lingkupRt(pengguna: PenggunaSesi): number | null {
  if (pengguna.peran === PERAN.KETUA_RT || pengguna.peran === PERAN.BENDAHARA_RT) {
    return pengguna.rtId;
  }
  return null;
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

/** Hanya Ketua RW (atau admin) yang memberi persetujuan akhir. */
export function bolehSetujuiRw(pengguna: PenggunaSesi): boolean {
  return pengguna.peran === PERAN.KETUA_RW || pengguna.peran === PERAN.ADMIN;
}

/** Boleh melihat detail laporan (termasuk yang belum terbit). */
export function bolehLihatLaporan(pengguna: PenggunaSesi, rtId: number): boolean {
  const lingkup = lingkupRt(pengguna);
  return lingkup === null || lingkup === rtId;
}
