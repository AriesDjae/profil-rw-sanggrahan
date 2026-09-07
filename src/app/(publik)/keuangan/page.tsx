import type { Metadata } from "next";

import IsiKeuangan from "@/components/publik/halaman/IsiKeuangan";
import { lingkupKampung } from "@/components/publik/halaman/lingkup";
import { ambilPengaturan } from "@/lib/pengaturan";

export async function generateMetadata(): Promise<Metadata> {
  const p = await ambilPengaturan();
  return {
    title: "Laporan Keuangan",
    description: `Laporan kas RT di ${p.namaKampung} yang telah diverifikasi Ketua RT dan disetujui Ketua RW.`,
  };
}

export const revalidate = 300;

export default async function HalamanKeuangan({
  searchParams,
}: {
  searchParams: Promise<{ rt?: string; tahun?: string }>;
}) {
  const [sp, pengaturan] = await Promise.all([searchParams, ambilPengaturan()]);
  return (
    <IsiKeuangan
      lingkup={lingkupKampung(pengaturan.namaKampung)}
      rtId={sp.rt ? Number(sp.rt) : undefined}
      tahunDiminta={sp.tahun ? Number(sp.tahun) : undefined}
    />
  );
}
