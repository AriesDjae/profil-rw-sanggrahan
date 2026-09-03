import Link from "next/link";
import { redirect } from "next/navigation";

import KepalaHalaman from "@/components/admin/KepalaHalaman";
import Stepper from "@/components/keuangan/Stepper";
import Kosong from "@/components/ui/Kosong";
import { db } from "@/lib/db";
import { periode, rupiah, tanggalWaktu } from "@/lib/format";
import { hitungRingkasan } from "@/lib/keuangan";
import { PERAN, STATUS_LAPORAN } from "@/lib/konstanta";
import { wajibMasuk } from "@/lib/otorisasi";

import { setujuiRw, tolakRt, tolakRw, verifikasiRt } from "../keuangan/aksi";

export const dynamic = "force-dynamic";

export const metadata = { title: "Antrean Persetujuan" };

export default async function HalamanPersetujuan() {
  const pengguna = await wajibMasuk();

  const ketuaRt = pengguna.peran === PERAN.KETUA_RT;
  const ketuaRw = pengguna.peran === PERAN.KETUA_RW || pengguna.peran === PERAN.ADMIN;

  if (!ketuaRt && !ketuaRw) redirect("/admin?galat=akses");

  const antrean = await db.laporanKeuangan.findMany({
    where: ketuaRt
      ? { rtId: pengguna.rtId ?? -1, status: STATUS_LAPORAN.DIAJUKAN }
      : { status: STATUS_LAPORAN.DIVERIFIKASI_RT },
    include: {
      rt: true,
      dibuatOleh: { select: { nama: true } },
      verifikasiRtOleh: { select: { nama: true } },
      transaksi: { select: { jenis: true, jumlah: true } },
      _count: { select: { transaksi: true } },
    },
    orderBy: [{ diajukanAt: "asc" }],
  });

  const riwayatSaya = await db.riwayatPersetujuan.findMany({
    where: { olehId: pengguna.id, aksi: { in: ["VERIFIKASI_RT", "SETUJUI_RW", "TOLAK_RT", "TOLAK_RW"] } },
    include: { laporan: { include: { rt: true } } },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return (
    <>
      <KepalaHalaman
        judul="Antrean Persetujuan"
        keterangan={
          ketuaRt
            ? `Laporan kas ${pengguna.rt?.nama ?? "RT Anda"} yang diajukan bendahara dan menunggu verifikasi Anda.`
            : "Laporan kas yang telah diverifikasi Ketua RT dan menunggu persetujuan akhir Ketua RW sebelum tampil ke warga."
        }
      />

      {antrean.length === 0 ? (
        <Kosong
          judul="Tidak ada laporan yang menunggu"
          keterangan="Semua laporan pada tahap Anda sudah ditindaklanjuti. Laporan baru akan muncul di sini."
          aksi={
            <Link
              href="/admin/keuangan"
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700"
            >
              Lihat semua laporan
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {antrean.map((l) => {
            const r = hitungRingkasan(l.transaksi, l.saldoAwal);
            return (
              <article
                key={l.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="border-b border-slate-100 px-6 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {l.rt.nama} · {periode(l.bulan, l.tahun)}
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Disusun {l.dibuatOleh?.nama ?? "-"} · {l._count.transaksi} transaksi ·
                        diajukan {tanggalWaktu(l.diajukanAt)}
                        {l.verifikasiRtOleh
                          ? ` · diverifikasi ${l.verifikasiRtOleh.nama}`
                          : ""}
                      </p>
                    </div>
                    <Link
                      href={`/admin/keuangan/${l.id}`}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
                    >
                      Periksa rincian
                    </Link>
                  </div>

                  <div className="mt-5">
                    <Stepper status={l.status} />
                  </div>
                </div>

                <div className="grid gap-4 border-b border-slate-100 px-6 py-5 sm:grid-cols-4">
                  {[
                    { l: "Saldo awal", v: l.saldoAwal, c: "text-slate-900" },
                    { l: "Pemasukan", v: r.pemasukan, c: "text-seri-1" },
                    { l: "Pengeluaran", v: r.pengeluaran, c: "text-seri-2" },
                    { l: "Saldo akhir", v: r.saldoAkhir, c: "text-brand-800" },
                  ].map((s) => (
                    <div key={s.l}>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {s.l}
                      </p>
                      <p className={`mt-1 text-base font-bold tabular-nums ${s.c}`}>
                        {rupiah(s.v)}
                      </p>
                    </div>
                  ))}
                </div>

                {l.catatan && (
                  <p className="border-b border-slate-100 bg-slate-50 px-6 py-3 text-sm text-slate-600">
                    <span className="font-semibold text-slate-700">Catatan bendahara:</span>{" "}
                    {l.catatan}
                  </p>
                )}
                {ketuaRw && l.catatanRt && (
                  <p className="border-b border-slate-100 bg-sky-50 px-6 py-3 text-sm text-sky-900">
                    <span className="font-semibold">Catatan Ketua RT:</span> {l.catatanRt}
                  </p>
                )}

                <form
                  action={ketuaRt ? verifikasiRt : setujuiRw}
                  className="space-y-3 px-6 py-5"
                >
                  <input type="hidden" name="id" value={l.id} />
                  <label
                    htmlFor={`catatan-${l.id}`}
                    className="block text-sm font-medium text-slate-700"
                  >
                    Catatan pemeriksaan (opsional untuk menyetujui, wajib untuk mengembalikan)
                  </label>
                  <textarea
                    id={`catatan-${l.id}`}
                    name="catatan"
                    rows={2}
                    placeholder={
                      ketuaRt
                        ? "Contoh: Rincian sudah sesuai buku kas dan bukti setoran."
                        : "Contoh: Disetujui untuk dipublikasikan kepada warga."
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                  />
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
                    >
                      {ketuaRt ? "Verifikasi & teruskan ke RW" : "Setujui & terbitkan"}
                    </button>
                    <button
                      type="submit"
                      formAction={ketuaRt ? tolakRt : tolakRw}
                      className="rounded-xl border border-rose-300 px-5 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                    >
                      Kembalikan untuk revisi
                    </button>
                  </div>
                </form>
              </article>
            );
          })}
        </div>
      )}

      {riwayatSaya.length > 0 && (
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-900">Riwayat tindakan Anda</h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {riwayatSaya.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    r.aksi.startsWith("TOLAK")
                      ? "bg-rose-50 text-rose-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {r.aksi.startsWith("TOLAK") ? "Dikembalikan" : "Disetujui"}
                </span>
                <Link
                  href={`/admin/keuangan/${r.laporanId}`}
                  className="flex-1 text-sm font-medium text-slate-800 hover:text-brand-700"
                >
                  {r.laporan.rt.nama} · {periode(r.laporan.bulan, r.laporan.tahun)}
                </Link>
                <span className="text-xs text-slate-500">{tanggalWaktu(r.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
