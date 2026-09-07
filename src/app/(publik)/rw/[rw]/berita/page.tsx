import type { Metadata } from "next";

import IsiBerita from "@/components/publik/halaman/IsiBerita";

import { judulRw, muatLingkupRw } from "../muat";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ rw: string }>;
}): Promise<Metadata> {
  const nama = await judulRw(params, "Berita");
  return { title: nama, description: `Kabar dan informasi terbaru dari ${nama}.` };
}

export default async function BeritaRw({
  params,
  searchParams,
}: {
  params: Promise<{ rw: string }>;
  searchParams: Promise<{ kategori?: string; halaman?: string }>;
}) {
  const [lingkup, sp] = await Promise.all([muatLingkupRw(params), searchParams]);
  return (
    <IsiBerita
      lingkup={lingkup}
      kategori={sp.kategori}
      halaman={Math.max(1, Number(sp.halaman ?? 1) || 1)}
    />
  );
}
