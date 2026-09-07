import KepalaHalaman from "@/components/admin/KepalaHalaman";
import { PERAN_KONTEN } from "@/lib/konstanta";
import { opsiRw, wajibPeran } from "@/lib/otorisasi";

import FormKegiatan from "../FormKegiatan";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jadwalkan Kegiatan" };

export default async function KegiatanBaru() {
  const pengguna = await wajibPeran(PERAN_KONTEN);
  const { rwList, rwTerkunci } = await opsiRw(pengguna);

  return (
    <div className="max-w-3xl">
      <KepalaHalaman
        judul="Jadwalkan Kegiatan"
        keterangan="Kegiatan berstatus terbit akan muncul pada agenda warga dan beranda situs."
        kembali={{ href: "/admin/kegiatan", label: "Kembali ke daftar kegiatan" }}
      />
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <FormKegiatan awal={null} rwList={rwList} rwTerkunci={rwTerkunci} />
      </div>
    </div>
  );
}
