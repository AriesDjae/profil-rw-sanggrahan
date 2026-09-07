import Link from "next/link";

import KepalaHalaman from "@/components/admin/KepalaHalaman";
import TombolHapus from "@/components/admin/TombolHapus";
import { Lencana } from "@/components/ui/LencanaStatus";
import { db } from "@/lib/db";
import { LABEL_LEVEL_PENGURUS, PERAN_KONTEN } from "@/lib/konstanta";
import { lingkupRw, lintasRw, opsiRw, saringRw, seRw, wajibPeran } from "@/lib/otorisasi";

import { hapusPengurus } from "./aksi";
import FormPengurus from "./FormPengurus";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pengurus" };

const LABEL_LEVEL: Record<string, string> = {
  ...LABEL_LEVEL_PENGURUS,
  RW: "Pengurus RW",
  RT: "Pengurus RT",
  LEMBAGA: "Lembaga",
};

export default async function HalamanPengurusAdmin({
  searchParams,
}: {
  searchParams: Promise<{ sunting?: string }>;
}) {
  const pengguna = await wajibPeran(PERAN_KONTEN);
  const sp = await searchParams;

  const semuaRw = lintasRw(pengguna);
  const rwSaya = lingkupRw(pengguna);

  const [pengurus, rtList, sedangSuntingMentah, { rwList, rwTerkunci }] =
    await Promise.all([
      db.pengurus.findMany({
        where: saringRw(pengguna),
        orderBy: [{ rwId: "asc" }, { level: "asc" }, { urutan: "asc" }],
        include: { rt: { select: { nomor: true } }, rw: { select: { nama: true } } },
      }),
      db.rt.findMany({
        where: rwSaya === null ? {} : { rwId: rwSaya },
        orderBy: [{ rwId: "asc" }, { nomor: "asc" }],
        include: { rw: { select: { nama: true } } },
      }),
      sp.sunting
        ? db.pengurus.findUnique({ where: { id: Number(sp.sunting) } })
        : Promise.resolve(null),
      opsiRw(pengguna),
    ]);

  const sedangSunting =
    sedangSuntingMentah && seRw(pengguna, sedangSuntingMentah.rwId)
      ? sedangSuntingMentah
      : null;

  return (
    <>
      <KepalaHalaman
        judul="Struktur Pengurus"
        keterangan={
          semuaRw
            ? "Daftar pengurus yang tampil pada halaman profil tiap RW. Pengurus tingkat kampung tampil di ketiganya."
            : `Daftar pengurus ${pengguna.rw?.nama ?? "RW Anda"} yang tampil pada halaman profilnya.`
        }
      />

      <div className="grid gap-6 lg:grid-cols-[24rem_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-bold text-slate-900">
            {sedangSunting ? "Sunting pengurus" : "Tambah pengurus"}
          </h2>
          <FormPengurus
            key={sedangSunting?.id ?? "baru"}
            rwList={rwList}
            rwTerkunci={rwTerkunci}
            bolehTingkatKampung={semuaRw}
            awal={
              sedangSunting
                ? {
                    id: sedangSunting.id,
                    nama: sedangSunting.nama,
                    jabatan: sedangSunting.jabatan,
                    level: sedangSunting.level,
                    rwId: sedangSunting.rwId,
                    rtId: sedangSunting.rtId,
                    telepon: sedangSunting.telepon,
                    periode: sedangSunting.periode,
                    urutan: sedangSunting.urutan,
                    foto: sedangSunting.foto,
                  }
                : null
            }
            rtList={rtList.map((r) => ({
              id: r.id,
              rwId: r.rwId,
              nama: semuaRw ? `${r.nama} · ${r.rw.nama}` : r.nama,
            }))}
          />
          {sedangSunting && (
            <Link href="/admin/pengurus"
              className="mt-4 inline-block text-xs font-semibold text-slate-500 hover:text-brand-700"
            >
              Batal menyunting
            </Link>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <ul className="divide-y divide-slate-100">
            {pengurus.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-4 p-4">
                {p.foto ? (
                  <img src={p.foto} alt="" className="h-12 w-12 rounded-xl object-cover" />
                ) : (
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700">
                    {p.nama.slice(0, 1)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{p.nama}</p>
                  <p className="text-xs text-slate-500">
                    {p.jabatan}
                    {` · ${p.rw?.nama ?? "Seluruh kampung"}`}
                    {p.rt ? ` · RT ${p.rt.nomor}` : ""}
                    {p.periode ? ` · ${p.periode}` : ""}
                  </p>
                </div>
                <Lencana
                  anak={LABEL_LEVEL[p.level] ?? p.level}
                  warna="bg-slate-100 text-slate-600 ring-slate-200"
                />
                <div className="flex items-center gap-2">
                  <Link href={`/admin/pengurus?sunting=${p.id}`}
                    className="rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                  >
                    Sunting
                  </Link>
                  <form action={hapusPengurus}>
                    <input type="hidden" name="id" value={p.id} />
                    <TombolHapus kecil pesan="Hapus pengurus ini dari struktur?" />
                  </form>
                </div>
              </li>
            ))}
            {pengurus.length === 0 && (
              <li className="px-5 py-12 text-center text-sm text-slate-500">
                Belum ada pengurus terdaftar.
              </li>
            )}
          </ul>
        </div>
      </div>
    </>
  );
}
