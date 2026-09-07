import KepalaHalaman from "@/components/admin/KepalaHalaman";
import { PERAN_KONTEN } from "@/lib/konstanta";
import { opsiRw, wajibPeran } from "@/lib/otorisasi";

import FormBerita from "../FormBerita";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tulis Berita" };

export default async function BeritaBaru() {
  const pengguna = await wajibPeran(PERAN_KONTEN);
  const { rwList, rwTerkunci } = await opsiRw(pengguna);

  return (
    <div className="max-w-3xl">
      <KepalaHalaman
        judul="Tulis Berita Baru"
        keterangan="Berita berstatus draf hanya terlihat pengurus. Ubah menjadi terbit agar tampil di situs warga."
        kembali={{ href: "/admin/berita", label: "Kembali ke daftar berita" }}
      />
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <FormBerita awal={null} rwList={rwList} rwTerkunci={rwTerkunci} />
      </div>
    </div>
  );
}
