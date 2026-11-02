import type { Metadata } from "next";

import IsiPeta from "@/components/publik/halaman/IsiPeta";

import { judulRw, muatLingkupRw } from "../muat";

export const revalidate = 1800;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ rw: string }>;
}): Promise<Metadata> {
  const nama = await judulRw(params, "Peta");
  return { title: nama, description: `Peta wilayah dan letak usaha warga ${nama}.` };
}

export default async function PetaRw({ params }: { params: Promise<{ rw: string }> }) {
  const lingkup = await muatLingkupRw(params);
  return <IsiPeta lingkup={lingkup} />;
}
