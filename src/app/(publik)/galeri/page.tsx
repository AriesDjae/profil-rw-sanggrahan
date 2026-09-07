import type { Metadata } from "next";

import IsiGaleri from "@/components/publik/halaman/IsiGaleri";
import { lingkupKampung } from "@/components/publik/halaman/lingkup";
import { ambilPengaturan } from "@/lib/pengaturan";

export async function generateMetadata(): Promise<Metadata> {
  const p = await ambilPengaturan();
  return { title: "Galeri Foto", description: `Dokumentasi kegiatan warga ${p.namaKampung}.` };
}

export const revalidate = 1800;

export default async function HalamanGaleri() {
  const pengaturan = await ambilPengaturan();
  return <IsiGaleri lingkup={lingkupKampung(pengaturan.namaKampung)} />;
}
