import { NAMA_BULAN } from "./konstanta";

export function rupiah(nilai: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(nilai || 0);
}

export function angka(nilai: number): string {
  return new Intl.NumberFormat("id-ID").format(nilai || 0);
}

export function tanggal(nilai: Date | string | null | undefined): string {
  if (!nilai) return "-";
  const d = new Date(nilai);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function tanggalSingkat(nilai: Date | string | null | undefined): string {
  if (!nilai) return "-";
  return new Date(nilai).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function tanggalWaktu(nilai: Date | string | null | undefined): string {
  if (!nilai) return "-";
  const d = new Date(nilai);
  return `${tanggal(d)} ${d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })} WIB`;
}

export function jam(nilai: Date | string | null | undefined): string {
  if (!nilai) return "-";
  return new Date(nilai).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function periode(bulan: number, tahun: number): string {
  return `${NAMA_BULAN[bulan - 1] ?? "-"} ${tahun}`;
}

/** Nilai untuk input type="datetime-local" (zona waktu lokal). */
export function untukInputDatetime(nilai: Date | string | null | undefined): string {
  if (!nilai) return "";
  const d = new Date(nilai);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function untukInputTanggal(nilai: Date | string | null | undefined): string {
  if (!nilai) return "";
  const d = new Date(nilai);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function slugify(teks: string): string {
  return teks
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function umur(tanggalLahir: Date | string | null | undefined): number | null {
  if (!tanggalLahir) return null;
  const lahir = new Date(tanggalLahir);
  const kini = new Date();
  let u = kini.getFullYear() - lahir.getFullYear();
  const m = kini.getMonth() - lahir.getMonth();
  if (m < 0 || (m === 0 && kini.getDate() < lahir.getDate())) u--;
  return u;
}

export function potong(teks: string, panjang = 160): string {
  const bersih = teks.replace(/\s+/g, " ").trim();
  return bersih.length > panjang ? `${bersih.slice(0, panjang)}…` : bersih;
}

/** Selisih hari dari hari ini (positif = akan datang). */
export function selisihHari(nilai: Date | string): number {
  const target = new Date(nilai);
  const kini = new Date();
  target.setHours(0, 0, 0, 0);
  kini.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - kini.getTime()) / 86_400_000);
}

export function hitungMundur(nilai: Date | string): string {
  const hari = selisihHari(nilai);
  if (hari === 0) return "Hari ini";
  if (hari === 1) return "Besok";
  if (hari > 1) return `${hari} hari lagi`;
  if (hari === -1) return "Kemarin";
  return `${Math.abs(hari)} hari lalu`;
}
