import type { Metadata } from "next";

import IsiProfil from "@/components/publik/halaman/IsiProfil";

import { judulRw, muatLingkupRw } from "../muat";

export const revalidate = 1800;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ rw: string }>;
}): Promise<Metadata> {
  const nama = await judulRw(params, "Profil");
  return { title: nama, description: `Sejarah, visi misi, wilayah, dan struktur kepengurusan ${nama}.` };
}

export default async function ProfilRw({ params }: { params: Promise<{ rw: string }> }) {
  const lingkup = await muatLingkupRw(params);
  return <IsiProfil lingkup={lingkup} />;
}
