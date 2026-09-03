import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import JejakPersetujuan from "@/components/keuangan/JejakPersetujuan";
import Stepper from "@/components/keuangan/Stepper";
import TabelTransaksi from "@/components/keuangan/TabelTransaksi";
import TombolCetak from "@/components/ui/TombolCetak";
import BatangHorizontal from "@/components/grafik/BatangHorizontal";
import { db } from "@/lib/db";
import { periode, rupiah, tanggalWaktu } from "@/lib/format";
import { JENIS_TRANSAKSI, STATUS_LAPORAN } from "@/lib/konstanta";
import { hitungRingkasan } from "@/lib/keuangan";

export const dynamic = "force-dynamic";

async function ambilLaporan(id: number) {
  if (!Number.isFinite(id)) return null;
  return db.laporanKeuangan.findFirst({
    where: { id, status: STATUS_LAPORAN.DISETUJUI },
    include: {
      rt: true,
      dibuatOleh: { select: { nama: true, jabatan: true } },
      verifikasiRtOleh: { select: { nama: true, jabatan: true } },
      persetujuanRwOleh: { select: { nama: true, jabatan: true } },
      transaksi: { orderBy: { tanggal: "asc" } },
      riwayat: {
        orderBy: { createdAt: "asc" },
        include: { oleh: { select: { nama: true, jabatan: true } } },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const laporan = await ambilLaporan(Number(id));
  if (!laporan) return { title: "Laporan tidak ditemukan" };
  return { title: laporan.judul };
}

export default async function DetailLaporan({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const laporan = await ambilLaporan(Number(id));
  if (!laporan) notFound();

  const ringkasan = hitungRingkasan(laporan.transaksi, laporan.saldoAwal);
  const pemasukan = laporan.transaksi.filter((t) => t.jenis === JENIS_TRANSAKSI.PEMASUKAN);
  const pengeluaran = laporan.transaksi.filter(
    (t) => t.jenis === JENIS_TRANSAKSI.PENGELUARAN,
  );

  const perKategoriKeluar = new Map<string, number>();
  for (const t of pengeluaran) {
    perKategoriKeluar.set(t.kategori, (perKategoriKeluar.get(t.kategori) ?? 0) + t.jumlah);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500 tanpa-cetak" aria-label="Remah roti">
        <Link href="/" className="hover:text-brand-700">
          Beranda
        </Link>
        <span aria-hidden>/</span>
        <Link href="/keuangan" className="hover:text-brand-700">
          Keuangan
        </Link>
        <span aria-hidden>/</span>
        <span className="truncate text-slate-700">{periode(laporan.bulan, laporan.tahun)}</span>
      </nav>

      <header className="rounded-3xl border border-garis bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12.5l5.5 5.5L20 7" />
              </svg>
              Disetujui &amp; Terbit
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {laporan.judul}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Periode {periode(laporan.bulan, laporan.tahun)} · {laporan.rt.nama}
              {laporan.rt.wilayah ? ` · ${laporan.rt.wilayah}` : ""}
            </p>
          </div>
          <TombolCetak />
        </div>

        <div className="mt-7 border-t border-garis pt-6">
          <Stepper status={laporan.status} />
        </div>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          { label: "Saldo Awal", nilai: laporan.saldoAwal, warna: "text-slate-900" },
          { label: "Pemasukan", nilai: ringkasan.pemasukan, warna: "text-seri-1" },
          { label: "Pengeluaran", nilai: ringkasan.pengeluaran, warna: "text-seri-2" },
          { label: "Saldo Akhir", nilai: ringkasan.saldoAkhir, warna: "text-brand-800" },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl border p-5 shadow-sm ${
              s.label === "Saldo Akhir"
                ? "border-brand-100 bg-brand-50"
                : "border-garis bg-white"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {s.label}
            </p>
            <p className={`mt-2 text-xl font-bold tabular-nums ${s.warna}`}>{rupiah(s.nilai)}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-6">
        <TabelTransaksi judul="Pemasukan" data={pemasukan} warna="text-seri-1" />
        <TabelTransaksi judul="Pengeluaran" data={pengeluaran} warna="text-seri-2" />
      </div>

      {perKategoriKeluar.size > 1 && (
        <div className="mt-6">
          <BatangHorizontal
            judul="Rincian Pengeluaran per Kategori"
            keterangan={`Total ${rupiah(ringkasan.pengeluaran)} pada periode ${periode(laporan.bulan, laporan.tahun)}.`}
            format="rupiah"
            data={[...perKategoriKeluar.entries()].map(([label, nilai]) => ({ label, nilai }))}
          />
        </div>
      )}

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-garis bg-white p-6">
          <h2 className="mb-5 text-sm font-bold uppercase tracking-wide text-slate-500">
            Jejak Persetujuan
          </h2>
          <JejakPersetujuan jejak={laporan.riwayat} />
        </div>

        <div className="rounded-2xl border border-garis bg-white p-6">
          <h2 className="mb-5 text-sm font-bold uppercase tracking-wide text-slate-500">
            Pengesahan
          </h2>
          <dl className="space-y-5 text-sm">
            <div>
              <dt className="text-xs font-medium text-slate-500">Disusun oleh</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">
                {laporan.dibuatOleh?.nama ?? "-"}
              </dd>
              <dd className="text-xs text-slate-500">
                {laporan.dibuatOleh?.jabatan ?? "Bendahara RT"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Diverifikasi oleh</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">
                {laporan.verifikasiRtOleh?.nama ?? "-"}
              </dd>
              <dd className="text-xs text-slate-500">
                {laporan.verifikasiRtOleh?.jabatan ?? "Ketua RT"} ·{" "}
                {tanggalWaktu(laporan.verifikasiRtAt)}
              </dd>
              {laporan.catatanRt && (
                <dd className="mt-2 rounded-lg bg-kertas px-3 py-2 text-xs text-slate-600">
                  “{laporan.catatanRt}”
                </dd>
              )}
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Disetujui oleh</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">
                {laporan.persetujuanRwOleh?.nama ?? "-"}
              </dd>
              <dd className="text-xs text-slate-500">
                {laporan.persetujuanRwOleh?.jabatan ?? "Ketua RW"} ·{" "}
                {tanggalWaktu(laporan.persetujuanRwAt)}
              </dd>
              {laporan.catatanRw && (
                <dd className="mt-2 rounded-lg bg-kertas px-3 py-2 text-xs text-slate-600">
                  “{laporan.catatanRw}”
                </dd>
              )}
            </div>
          </dl>
        </div>
      </section>

      <p className="mt-8 text-xs leading-relaxed text-slate-500">
        Bila terdapat perbedaan angka dengan catatan warga, silakan sampaikan kepada Ketua RT
        atau sekretariat RW untuk ditelusuri bersama. Seluruh perubahan pada laporan yang
        sudah disetujui akan tercatat pada jejak persetujuan di atas.
      </p>
    </div>
  );
}
