import type { Metadata } from "next";

import IsiPeta from "@/components/publik/halaman/IsiPeta";
import { lingkupKampung } from "@/components/publik/halaman/lingkup";
import { ambilPengaturan } from "@/lib/pengaturan";

export async function generateMetadata(): Promise<Metadata> {
  const p = await ambilPengaturan();
  return {
    title: "Peta Kampung",
    description: `Peta ${p.namaKampung} beserta letak usaha warga RW 01 dan RW 03.`,
  };
}

export const revalidate = 1800;

export default async function HalamanPeta() {
  const pengaturan = await ambilPengaturan();
  return <IsiPeta lingkup={lingkupKampung(pengaturan.namaKampung)} />;
}
