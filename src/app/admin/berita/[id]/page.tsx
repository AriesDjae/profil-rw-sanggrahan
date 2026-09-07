import { notFound } from "next/navigation";

import KepalaHalaman from "@/components/admin/KepalaHalaman";
import TombolHapus from "@/components/admin/TombolHapus";
import { db } from "@/lib/db";
import { tanggalWaktu } from "@/lib/format";
import { PERAN_KONTEN } from "@/lib/konstanta";
import { opsiRw, wajibPeran, wajibSeRwAtau404 } from "@/lib/otorisasi";

import { hapusBerita } from "../aksi";
import FormBerita from "../FormBerita";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sunting Berita" };

export default async function SuntingBerita({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const pengguna = await wajibPeran(PERAN_KONTEN);
  const { id } = await params;

  const berita = await db.berita.findUnique({
    where: { id: Number(id) },
    include: { penulis: { select: { nama: true } }, rw: { select: { nama: true } } },
  });
  if (!berita) notFound();
  wajibSeRwAtau404(pengguna, berita.rwId);

  const { rwList, rwTerkunci } = await opsiRw(pengguna);

  return (
    <div className="max-w-3xl">
      <KepalaHalaman
        judul="Sunting Berita"
        keterangan={`${berita.rw?.nama ?? "Seluruh kampung"} · ditulis ${berita.penulis?.nama ?? "-"} · terakhir diperbarui ${tanggalWaktu(berita.updatedAt)} · ${berita.dilihat} kali dibaca.`}
        kembali={{ href: "/admin/berita", label: "Kembali ke daftar berita" }}
        aksi={
          <form action={hapusBerita}>
            <input type="hidden" name="id" value={berita.id} />
            <TombolHapus
              label="Hapus berita"
              pesan="Hapus berita ini secara permanen?"
            />
          </form>
        }
      />
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <FormBerita
          rwList={rwList}
          rwTerkunci={rwTerkunci}
          awal={{
            id: berita.id,
            rwId: berita.rwId,
            judul: berita.judul,
            ringkasan: berita.ringkasan,
            konten: berita.konten,
            kategori: berita.kategori,
            status: berita.status,
            gambar: berita.gambar,
          }}
        />
      </div>
    </div>
  );
}
