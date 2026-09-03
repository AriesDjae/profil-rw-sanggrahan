import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

import { db } from "./db";
import type { Peran } from "./konstanta";

const NAMA_COOKIE = "sesi_rw";
const UMUR_SESI_DETIK = 60 * 60 * 24 * 7; // 7 hari

function kunci(): Uint8Array {
  const rahasia = process.env.SESSION_SECRET;
  if (!rahasia || rahasia.length < 32) {
    throw new Error(
      "SESSION_SECRET belum diisi (minimal 32 karakter). Salin .env.example menjadi .env.",
    );
  }
  return new TextEncoder().encode(rahasia);
}

export type IsiSesi = {
  uid: number;
  peran: Peran;
  rtId: number | null;
  nama: string;
};

export async function buatSesi(isi: IsiSesi): Promise<void> {
  const token = await new SignJWT({ ...isi })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${UMUR_SESI_DETIK}s`)
    .sign(kunci());

  const jar = await cookies();
  jar.set(NAMA_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: UMUR_SESI_DETIK,
  });
}

export async function hapusSesi(): Promise<void> {
  const jar = await cookies();
  jar.delete(NAMA_COOKIE);
}

async function bacaToken(): Promise<IsiSesi | null> {
  const jar = await cookies();
  const token = jar.get(NAMA_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, kunci());
    return {
      uid: Number(payload.uid),
      peran: payload.peran as Peran,
      rtId: payload.rtId === null ? null : Number(payload.rtId),
      nama: String(payload.nama ?? ""),
    };
  } catch {
    return null;
  }
}

export type PenggunaSesi = {
  id: number;
  nama: string;
  email: string;
  peran: Peran;
  jabatan: string | null;
  foto: string | null;
  rtId: number | null;
  rt: { id: number; nomor: string; nama: string } | null;
};

/** Pengguna yang sedang login, atau null. Selalu dibaca ulang dari database. */
export async function penggunaSaatIni(): Promise<PenggunaSesi | null> {
  const isi = await bacaToken();
  if (!isi) return null;

  const user = await db.user.findUnique({
    where: { id: isi.uid },
    select: {
      id: true,
      nama: true,
      email: true,
      peran: true,
      jabatan: true,
      foto: true,
      aktif: true,
      rtId: true,
      rt: { select: { id: true, nomor: true, nama: true } },
    },
  });

  if (!user || !user.aktif) return null;

  return {
    id: user.id,
    nama: user.nama,
    email: user.email,
    peran: user.peran as Peran,
    jabatan: user.jabatan,
    foto: user.foto,
    rtId: user.rtId,
    rt: user.rt,
  };
}
