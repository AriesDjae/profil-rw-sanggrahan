import type { Metadata } from "next";

import IsiBerita from "@/components/publik/halaman/IsiBerita";
import { lingkupKampung } from "@/components/publik/halaman/lingkup";
import { ambilPengaturan } from "@/lib/pengaturan";

export async function generateMetadata(): Promise<Metadata> {
  const p = await ambilPengaturan();
  return {
    title: "Berita",
    description: `Kabar dan informasi terbaru dari RW 01, RW 02, dan RW 03 ${p.namaKampung}.`,
  };
}

// Dirender sekali lalu disajikan dari cache. Setiap perubahan dari panel
// pengurus memanggil revalidatePath, jadi halaman ini tetap segar seketika;
// angka 300 detik hanya jaring pengaman bila ada perubahan di luar aplikasi.
export const revalidate = 300;

/** Berita ketiga RW. Versi per-RW ada di /rw/[n]/berita, isinya komponen sama. */
export default async function HalamanBerita({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; halaman?: string }>;
}) {
  const [sp, pengaturan] = await Promise.all([searchParams, ambilPengaturan()]);
  return (
    <IsiBerita
      lingkup={lingkupKampung(pengaturan.namaKampung)}
      kategori={sp.kategori}
      halaman={Math.max(1, Number(sp.halaman ?? 1) || 1)}
    />
  );
}
