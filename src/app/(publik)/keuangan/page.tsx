import type { Metadata } from "next";
import Link from "next/link";

import BatangGanda from "@/components/grafik/BatangGanda";
import BatangHorizontal from "@/components/grafik/BatangHorizontal";
import JudulBagian from "@/components/ui/JudulBagian";
import Kosong from "@/components/ui/Kosong";
import { db } from "@/lib/db";
import { periode, rupiah, tanggalSingkat } from "@/lib/format";
import { NAMA_BULAN, STATUS_LAPORAN } from "@/lib/konstanta";
import { daftarRt, laporanPublik, ringkasLaporan } from "@/lib/kueri";

export const metadata: Metadata = {
  title: "Laporan Keuangan",
  description:
    "Laporan kas RT di lingkungan RW 05 Sanggrahan yang telah diverifikasi Ketua RT dan disetujui Ketua RW.",
};

export const dynamic = "force-dynamic";

export default async function HalamanKeuangan({
  searchParams,
}: {
  searchParams: Promise<{ rt?: string; tahun?: string }>;
}) {
  const sp = await searchParams;
  const rtId = sp.rt ? Number(sp.rt) : undefined;
  const tahunSekarang = new Date().getFullYear();

  const [rtList, tahunTersedia] = await Promise.all([
    daftarRt(),
    db.laporanKeuangan.findMany({
      where: { status: STATUS_LAPORAN.DISETUJUI },
      distinct: ["tahun"],
      select: { tahun: true },
      orderBy: { tahun: "desc" },
    }),
  ]);

  const daftarTahun = tahunTersedia.map((t) => t.tahun);
  const tahun = sp.tahun
    ? Number(sp.tahun)
    : (daftarTahun[0] ?? tahunSekarang);

  const laporan = await laporanPublik({ rtId, tahun });
  const ringkas = ringkasLaporan(laporan);

  const totalPemasukan = ringkas.reduce((a, r) => a + r.pemasukan, 0);
  const totalPengeluaran = ringkas.reduce((a, r) => a + r.pengeluaran, 0);

  // Saldo terakhir tiap RT (laporan terurut terbaru dulu)
  const saldoPerRt = new Map<string, number>();
  for (const r of ringkas) {
    const kunci = `RT ${r.rt.nomor}`;
    if (!saldoPerRt.has(kunci)) saldoPerRt.set(kunci, r.saldoAkhir);
  }
  const totalSaldo = [...saldoPerRt.values()].reduce((a, b) => a + b, 0);

  const perBulan = new Map<number, { pemasukan: number; pengeluaran: number }>();
  for (const r of ringkas) {
    const s = perBulan.get(r.bulan) ?? { pemasukan: 0, pengeluaran: 0 };
    s.pemasukan += r.pemasukan;
    s.pengeluaran += r.pengeluaran;
    perBulan.set(r.bulan, s);
  }
  const dataBulan = [...perBulan.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bulan, n]) => ({
      label: NAMA_BULAN[bulan - 1].slice(0, 3),
      seri1: n.pemasukan,
      seri2: n.pengeluaran,
    }));

  const rtTerpilih = rtList.find((r) => r.id === rtId);

  const tautan = (opsi: { rt?: number | null; tahun?: number }) => {
    const q = new URLSearchParams();
    const rtBaru = opsi.rt === undefined ? rtId : opsi.rt;
    const tahunBaru = opsi.tahun ?? tahun;
    if (rtBaru) q.set("rt", String(rtBaru));
    q.set("tahun", String(tahunBaru));
    return `/keuangan?${q.toString()}`;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <JudulBagian
        kicker="Transparansi Keuangan"
        judul="Laporan Kas RT"
        tingkat="h1"
        keterangan="Halaman ini hanya menampilkan laporan yang telah melewati verifikasi Ketua RT dan persetujuan Ketua RW. Laporan yang masih berstatus draf, diajukan, atau ditolak tidak ditampilkan kepada publik."
      />

      {/* Alur persetujuan */}
      <div className="mb-8 rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
        <h2 className="text-sm font-bold text-brand-900">Bagaimana laporan ini disahkan?</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            {
              n: 1,
              judul: "Disusun Bendahara RT",
              isi: "Bendahara mencatat seluruh pemasukan dan pengeluaran kas beserta buktinya.",
            },
            {
              n: 2,
              judul: "Diverifikasi Ketua RT",
              isi: "Ketua RT mencocokkan rincian dengan buku kas, lalu menyetujui atau mengembalikan untuk revisi.",
            },
            {
              n: 3,
              judul: "Disetujui Ketua RW",
              isi: "Persetujuan akhir Ketua RW membuat laporan otomatis terbit di halaman ini.",
            },
          ].map((l) => (
            <li key={l.n} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">
                {l.n}
              </span>
              <div>
                <p className="text-sm font-semibold text-brand-900">{l.judul}</p>
                <p className="mt-1 text-xs leading-relaxed text-brand-800/80">{l.isi}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Penyaring */}
      <div className="mb-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tahun anggaran
          </p>
          <div className="flex flex-wrap gap-2">
            {(daftarTahun.length ? daftarTahun : [tahunSekarang]).map((t) => (
              <Link
                key={t}
                href={tautan({ tahun: t })}
                className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                  t === tahun
                    ? "bg-brand-600 text-white"
                    : "border border-slate-200 text-slate-600 hover:border-brand-300"
                }`}
              >
                {t}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Rukun Tetangga
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={tautan({ rt: null })}
              className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                !rtId
                  ? "bg-brand-600 text-white"
                  : "border border-slate-200 text-slate-600 hover:border-brand-300"
              }`}
            >
              Semua RT
            </Link>
            {rtList.map((rt) => (
              <Link
                key={rt.id}
                href={tautan({ rt: rt.id })}
                className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                  rtId === rt.id
                    ? "bg-brand-600 text-white"
                    : "border border-slate-200 text-slate-600 hover:border-brand-300"
                }`}
              >
                RT {rt.nomor}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {ringkas.length === 0 ? (
        <Kosong
          judul="Belum ada laporan yang disetujui"
          keterangan={`Belum ada laporan kas ${rtTerpilih ? rtTerpilih.nama : "RT"} tahun ${tahun} yang selesai melewati persetujuan Ketua RT dan Ketua RW.`}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Pemasukan {tahun}
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-seri-1">
                {rupiah(totalPemasukan)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {ringkas.length} laporan {rtTerpilih ? rtTerpilih.nama : "seluruh RT"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Pengeluaran {tahun}
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-seri-2">
                {rupiah(totalPengeluaran)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {totalPemasukan > 0
                  ? `${((totalPengeluaran / totalPemasukan) * 100).toFixed(0)}% dari pemasukan`
                  : "-"}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                Saldo Kas Terakhir
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-brand-800">
                {rupiah(totalSaldo)}
              </p>
              <p className="mt-1 text-xs text-brand-700/80">
                Posisi laporan terakhir yang disetujui
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {dataBulan.length > 0 && (
              <BatangGanda
                data={dataBulan}
                judul={`Arus Kas per Bulan (${tahun})`}
                keterangan={
                  rtTerpilih
                    ? `Khusus ${rtTerpilih.nama}.`
                    : "Gabungan seluruh RT di RW 05."
                }
              />
            )}
            {!rtId && saldoPerRt.size > 0 && (
              <BatangHorizontal
                judul="Saldo Kas Terakhir per RT"
                keterangan="Diambil dari laporan terakhir yang disetujui pada tahun berjalan."
                format="rupiah"
                data={[...saldoPerRt.entries()].map(([label, nilai]) => ({ label, nilai }))}
              />
            )}
          </div>

          <section className="mt-10">
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              Daftar Laporan Disetujui ({ringkas.length})
            </h2>
            <div className="overflow-x-auto gulir-halus rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[52rem] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Periode</th>
                    <th className="px-4 py-3 font-semibold">RT</th>
                    <th className="px-4 py-3 text-right font-semibold">Saldo Awal</th>
                    <th className="px-4 py-3 text-right font-semibold">Pemasukan</th>
                    <th className="px-4 py-3 text-right font-semibold">Pengeluaran</th>
                    <th className="px-4 py-3 text-right font-semibold">Saldo Akhir</th>
                    <th className="px-4 py-3 font-semibold">Disetujui</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {ringkas.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {periode(r.bulan, r.tahun)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">RT {r.rt.nomor}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                        {rupiah(r.saldoAwal)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-seri-1">
                        {rupiah(r.pemasukan)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-seri-2">
                        {rupiah(r.pengeluaran)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">
                        {rupiah(r.saldoAkhir)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {r.persetujuanRwAt ? tanggalSingkat(r.persetujuanRwAt) : "-"}
                        <br />
                        <span className="text-slate-400">{r.disetujuiOleh ?? "-"}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/keuangan/${r.id}`}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:border-brand-300 hover:bg-brand-50"
                        >
                          Rincian
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
