import { notFound } from "next/navigation";

import KepalaHalaman from "@/components/admin/KepalaHalaman";
import TombolHapus from "@/components/admin/TombolHapus";
import { db } from "@/lib/db";
import { untukInputTanggal } from "@/lib/format";
import { PERAN_KONTEN } from "@/lib/konstanta";
import { wajibPeran } from "@/lib/otorisasi";

import { hapusAlbum, hapusFoto } from "../aksi";
import FormAlbum from "../FormAlbum";
import FormFoto from "../FormFoto";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kelola Album" };

export default async function KelolaAlbum({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await wajibPeran(PERAN_KONTEN);
  const { id } = await params;

  const album = await db.album.findUnique({
    where: { id: Number(id) },
    include: { foto: { orderBy: { urutan: "asc" } } },
  });
  if (!album) notFound();

  return (
    <>
      <KepalaHalaman
        judul={album.nama}
        keterangan={`${album.foto.length} foto dalam album ini.`}
        kembali={{ href: "/admin/galeri", label: "Kembali ke daftar album" }}
        aksi={
          <form action={hapusAlbum}>
            <input type="hidden" name="id" value={album.id} />
            <TombolHapus
              label="Hapus album"
              pesan="Hapus album beserta seluruh fotonya?"
            />
          </form>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[24rem_1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-bold text-slate-900">Unggah foto</h2>
            <FormFoto albumId={album.id} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-bold text-slate-900">Data album</h2>
            <FormAlbum
              awal={{
                id: album.id,
                nama: album.nama,
                deskripsi: album.deskripsi,
                tanggal: untukInputTanggal(album.tanggal),
              }}
            />
          </div>
        </div>

        <div>
          {album.foto.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center text-sm text-slate-500">
              Belum ada foto pada album ini.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {album.foto.map((f) => (
                <div
                  key={f.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                  <img src={f.url} alt={f.judul ?? ""} className="aspect-square w-full object-cover" />
                  <div className="flex items-center justify-between gap-2 px-3 py-2">
                    <p className="truncate text-xs text-slate-500">{f.judul ?? "Tanpa judul"}</p>
                    <form action={hapusFoto}>
                      <input type="hidden" name="id" value={f.id} />
                      <TombolHapus kecil label="Hapus foto" pesan="Hapus foto ini?" />
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
