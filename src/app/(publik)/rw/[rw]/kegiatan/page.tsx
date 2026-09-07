import type { Metadata } from "next";

import IsiKegiatan from "@/components/publik/halaman/IsiKegiatan";

import { judulRw, muatLingkupRw } from "../muat";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ rw: string }>;
}): Promise<Metadata> {
  const nama = await judulRw(params, "Agenda Kegiatan");
  return { title: nama, description: `Jadwal kegiatan warga ${nama}: kerja bakti, posyandu, rapat, dan kegiatan sosial lainnya.` };
}

export default async function KegiatanRw({
  params,
  searchParams,
}: {
  params: Promise<{ rw: string }>;
  searchParams: Promise<{ tampil?: string }>;
}) {
  const [lingkup, sp] = await Promise.all([muatLingkupRw(params), searchParams]);
  return <IsiKegiatan lingkup={lingkup} tampilLampau={sp.tampil === "lampau"} />;
}
