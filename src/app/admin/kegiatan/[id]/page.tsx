import { notFound } from "next/navigation";

import KepalaHalaman from "@/components/admin/KepalaHalaman";
import TombolHapus from "@/components/admin/TombolHapus";
import { db } from "@/lib/db";
import { untukInputDatetime } from "@/lib/format";
import { PERAN_KONTEN } from "@/lib/konstanta";
import { opsiRw, wajibPeran, wajibSeRwAtau404 } from "@/lib/otorisasi";

import { hapusKegiatan } from "../aksi";
import FormKegiatan from "../FormKegiatan";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sunting Kegiatan" };

export default async function SuntingKegiatan({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const pengguna = await wajibPeran(PERAN_KONTEN);
  const { id } = await params;

  const kegiatan = await db.kegiatan.findUnique({ where: { id: Number(id) } });
  if (!kegiatan) notFound();
  wajibSeRwAtau404(pengguna, kegiatan.rwId);

  const { rwList, rwTerkunci } = await opsiRw(pengguna);

  return (
    <div className="max-w-3xl">
      <KepalaHalaman
        judul="Sunting Kegiatan"
        kembali={{ href: "/admin/kegiatan", label: "Kembali ke daftar kegiatan" }}
        aksi={
          <form action={hapusKegiatan}>
            <input type="hidden" name="id" value={kegiatan.id} />
            <TombolHapus label="Hapus kegiatan" pesan="Hapus kegiatan ini secara permanen?" />
          </form>
        }
      />
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <FormKegiatan
          rwList={rwList}
          rwTerkunci={rwTerkunci}
          awal={{
            id: kegiatan.id,
            rwId: kegiatan.rwId,
            judul: kegiatan.judul,
            deskripsi: kegiatan.deskripsi,
            mulai: untukInputDatetime(kegiatan.mulai),
            selesai: untukInputDatetime(kegiatan.selesai),
            lokasi: kegiatan.lokasi,
            penyelenggara: kegiatan.penyelenggara,
            kategori: kegiatan.kategori,
            kontak: kegiatan.kontak,
            status: kegiatan.status,
            gambar: kegiatan.gambar,
          }}
        />
      </div>
    </div>
  );
}
