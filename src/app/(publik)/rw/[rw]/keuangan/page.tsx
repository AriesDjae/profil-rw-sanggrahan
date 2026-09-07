import type { Metadata } from "next";

import IsiKeuangan from "@/components/publik/halaman/IsiKeuangan";

import { judulRw, muatLingkupRw } from "../muat";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ rw: string }>;
}): Promise<Metadata> {
  const nama = await judulRw(params, "Laporan Keuangan");
  return { title: nama, description: `Laporan kas RT di ${nama} yang telah diverifikasi Ketua RT dan disetujui Ketua RW.` };
}

export default async function KeuanganRw({
  params,
  searchParams,
}: {
  params: Promise<{ rw: string }>;
  searchParams: Promise<{ rt?: string; tahun?: string }>;
}) {
  const [lingkup, sp] = await Promise.all([muatLingkupRw(params), searchParams]);
  return (
    <IsiKeuangan
      lingkup={lingkup}
      rtId={sp.rt ? Number(sp.rt) : undefined}
      tahunDiminta={sp.tahun ? Number(sp.tahun) : undefined}
    />
  );
}
