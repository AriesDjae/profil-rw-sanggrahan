import Link from "next/link";

import KepalaHalaman from "@/components/admin/KepalaHalaman";
import TombolHapus from "@/components/admin/TombolHapus";
import { Lencana } from "@/components/ui/LencanaStatus";
import { db } from "@/lib/db";
import { tanggalSingkat } from "@/lib/format";
import { LABEL_PERAN, PERAN, PERAN_KELOLA_AKUN, type Peran } from "@/lib/konstanta";
import { lingkupRw, lintasRw, wajibPeran } from "@/lib/otorisasi";

import { alihkanAktifPengguna, hapusPengguna } from "./aksi";
import FormPengguna from "./FormPengguna";

export const dynamic = "force-dynamic";
export const metadata = { title: "Akun Pengguna" };

export default async function HalamanPenggunaAdmin({
  searchParams,
}: {
  searchParams: Promise<{ sunting?: string; pesan?: string; galat?: string }>;
}) {
  const saya = await wajibPeran(PERAN_KELOLA_AKUN);
  const sp = await searchParams;

  const lingkup = lingkupRw(saya);
  const semuaRw = lintasRw(saya);

  // Ketua RW melihat akun RW-nya saja. Administrator kampung melihat semuanya,
  // termasuk administrator lain yang memang tidak bernaung di RW mana pun.
  const rwSaya = lingkup ?? -1;
  const saringAkun = semuaRw
    ? {}
    : { OR: [{ rwId: rwSaya }, { rt: { rwId: rwSaya } }] };

  const [pengguna, rwList, rtList, sedangSunting] = await Promise.all([
    db.user.findMany({
      where: saringAkun,
      orderBy: [{ rwId: "asc" }, { peran: "asc" }, { nama: "asc" }],
      include: {
        rt: { select: { nomor: true } },
        rw: { select: { nama: true } },
      },
    }),
    db.rw.findMany({
      where: semuaRw ? {} : { id: rwSaya },
      orderBy: { nomor: "asc" },
      select: { id: true, nomor: true, nama: true },
    }),
    db.rt.findMany({
      where: semuaRw ? {} : { rwId: rwSaya },
      orderBy: [{ rwId: "asc" }, { nomor: "asc" }],
      include: { rw: { select: { nama: true } } },
    }),
    sp.sunting
      ? db.user.findUnique({ where: { id: Number(sp.sunting) } })
      : Promise.resolve(null),
  ]);

  // Tautan ?sunting= bisa diketik tangan. Akun di luar lingkup diperlakukan
  // seolah tidak ada, bukan ditampilkan lalu ditolak saat disimpan.
  const bolehSunting =
    sedangSunting &&
    (semuaRw ||
      (sedangSunting.peran !== PERAN.ADMIN &&
        (sedangSunting.rwId === lingkup ||
          rtList.some((r) => r.id === sedangSunting.rtId))));
  const sunting = bolehSunting ? sedangSunting : null;

  const rwTerkunci = semuaRw ? null : (rwList[0] ?? null);

  return (
    <>
      <KepalaHalaman
        judul="Akun Pengguna"
        keterangan={
          semuaRw
            ? "Kelola akun pengurus ketiga RW beserta perannya. Peran menentukan tahap mana yang dapat ditandatangani pada alur laporan keuangan."
            : `Kelola akun pengurus ${rwTerkunci?.nama ?? "RW Anda"}. Akun RW lain diurus pengurus RW tersebut atau administrator kampung.`
        }
      />

      {sp.pesan && (
        <p className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {sp.pesan}
        </p>
      )}
      {sp.galat && (
        <p className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {sp.galat}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[24rem_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-bold text-slate-900">
            {sunting ? `Sunting akun ${sunting.nama}` : "Buat akun baru"}
          </h2>
          <FormPengguna
            awal={
              sunting
                ? {
                    id: sunting.id,
                    nama: sunting.nama,
                    email: sunting.email,
                    peran: sunting.peran,
                    rwId: sunting.rwId,
                    rtId: sunting.rtId,
                    jabatan: sunting.jabatan,
                    telepon: sunting.telepon,
                    aktif: sunting.aktif,
                  }
                : null
            }
            rwList={rwList}
            rtList={rtList.map((r) => ({
              id: r.id,
              rwId: r.rwId,
              nama: semuaRw ? `${r.nama} (${r.rw.nama})` : r.nama,
            }))}
            bolehAngkatAdmin={saya.peran === PERAN.ADMIN}
            rwTerkunci={rwTerkunci}
          />
          {sunting && (
            <Link href="/admin/pengguna"
              className="mt-4 inline-block text-xs font-semibold text-slate-500 hover:text-brand-700"
            >
              Batal menyunting
            </Link>
          )}
        </div>

        <div className="overflow-x-auto gulir-halus rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Nama</th>
                <th className="px-5 py-3 font-semibold">Peran</th>
                <th className="px-5 py-3 font-semibold">Lingkup</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {pengguna.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">
                      {u.nama}
                      {u.id === saya.id && (
                        <span className="ml-2 text-xs font-normal text-slate-400">(Anda)</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {LABEL_PERAN[u.peran as Peran] ?? u.peran}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {u.rt
                      ? `RT ${u.rt.nomor} · ${u.rw?.nama ?? "-"}`
                      : (u.rw?.nama ?? "Seluruh kampung")}
                  </td>
                  <td className="px-5 py-3">
                    <Lencana
                      anak={u.aktif ? "Aktif" : "Nonaktif"}
                      warna={
                        u.aktif
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-slate-100 text-slate-600 ring-slate-200"
                      }
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      Dibuat {tanggalSingkat(u.createdAt)}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {u.id !== saya.id && (
                        <form action={alihkanAktifPengguna}>
                          <input type="hidden" name="id" value={u.id} />
                          <button
                            type="submit"
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            {u.aktif ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        </form>
                      )}
                      <Link href={`/admin/pengguna?sunting=${u.id}`}
                        className="rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                      >
                        Sunting
                      </Link>
                      {u.id !== saya.id && (
                        <form action={hapusPengguna}>
                          <input type="hidden" name="id" value={u.id} />
                          <TombolHapus kecil pesan="Hapus akun ini secara permanen?" />
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
