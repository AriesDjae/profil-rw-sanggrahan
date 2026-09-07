import type { Metadata } from "next";

import IsiBeranda from "@/components/publik/halaman/IsiBeranda";
import { ambilPengaturan } from "@/lib/pengaturan";
import { daftarRw } from "@/lib/rw";

import { judulRw, muatLingkupRw } from "./muat";

export const revalidate = 300;

/** Ketiga laman RW dibangun lebih dulu supaya kunjungan pertama tidak menunggu. */
export async function generateStaticParams() {
  const rw = await daftarRw();
  return rw.map((r) => ({ rw: String(r.nomor) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ rw: string }>;
}): Promise<Metadata> {
  const [nama, pengaturan] = await Promise.all([judulRw(params), ambilPengaturan()]);
  return {
    title: nama,
    description: `Berita, agenda kegiatan, data kependudukan, dan laporan kas ${nama} ${pengaturan.namaKampung}.`,
  };
}

export default async function BerandaRw({ params }: { params: Promise<{ rw: string }> }) {
  const lingkup = await muatLingkupRw(params);
  return <IsiBeranda lingkup={lingkup} />;
}
