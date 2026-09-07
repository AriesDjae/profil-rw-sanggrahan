import Link from "next/link";

import KepalaHalaman from "@/components/admin/KepalaHalaman";
import { db } from "@/lib/db";
import { tanggalSingkat } from "@/lib/format";
import { PERAN_KONTEN } from "@/lib/konstanta";
import { lintasRw, opsiRw, saringRw, wajibPeran } from "@/lib/otorisasi";

import FormAlbum from "./FormAlbum";

export const dynamic = "force-dynamic";
export const metadata = { title: "Galeri" };

export default async function DaftarAlbumAdmin({
  searchParams,
}: {
  searchParams: Promise<{ pesan?: string }>;
}) {
  const pengguna = await wajibPeran(PERAN_KONTEN);
  const sp = await searchParams;

  const semuaRw = lintasRw(pengguna);

  const [album, { rwList, rwTerkunci }] = await Promise.all([
    db.album.findMany({
      where: saringRw(pengguna),
      orderBy: { tanggal: "desc" },
      include: {
        rw: { select: { nama: true } },
        _count: { select: { foto: true } },
        foto: { take: 1, orderBy: { urutan: "asc" } },
      },
    }),
    opsiRw(pengguna),
  ]);

  return (
    <>
      <KepalaHalaman
        judul="Galeri Foto"
        keterangan={
          semuaRw
            ? "Kelompokkan dokumentasi kegiatan warga ke dalam album, lalu unggah fotonya. Album kampung tampil di ketiga laman RW."
            : `Album dokumentasi ${pengguna.rw?.nama ?? "RW Anda"}.`
        }
      />

      {sp.pesan && (
        <p className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {sp.pesan}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[24rem_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-bold text-slate-900">Album baru</h2>
          <FormAlbum awal={null} rwList={rwList} rwTerkunci={rwTerkunci} />
        </div>

        <div>
          {album.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center text-sm text-slate-500">
              Belum ada album. Buat album pertama di sebelah kiri.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {album.map((a) => (
                <Link
                  key={a.id}
                  href={`/admin/galeri/${a.id}`}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-brand-300 hover:shadow-sm"
                >
                  <div className="aspect-[16/9] bg-slate-100">
                    {a.foto[0] ? (
                      <img src={a.foto[0].url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-xs text-slate-400">
                        Belum ada foto
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-slate-900 group-hover:text-brand-700">
                      {a.nama}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {tanggalSingkat(a.tanggal)} · {a._count.foto} foto
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
