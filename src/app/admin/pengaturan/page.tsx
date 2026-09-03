import Link from "next/link";

import KepalaHalaman from "@/components/admin/KepalaHalaman";
import TombolHapus from "@/components/admin/TombolHapus";
import { db } from "@/lib/db";
import { angka } from "@/lib/format";
import { PERAN } from "@/lib/konstanta";
import { wajibPeran } from "@/lib/otorisasi";
import { ambilPengaturan } from "@/lib/pengaturan";

import { hapusRt } from "./aksi";
import FormPengaturan from "./FormPengaturan";
import FormRt from "./FormRt";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pengaturan Situs" };

export default async function HalamanPengaturan({
  searchParams,
}: {
  searchParams: Promise<{ rt?: string }>;
}) {
  await wajibPeran([PERAN.ADMIN, PERAN.KETUA_RW]);
  const sp = await searchParams;

  const [pengaturan, rtList, rtSunting] = await Promise.all([
    ambilPengaturan(),
    db.rt.findMany({
      orderBy: { nomor: "asc" },
      include: {
        _count: { select: { warga: true, laporan: true, pengguna: true } },
      },
    }),
    sp.rt ? db.rt.findUnique({ where: { id: Number(sp.rt) } }) : Promise.resolve(null),
  ]);

  return (
    <>
      <KepalaHalaman
        judul="Pengaturan Situs"
        keterangan="Identitas RW, profil wilayah, dan daftar RT yang digunakan di seluruh bagian situs."
      />

      <div className="space-y-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-5 text-sm font-bold text-slate-900">Identitas & Profil</h2>
          <FormPengaturan
            awal={{
              namaRw: pengaturan.namaRw,
              tagline: pengaturan.tagline,
              deskripsi: pengaturan.deskripsi,
              sejarah: pengaturan.sejarah,
              visi: pengaturan.visi,
              misi: pengaturan.misi,
              alamat: pengaturan.alamat,
              telepon: pengaturan.telepon,
              email: pengaturan.email,
              heroFoto: pengaturan.heroFoto,
            }}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[24rem_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-bold text-slate-900">
              {rtSunting ? `Sunting RT ${rtSunting.nomor}` : "Tambah RT"}
            </h2>
            <FormRt
              awal={
                rtSunting
                  ? {
                      id: rtSunting.id,
                      nomor: rtSunting.nomor,
                      nama: rtSunting.nama,
                      wilayah: rtSunting.wilayah,
                    }
                  : null
              }
            />
            {rtSunting && (
              <Link href="/admin/pengaturan"
                className="mt-4 inline-block text-xs font-semibold text-slate-500 hover:text-brand-700"
              >
                Batal menyunting
              </Link>
            )}
          </div>

          <div className="overflow-x-auto gulir-halus rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">RT</th>
                  <th className="px-5 py-3 font-semibold">Wilayah</th>
                  <th className="px-5 py-3 text-right font-semibold">Warga</th>
                  <th className="px-5 py-3 text-right font-semibold">Laporan</th>
                  <th className="px-5 py-3 text-right font-semibold">Akun</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {rtList.map((rt) => {
                  const terpakai =
                    rt._count.warga > 0 || rt._count.laporan > 0 || rt._count.pengguna > 0;
                  return (
                    <tr key={rt.id} className="border-t border-slate-100">
                      <td className="px-5 py-3 font-semibold text-slate-900">{rt.nama}</td>
                      <td className="px-5 py-3 text-slate-600">{rt.wilayah ?? "-"}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-600">
                        {angka(rt._count.warga)}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-600">
                        {angka(rt._count.laporan)}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-600">
                        {angka(rt._count.pengguna)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/pengaturan?rt=${rt.id}`}
                            className="rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                          >
                            Sunting
                          </Link>
                          {!terpakai && (
                            <form action={hapusRt}>
                              <input type="hidden" name="id" value={rt.id} />
                              <TombolHapus kecil pesan="Hapus RT ini?" />
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
              RT yang sudah memiliki warga, laporan kas, atau akun pengurus tidak dapat dihapus
              agar riwayat data tetap utuh.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
