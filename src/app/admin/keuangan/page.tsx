import Link from "next/link";

import KepalaHalaman from "@/components/admin/KepalaHalaman";
import { LencanaStatus } from "@/components/ui/LencanaStatus";
import KartuStatistik from "@/components/ui/KartuStatistik";
import Kosong from "@/components/ui/Kosong";
import { db } from "@/lib/db";
import { periode, rupiah, tanggalSingkat } from "@/lib/format";
import { hitungRingkasan } from "@/lib/keuangan";
import { LABEL_STATUS_LAPORAN, PERAN, STATUS_LAPORAN } from "@/lib/konstanta";
import { lingkupRt, wajibMasuk } from "@/lib/otorisasi";

export const dynamic = "force-dynamic";

export const metadata = { title: "Kas & Laporan" };

export default async function DaftarLaporanAdmin({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tahun?: string; rt?: string; pesan?: string }>;
}) {
  const [pengguna, sp] = await Promise.all([wajibMasuk(), searchParams]);
  const lingkup = lingkupRt(pengguna);

  const rtFilter = lingkup ?? (sp.rt ? Number(sp.rt) : undefined);
  const tahun = sp.tahun ? Number(sp.tahun) : undefined;
  const status = sp.status;

  const where = {
    ...(rtFilter ? { rtId: rtFilter } : {}),
    ...(tahun ? { tahun } : {}),
    ...(status ? { status } : {}),
  };

  const [laporan, rtList, tahunTersedia] = await Promise.all([
    db.laporanKeuangan.findMany({
      where,
      include: {
        rt: true,
        dibuatOleh: { select: { nama: true } },
        transaksi: { select: { jenis: true, jumlah: true } },
      },
      orderBy: [{ tahun: "desc" }, { bulan: "desc" }, { rtId: "asc" }],
      take: 100,
    }),
    db.rt.findMany({ orderBy: { nomor: "asc" } }),
    db.laporanKeuangan.findMany({
      distinct: ["tahun"],
      select: { tahun: true },
      orderBy: { tahun: "desc" },
    }),
  ]);

  const ringkas = laporan.map((l) => ({
    ...l,
    hitung: hitungRingkasan(l.transaksi, l.saldoAwal),
  }));

  const bolehBuat =
    pengguna.peran === PERAN.BENDAHARA_RT || pengguna.peran === PERAN.ADMIN;

  const jumlahPerStatus = Object.values(STATUS_LAPORAN).map((s) => ({
    status: s,
    jumlah: ringkas.filter((l) => l.status === s).length,
  }));

  const tautan = (ubah: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const gabung = { status, tahun: tahun ? String(tahun) : undefined, rt: sp.rt, ...ubah };
    for (const [k, v] of Object.entries(gabung)) if (v) q.set(k, v);
    const s = q.toString();
    return `/admin/keuangan${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <KepalaHalaman
        judul="Kas & Laporan Keuangan"
        keterangan={
          lingkup
            ? `Laporan kas ${pengguna.rt?.nama ?? "RT Anda"}. Laporan hanya tampil ke warga setelah diverifikasi Ketua RT dan disetujui Ketua RW.`
            : "Seluruh laporan kas RT di lingkungan RW. Gunakan penyaring untuk menelusuri periode tertentu."
        }
        aksi={
          bolehBuat ? (
            <Link
              href="/admin/keuangan/baru"
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Buat laporan baru
            </Link>
          ) : undefined
        }
      />

      {sp.pesan && (
        <p className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {sp.pesan === "laporan-dihapus" ? "Laporan berhasil dihapus." : sp.pesan}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KartuStatistik label="Total laporan" nilai={String(ringkas.length)} />
        <KartuStatistik
          label="Menunggu verifikasi RT"
          nilai={String(
            jumlahPerStatus.find((j) => j.status === STATUS_LAPORAN.DIAJUKAN)?.jumlah ?? 0,
          )}
          nada="peringatan"
        />
        <KartuStatistik
          label="Menunggu persetujuan RW"
          nilai={String(
            jumlahPerStatus.find((j) => j.status === STATUS_LAPORAN.DIVERIFIKASI_RT)
              ?.jumlah ?? 0,
          )}
          nada="peringatan"
        />
        <KartuStatistik
          label="Sudah terbit"
          nilai={String(
            jumlahPerStatus.find((j) => j.status === STATUS_LAPORAN.DISETUJUI)?.jumlah ?? 0,
          )}
          nada="positif"
        />
      </div>

      {/* Penyaring */}
      <div className="mt-8 space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
          </span>
          <Link
            href={tautan({ status: undefined })}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
              !status ? "bg-brand-600 text-white" : "border border-slate-200 text-slate-600"
            }`}
          >
            Semua
          </Link>
          {Object.values(STATUS_LAPORAN).map((s) => (
            <Link
              key={s}
              href={tautan({ status: s })}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                status === s ? "bg-brand-600 text-white" : "border border-slate-200 text-slate-600"
              }`}
            >
              {LABEL_STATUS_LAPORAN[s]}
            </Link>
          ))}
        </div>

        {tahunTersedia.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tahun
            </span>
            <Link
              href={tautan({ tahun: undefined })}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                !tahun ? "bg-brand-600 text-white" : "border border-slate-200 text-slate-600"
              }`}
            >
              Semua
            </Link>
            {tahunTersedia.map((t) => (
              <Link
                key={t.tahun}
                href={tautan({ tahun: String(t.tahun) })}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  tahun === t.tahun
                    ? "bg-brand-600 text-white"
                    : "border border-slate-200 text-slate-600"
                }`}
              >
                {t.tahun}
              </Link>
            ))}
          </div>
        )}

        {!lingkup && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              RT
            </span>
            <Link
              href={tautan({ rt: undefined })}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                !sp.rt ? "bg-brand-600 text-white" : "border border-slate-200 text-slate-600"
              }`}
            >
              Semua
            </Link>
            {rtList.map((rt) => (
              <Link
                key={rt.id}
                href={tautan({ rt: String(rt.id) })}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  sp.rt === String(rt.id)
                    ? "bg-brand-600 text-white"
                    : "border border-slate-200 text-slate-600"
                }`}
              >
                RT {rt.nomor}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        {ringkas.length === 0 ? (
          <Kosong
            judul="Belum ada laporan"
            keterangan="Laporan kas yang dibuat bendahara akan muncul di sini."
            aksi={
              bolehBuat ? (
                <Link
                  href="/admin/keuangan/baru"
                  className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Buat laporan pertama
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto gulir-halus rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[54rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Periode</th>
                  <th className="px-5 py-3 font-semibold">RT</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Pemasukan</th>
                  <th className="px-5 py-3 text-right font-semibold">Pengeluaran</th>
                  <th className="px-5 py-3 text-right font-semibold">Saldo Akhir</th>
                  <th className="px-5 py-3 font-semibold">Diperbarui</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {ringkas.map((l) => (
                  <tr key={l.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      {periode(l.bulan, l.tahun)}
                    </td>
                    <td className="px-5 py-3 text-slate-600">RT {l.rt.nomor}</td>
                    <td className="px-5 py-3">
                      <LencanaStatus status={l.status} />
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-700">
                      {rupiah(l.hitung.pemasukan)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-700">
                      {rupiah(l.hitung.pengeluaran)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold text-slate-900">
                      {rupiah(l.hitung.saldoAkhir)}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {tanggalSingkat(l.updatedAt)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/keuangan/${l.id}`}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-50"
                      >
                        Buka
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
