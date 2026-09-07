import type { Metadata } from "next";

import IsiDataWarga from "@/components/publik/halaman/IsiDataWarga";
import { lingkupKampung } from "@/components/publik/halaman/lingkup";
import { ambilPengaturan } from "@/lib/pengaturan";

export async function generateMetadata(): Promise<Metadata> {
  const p = await ambilPengaturan();
  return {
    title: "Data Warga",
    description: `Statistik kependudukan ${p.namaKampung} (RW 01, 02, dan 03): jumlah jiwa, kepala keluarga, komposisi usia, pendidikan, dan pekerjaan.`,
  };
}

export const revalidate = 1800;

export default async function HalamanDataWarga({
  searchParams,
}: {
  searchParams: Promise<{ rt?: string }>;
}) {
  const [sp, pengaturan] = await Promise.all([searchParams, ambilPengaturan()]);
  return (
    <IsiDataWarga
      lingkup={lingkupKampung(pengaturan.namaKampung)}
      rtId={sp.rt ? Number(sp.rt) : undefined}
    />
  );
}
