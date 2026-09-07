import type { Metadata } from "next";

import IsiGaleri from "@/components/publik/halaman/IsiGaleri";

import { judulRw, muatLingkupRw } from "../muat";

export const revalidate = 1800;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ rw: string }>;
}): Promise<Metadata> {
  const nama = await judulRw(params, "Galeri Foto");
  return { title: nama, description: `Dokumentasi kegiatan warga ${nama}.` };
}

export default async function GaleriRw({ params }: { params: Promise<{ rw: string }> }) {
  const lingkup = await muatLingkupRw(params);
  return <IsiGaleri lingkup={lingkup} />;
}
