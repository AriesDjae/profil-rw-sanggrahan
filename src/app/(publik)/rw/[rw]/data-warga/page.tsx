import type { Metadata } from "next";

import IsiDataWarga from "@/components/publik/halaman/IsiDataWarga";

import { judulRw, muatLingkupRw } from "../muat";

export const revalidate = 1800;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ rw: string }>;
}): Promise<Metadata> {
  const nama = await judulRw(params, "Data Warga");
  return { title: nama, description: `Statistik kependudukan ${nama}: jumlah jiwa, kepala keluarga, komposisi usia, pendidikan, dan pekerjaan.` };
}

export default async function DataWargaRw({
  params,
  searchParams,
}: {
  params: Promise<{ rw: string }>;
  searchParams: Promise<{ rt?: string }>;
}) {
  const [lingkup, sp] = await Promise.all([muatLingkupRw(params), searchParams]);
  return <IsiDataWarga lingkup={lingkup} rtId={sp.rt ? Number(sp.rt) : undefined} />;
}
