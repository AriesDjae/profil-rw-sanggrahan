import Link from "next/link";

import KepalaHalaman from "@/components/admin/KepalaHalaman";
import TombolHapus from "@/components/admin/TombolHapus";
import { Lencana } from "@/components/ui/LencanaStatus";
import { db } from "@/lib/db";
import { tanggalSingkat, untukInputTanggal } from "@/lib/format";
import { PERAN_KONTEN } from "@/lib/konstanta";
import { wajibPeran } from "@/lib/otorisasi";

import { alihkanAktif, hapusPengumuman } from "./aksi";
import FormPengumuman from "./FormPengumuman";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pengumuman" };

export default async function HalamanPengumumanAdmin({
  searchParams,
}: {
  searchParams: Promise<{ sunting?: string }>;
}) {
  await wajibPeran(PERAN_KONTEN);
  const sp = await searchParams;

  const [daftar, sedangSunting] = await Promise.all([
    db.pengumuman.findMany({ orderBy: [{ aktif: "desc" }, { createdAt: "desc" }] }),
    sp.sunting
      ? db.pengumuman.findUnique({ where: { id: Number(sp.sunting) } })
      : Promise.resolve(null),
  ]);

  return (
    <>
      <KepalaHalaman
        judul="Pengumuman"
        keterangan="Informasi singkat yang tampil pada bilah pengumuman di beranda situs warga."
      />

      <div className="grid gap-6 lg:grid-cols-[24rem_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-bold text-slate-900">
            {sedangSunting ? "Sunting pengumuman" : "Tambah pengumuman"}
          </h2>
          <FormPengumuman
            awal={
              sedangSunting
                ? {
                    id: sedangSunting.id,
                    judul: sedangSunting.judul,
                    isi: sedangSunting.isi,
                    penting: sedangSunting.penting,
                    aktif: sedangSunting.aktif,
                    berakhir: untukInputTanggal(sedangSunting.berakhir),
                  }
                : null
            }
          />
          {sedangSunting && (
            <Link href="/admin/pengumuman"
              className="mt-4 inline-block text-xs font-semibold text-slate-500 hover:text-brand-700"
            >
              Batal menyunting
            </Link>
          )}
        </div>

        <div className="space-y-3">
          {daftar.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center text-sm text-slate-500">
              Belum ada pengumuman.
            </p>
          ) : (
            daftar.map((p) => {
              const kedaluwarsa = p.berakhir ? new Date(p.berakhir) < new Date() : false;
              return (
                <article
                  key={p.id}
                  className={`rounded-2xl border bg-white p-5 ${
                    p.aktif && !kedaluwarsa ? "border-slate-200" : "border-slate-200 opacity-70"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap gap-2">
                        {p.penting && (
                          <Lencana
                            anak="Penting"
                            warna="bg-aksen-100 text-aksen-800 ring-aksen-200"
                          />
                        )}
                        <Lencana
                          anak={p.aktif ? "Aktif" : "Nonaktif"}
                          warna={
                            p.aktif
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : "bg-slate-100 text-slate-600 ring-slate-200"
                          }
                        />
                        {kedaluwarsa && (
                          <Lencana
                            anak="Sudah lewat"
                            warna="bg-slate-100 text-slate-500 ring-slate-200"
                          />
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-900">{p.judul}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{p.isi}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        Dibuat {tanggalSingkat(p.createdAt)}
                        {p.berakhir ? ` · berlaku sampai ${tanggalSingkat(p.berakhir)}` : ""}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <form action={alihkanAktif}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          {p.aktif ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      </form>
                      <Link href={`/admin/pengumuman?sunting=${p.id}`}
                        className="rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                      >
                        Sunting
                      </Link>
                      <form action={hapusPengumuman}>
                        <input type="hidden" name="id" value={p.id} />
                        <TombolHapus kecil pesan="Hapus pengumuman ini?" />
                      </form>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
