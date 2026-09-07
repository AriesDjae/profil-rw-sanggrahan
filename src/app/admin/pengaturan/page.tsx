import Link from "next/link";

import KepalaHalaman from "@/components/admin/KepalaHalaman";
import TombolHapus from "@/components/admin/TombolHapus";
import { db } from "@/lib/db";
import { angka } from "@/lib/format";
import { PERAN_KELOLA_AKUN } from "@/lib/konstanta";
import { lingkupRw, lintasRw, wajibPeran } from "@/lib/otorisasi";
import { ambilPengaturan } from "@/lib/pengaturan";

import { hapusRt } from "./aksi";
import FormPengaturan from "./FormPengaturan";
import FormProfilRw from "./FormProfilRw";
import FormRt from "./FormRt";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pengaturan Situs" };

export default async function HalamanPengaturan({
  searchParams,
}: {
  searchParams: Promise<{ rt?: string; rw?: string }>;
}) {
  const pengguna = await wajibPeran(PERAN_KELOLA_AKUN);
  const sp = await searchParams;

  const semuaRw = lintasRw(pengguna);
  const rwSaya = lingkupRw(pengguna);

  const [pengaturan, rwList, rtList, rtSuntingMentah] = await Promise.all([
    ambilPengaturan(),
    db.rw.findMany({
      where: semuaRw ? {} : { id: rwSaya ?? -1 },
      orderBy: { nomor: "asc" },
    }),
    db.rt.findMany({
      where: rwSaya === null ? {} : { rwId: rwSaya },
      orderBy: [{ rwId: "asc" }, { nomor: "asc" }],
      include: {
        rw: { select: { nama: true } },
        _count: { select: { warga: true, laporan: true, pengguna: true } },
      },
    }),
    sp.rt
      ? db.rt.findUnique({
          where: { id: Number(sp.rt) },
          include: { rw: { select: { id: true, nama: true } } },
        })
      : Promise.resolve(null),
  ]);

  // ?rt= bisa diketik tangan; RT milik RW lain diperlakukan seolah tidak ada.
  const rtSunting =
    rtSuntingMentah && (rwSaya === null || rtSuntingMentah.rwId === rwSaya)
      ? rtSuntingMentah
      : null;

  // Administrator kampung memilih RW mana yang profilnya sedang disunting;
  // Ketua RW hanya pernah punya satu.
  const rwDipilih = rwList.find((r) => String(r.nomor) === sp.rw) ?? rwList[0] ?? null;

  return (
    <>
      <KepalaHalaman
        judul="Pengaturan Situs"
        keterangan={
          semuaRw
            ? "Identitas kampung, profil tiap RW, dan daftar RT yang dipakai di seluruh bagian situs."
            : `Profil ${pengguna.rw?.nama ?? "RW Anda"} dan daftar RT di bawahnya. Identitas kampung diatur administrator kampung.`
        }
      />

      <div className="space-y-8">
        {semuaRw && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-bold text-slate-900">Identitas Kampung</h2>
            <p className="mt-1 mb-5 text-xs text-slate-500">
              Tampil di kop dan kaki seluruh halaman, termasuk ketiga laman RW.
            </p>
            <FormPengaturan
              awal={{
                namaKampung: pengaturan.namaKampung,
                kelurahan: pengaturan.kelurahan,
                kemantren: pengaturan.kemantren,
                kota: pengaturan.kota,
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
        )}

        {rwDipilih && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Profil {rwDipilih.nama}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Isi laman publik /rw/{rwDipilih.nomor}.
                </p>
              </div>
              {semuaRw && rwList.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {rwList.map((r) => (
                    <Link
                      key={r.id}
                      href={`/admin/pengaturan?rw=${r.nomor}`}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        r.id === rwDipilih.id
                          ? "bg-brand-600 text-white"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {r.nama}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <FormProfilRw
              key={rwDipilih.id}
              awal={{
                id: rwDipilih.id,
                nomor: rwDipilih.nomor,
                nama: rwDipilih.nama,
                tagline: rwDipilih.tagline,
                deskripsi: rwDipilih.deskripsi,
                sejarah: rwDipilih.sejarah,
                visi: rwDipilih.visi,
                misi: rwDipilih.misi,
                alamat: rwDipilih.alamat,
                telepon: rwDipilih.telepon,
                email: rwDipilih.email,
                heroFoto: rwDipilih.heroFoto,
              }}
            />
          </section>
        )}

        <section className="grid gap-6 lg:grid-cols-[24rem_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-bold text-slate-900">
              {rtSunting
                ? `Sunting RT ${rtSunting.nomor} ${rtSunting.rw.nama}`
                : "Tambah RT"}
            </h2>
            <FormRt
              key={rtSunting?.id ?? "baru"}
              awal={
                rtSunting
                  ? {
                      id: rtSunting.id,
                      nomor: rtSunting.nomor,
                      nama: rtSunting.nama,
                      wilayah: rtSunting.wilayah,
                      rw: { nama: rtSunting.rw.nama },
                    }
                  : null
              }
              rwList={rwList.map((r) => ({ id: r.id, nama: r.nama }))}
              rwTerkunci={semuaRw ? null : (rwList[0] ?? null)}
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
                  {semuaRw && <th className="px-5 py-3 font-semibold">RW</th>}
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
                      {semuaRw && (
                        <td className="px-5 py-3 text-slate-600">{rt.rw.nama}</td>
                      )}
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
