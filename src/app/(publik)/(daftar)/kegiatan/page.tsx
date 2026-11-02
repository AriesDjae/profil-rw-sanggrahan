import type { Metadata } from "next";

import IsiKegiatan from "@/components/publik/halaman/IsiKegiatan";
import { lingkupKampung } from "@/components/publik/halaman/lingkup";
import { ambilPengaturan } from "@/lib/pengaturan";

export async function generateMetadata(): Promise<Metadata> {
  const p = await ambilPengaturan();
  return {
    title: "Agenda Kegiatan",
    description: `Jadwal kegiatan warga ${p.namaKampung} (RW 01, 02, dan 03): kerja bakti, posyandu, rapat, dan kegiatan sosial lainnya.`,
  };
}

export const revalidate = 300;

export default async function HalamanKegiatan({
  searchParams,
}: {
  searchParams: Promise<{ tampil?: string }>;
}) {
  const [sp, pengaturan] = await Promise.all([searchParams, ambilPengaturan()]);
  return (
    <IsiKegiatan
      lingkup={lingkupKampung(pengaturan.namaKampung)}
      tampilLampau={sp.tampil === "lampau"}
    />
  );
}
