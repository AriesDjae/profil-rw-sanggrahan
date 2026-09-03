import Link from "next/link";
import { redirect } from "next/navigation";

import KepalaHalaman from "@/components/admin/KepalaHalaman";
import KartuStatistik from "@/components/ui/KartuStatistik";
import Kosong from "@/components/ui/Kosong";
import { db } from "@/lib/db";
import { angka, tanggalSingkat, umur } from "@/lib/format";
import { LABEL_HUBUNGAN, PERAN } from "@/lib/konstanta";
import { lingkupRt, wajibMasuk } from "@/lib/otorisasi";

export const dynamic = "force-dynamic";
export const metadata = { title: "Data Warga" };

const PER_HALAMAN = 25;

export default async function DaftarWargaAdmin({
  searchParams,
}: {
  searchParams: Promise<{ cari?: string; rt?: string; halaman?: string; pesan?: string }>;
}) {
  const [pengguna, sp] = await Promise.all([wajibMasuk(), searchParams]);

  const bolehAkses = (
    [PERAN.ADMIN, PERAN.SEKRETARIS, PERAN.KETUA_RW, PERAN.KETUA_RT] as string[]
  ).includes(pengguna.peran);
  if (!bolehAkses) redirect("/admin?galat=akses");

  const lingkup = lingkupRt(pengguna);
  const rtFilter = lingkup ?? (sp.rt ? Number(sp.rt) : undefined);
  const cari = (sp.cari ?? "").trim();
  const halaman = Math.max(1, Number(sp.halaman ?? 1) || 1);

  const where = {
    ...(rtFilter ? { rtId: rtFilter } : {}),
    ...(cari
      ? {
          OR: [
            { nama: { contains: cari } },
            { nik: { contains: cari } },
            { noKk: { contains: cari } },
            { alamat: { contains: cari } },
          ],
        }
      : {}),
  };

  const [warga, total, rtList, totalKk] = await Promise.all([
    db.warga.findMany({
      where,
      include: { rt: { select: { nomor: true } } },
      orderBy: [{ rtId: "asc" }, { noKk: "asc" }, { nama: "asc" }],
      skip: (halaman - 1) * PER_HALAMAN,
      take: PER_HALAMAN,
    }),
    db.warga.count({ where }),
    db.rt.findMany({ orderBy: { nomor: "asc" } }),
    db.warga.findMany({
      where: rtFilter ? { rtId: rtFilter } : undefined,
      select: { noKk: true },
      distinct: ["noKk"],
    }),
  ]);

  const totalHalaman = Math.max(1, Math.ceil(total / PER_HALAMAN));

  const tautanHalaman = (h: number) => {
    const q = new URLSearchParams();
    if (cari) q.set("cari", cari);
    if (sp.rt) q.set("rt", sp.rt);
    if (h > 1) q.set("halaman", String(h));
    const s = q.toString();
    return `/admin/warga${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <KepalaHalaman
        judul="Data Warga"
        keterangan={
          lingkup
            ? `Pendataan kependudukan ${pengguna.rt?.nama ?? "RT Anda"}. Halaman publik hanya menampilkan angka agregat, bukan identitas warga.`
            : "Pendataan kependudukan seluruh RW. Halaman publik hanya menampilkan angka agregat, bukan identitas warga."
        }
        aksi={
          <Link
            href="/admin/warga/baru"
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Tambah warga
          </Link>
        }
      />

      {sp.pesan && (
        <p className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {sp.pesan}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <KartuStatistik label="Jiwa terdata" nilai={angka(total)} nada="brand" />
        <KartuStatistik
          label="Kartu keluarga"
          nilai={angka(totalKk.filter((k) => k.noKk).length)}
        />
        <KartuStatistik
          label="Cakupan"
          nilai={rtFilter ? `RT ${rtList.find((r) => r.id === rtFilter)?.nomor ?? "-"}` : `${rtList.length} RT`}
        />
      </div>

      <form className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <input
          type="search"
          name="cari"
          defaultValue={cari}
          placeholder="Cari nama, NIK, nomor KK, atau alamat"
          className="min-w-56 flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
        {!lingkup && (
          <select
            name="rt"
            defaultValue={sp.rt ?? ""}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
          >
            <option value="">Semua RT</option>
            {rtList.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nama}
              </option>
            ))}
          </select>
        )}
        <button
          type="submit"
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Cari
        </button>
        {(cari || sp.rt) && (
          <Link
            href="/admin/warga"
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600"
          >
            Atur ulang
          </Link>
        )}
      </form>

      <div className="mt-6">
        {warga.length === 0 ? (
          <Kosong
            judul="Data warga tidak ditemukan"
            keterangan={cari ? `Tidak ada hasil untuk "${cari}".` : "Belum ada warga terdata."}
          />
        ) : (
          <div className="overflow-x-auto gulir-halus rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Nama</th>
                  <th className="px-5 py-3 font-semibold">RT</th>
                  <th className="px-5 py-3 font-semibold">L/P</th>
                  <th className="px-5 py-3 font-semibold">Usia</th>
                  <th className="px-5 py-3 font-semibold">Hubungan</th>
                  <th className="px-5 py-3 font-semibold">Pekerjaan</th>
                  <th className="px-5 py-3 font-semibold">No. KK</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {warga.map((w) => (
                  <tr key={w.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{w.nama}</p>
                      <p className="text-xs text-slate-500">
                        {w.tempatLahir ?? "-"}
                        {w.tanggalLahir ? `, ${tanggalSingkat(w.tanggalLahir)}` : ""}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">RT {w.rt.nomor}</td>
                    <td className="px-5 py-3 text-slate-600">{w.jenisKelamin}</td>
                    <td className="px-5 py-3 tabular-nums text-slate-600">
                      {umur(w.tanggalLahir) ?? "-"}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {LABEL_HUBUNGAN[w.hubungan] ?? w.hubungan}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{w.pekerjaan ?? "-"}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{w.noKk ?? "-"}</td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/warga/${w.id}`}
                        className="rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
                      >
                        Sunting
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalHalaman > 1 && (
        <nav className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {Array.from({ length: totalHalaman }, (_, i) => i + 1)
            .filter(
              (h) => h === 1 || h === totalHalaman || Math.abs(h - halaman) <= 2,
            )
            .map((h, i, arr) => (
              <span key={h} className="flex items-center gap-2">
                {i > 0 && arr[i - 1] !== h - 1 && (
                  <span className="text-xs text-slate-400">…</span>
                )}
                <Link
                  href={tautanHalaman(h)}
                  className={`grid h-9 w-9 place-items-center rounded-lg text-sm font-semibold ${
                    h === halaman
                      ? "bg-brand-600 text-white"
                      : "border border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {h}
                </Link>
              </span>
            ))}
        </nav>
      )}

      <p className="mt-6 text-xs text-slate-500">
        Menampilkan {warga.length} dari {angka(total)} jiwa terdata.
      </p>
    </>
  );
}
