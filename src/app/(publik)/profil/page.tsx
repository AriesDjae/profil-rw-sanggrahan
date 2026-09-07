import type { Metadata } from "next";

import IsiProfil from "@/components/publik/halaman/IsiProfil";
import { lingkupKampung } from "@/components/publik/halaman/lingkup";
import { ambilPengaturan } from "@/lib/pengaturan";

export async function generateMetadata(): Promise<Metadata> {
  const p = await ambilPengaturan();
  return {
    title: "Profil & Struktur Organisasi",
    description: `Sejarah, visi misi, wilayah, dan struktur kepengurusan ${p.namaKampung} beserta ketiga RW-nya.`,
  };
}

export const revalidate = 1800;

export default async function HalamanProfil() {
  const pengaturan = await ambilPengaturan();
  return <IsiProfil lingkup={lingkupKampung(pengaturan.namaKampung)} />;
}
