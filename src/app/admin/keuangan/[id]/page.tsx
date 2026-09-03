import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import KepalaHalaman from "@/components/admin/KepalaHalaman";
import TombolHapus from "@/components/admin/TombolHapus";
import JejakPersetujuan from "@/components/keuangan/JejakPersetujuan";
import Stepper from "@/components/keuangan/Stepper";
import TabelTransaksi from "@/components/keuangan/TabelTransaksi";
import { LencanaStatus } from "@/components/ui/LencanaStatus";
import { db } from "@/lib/db";
import {
  periode,
  rupiah,
  tanggalSingkat,
  untukInputTanggal,
} from "@/lib/format";
import { hitungRingkasan, tahapBerikutnya } from "@/lib/keuangan";
import { JENIS_TRANSAKSI, PERAN, STATUS_LAPORAN } from "@/lib/konstanta";
import {
  bolehLihatLaporan,
  bolehSetujuiRw,
  bolehSuntingLaporan,
  bolehVerifikasiRt,
  wajibMasuk,
} from "@/lib/otorisasi";

import {
  ajukanLaporan,
  bukaKembali,
  hapusLaporan,
  hapusTransaksi,
  setujuiRw,
  tolakRt,
  tolakRw,
  verifikasiRt,
} from "../aksi";
import FormEditLaporan from "./FormEditLaporan";
import FormTransaksi from "./FormTransaksi";

export const dynamic = "force-dynamic";

export default async function DetailLaporanAdmin({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pesan?: string; galat?: string }>;
}) {
  const [pengguna, { id }, sp] = await Promise.all([
    wajibMasuk(),
    params,
    searchParams,
  ]);

  const laporanId = Number(id);
  if (!Number.isFinite(laporanId)) notFound();

  const laporan = await db.laporanKeuangan.findUnique({
    where: { id: laporanId },
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

  if (!laporan) notFound();
  if (!bolehLihatLaporan(pengguna, laporan.rtId)) redirect("/admin?galat=akses");

  const ringkasan = hitungRingkasan(laporan.transaksi, laporan.saldoAwal);
  const dapatDisunting =
    bolehSuntingLaporan(pengguna, laporan.rtId) &&
    (laporan.status === STATUS_LAPORAN.DRAFT ||
      laporan.status === STATUS_LAPORAN.DITOLAK);

  const giliranRt =
    laporan.status === STATUS_LAPORAN.DIAJUKAN &&
    bolehVerifikasiRt(pengguna, laporan.rtId);
  const giliranRw =
    laporan.status === STATUS_LAPORAN.DIVERIFIKASI_RT && bolehSetujuiRw(pengguna);
  const dapatDibukaKembali =
    laporan.status === STATUS_LAPORAN.DISETUJUI && bolehSetujuiRw(pengguna);

  const pemasukan = laporan.transaksi.filter(
    (t) => t.jenis === JENIS_TRANSAKSI.PEMASUKAN,
  );
  const pengeluaran = laporan.transaksi.filter(
    (t) => t.jenis === JENIS_TRANSAKSI.PENGELUARAN,
  );

  const tanggalAwalForm = untukInputTanggal(
    new Date(laporan.tahun, laporan.bulan - 1, Math.min(new Date().getDate(), 28)),
  );

  return (
    <>
      <KepalaHalaman
        judul={`${laporan.rt.nama} · ${periode(laporan.bulan, laporan.tahun)}`}
        keterangan={tahapBerikutnya(laporan.status as never)}
        kembali={{ href: "/admin/keuangan", label: "Kembali ke daftar laporan" }}
        aksi={
          laporan.status === STATUS_LAPORAN.DISETUJUI ? (
            <Link
              href={`/keuangan/${laporan.id}`}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Lihat tampilan warga
            </Link>
          ) : undefined
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

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <LencanaStatus status={laporan.status} />
          <p className="text-xs text-slate-500">
            Disusun {laporan.dibuatOleh?.nama ?? "-"} · diperbarui{" "}
            {tanggalSingkat(laporan.updatedAt)}
          </p>
        </div>
        <Stepper status={laporan.status} />
      </div>

      {laporan.status === STATUS_LAPORAN.DITOLAK && (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5">
          <h2 className="text-sm font-bold text-rose-900">Laporan dikembalikan untuk revisi</h2>
          <p className="mt-2 text-sm leading-relaxed text-rose-800">
            {laporan.catatanRw || laporan.catatanRt || "Tidak ada catatan."}
          </p>
          <p className="mt-2 text-xs text-rose-700">
            Perbaiki rincian yang dimaksud, lalu ajukan kembali laporan ini.
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          { label: "Saldo Awal", nilai: laporan.saldoAwal, warna: "text-slate-900" },
          { label: "Pemasukan", nilai: ringkasan.pemasukan, warna: "text-seri-1" },
          { label: "Pengeluaran", nilai: ringkasan.pengeluaran, warna: "text-seri-2" },
          { label: "Saldo Akhir", nilai: ringkasan.saldoAkhir, warna: "text-brand-800" },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl border p-5 ${
              s.label === "Saldo Akhir"
                ? "border-brand-100 bg-brand-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {s.label}
            </p>
            <p className={`mt-2 text-xl font-bold tabular-nums ${s.warna}`}>
              {rupiah(s.nilai)}
            </p>
          </div>
        ))}
      </div>

      {/* Panel tindakan sesuai peran */}
      {(giliranRt || giliranRw || dapatDibukaKembali) && (
        <section className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-6">
          <h2 className="text-sm font-bold text-brand-900">
            {giliranRt
              ? "Verifikasi Ketua RT"
              : giliranRw
                ? "Persetujuan Ketua RW"
                : "Tindakan Ketua RW"}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-brand-800/80">
            {giliranRt
              ? "Cocokkan rincian transaksi dengan buku kas dan bukti setoran. Bila sudah sesuai, teruskan ke Ketua RW."
              : giliranRw
                ? "Laporan sudah diverifikasi Ketua RT. Persetujuan Anda akan menerbitkannya di halaman keuangan publik."
                : "Laporan sudah terbit untuk warga. Membuka kembali akan menariknya dari halaman publik dan mengembalikannya ke bendahara."}
          </p>

          <form
            action={giliranRt ? verifikasiRt : giliranRw ? setujuiRw : bukaKembali}
            className="mt-5 space-y-3"
          >
            <input type="hidden" name="id" value={laporan.id} />
            <label htmlFor="catatan" className="block text-sm font-medium text-brand-900">
              Catatan {dapatDibukaKembali ? "(wajib)" : "(opsional)"}
            </label>
            <textarea
              id="catatan"
              name="catatan"
              rows={3}
              required={dapatDibukaKembali}
              placeholder={
                giliranRt
                  ? "Contoh: Rincian sudah sesuai buku kas dan bukti setoran."
                  : giliranRw
                    ? "Contoh: Disetujui untuk dipublikasikan kepada warga."
                    : "Alasan laporan dibuka kembali."
              }
              className="w-full rounded-xl border border-brand-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                {giliranRt
                  ? "Verifikasi & teruskan ke RW"
                  : giliranRw
                    ? "Setujui & terbitkan"
                    : "Buka kembali laporan"}
              </button>

              {(giliranRt || giliranRw) && (
                <button
                  type="submit"
                  formAction={giliranRt ? tolakRt : tolakRw}
                  className="rounded-xl border border-rose-300 bg-white px-5 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                >
                  Kembalikan untuk revisi
                </button>
              )}
            </div>
            {(giliranRt || giliranRw) && (
              <p className="text-xs text-brand-700/80">
                Pengembalian wajib disertai catatan agar bendahara mengetahui bagian yang
                perlu diperbaiki.
              </p>
            )}
          </form>
        </section>
      )}

      {dapatDisunting && (
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-bold text-slate-900">Tambah transaksi</h2>
            <FormTransaksi laporanId={laporan.id} tanggalAwal={tanggalAwalForm} />
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-sm font-bold text-slate-900">Data laporan</h2>
              <FormEditLaporan
                id={laporan.id}
                saldoAwal={laporan.saldoAwal}
                catatan={laporan.catatan}
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-sm font-bold text-slate-900">Ajukan ke Ketua RT</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                Setelah diajukan, laporan terkunci dan tidak dapat diubah sampai Ketua RT
                memverifikasi atau mengembalikannya.
              </p>
              <form action={ajukanLaporan} className="mt-4">
                <input type="hidden" name="id" value={laporan.id} />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Ajukan laporan
                </button>
              </form>

              <form action={hapusLaporan} className="mt-3">
                <input type="hidden" name="id" value={laporan.id} />
                <TombolHapus
                  label="Hapus laporan ini"
                  pesan="Hapus laporan beserta seluruh transaksinya? Tindakan ini tidak dapat dibatalkan."
                />
              </form>
            </div>
          </div>
        </section>
      )}

      <div className="mt-6 space-y-6">
        <TabelTransaksi
          judul="Pemasukan"
          data={pemasukan}
          warna="text-seri-1"
          tampilkanJumlahBaris
          aksiHapus={dapatDisunting ? hapusTransaksi : null}
        />
        <TabelTransaksi
          judul="Pengeluaran"
          data={pengeluaran}
          warna="text-seri-2"
          tampilkanJumlahBaris
          aksiHapus={dapatDisunting ? hapusTransaksi : null}
        />
      </div>

      {laporan.catatan && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Catatan bendahara
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{laporan.catatan}</p>
        </div>
      )}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-5 text-sm font-bold uppercase tracking-wide text-slate-500">
          Jejak persetujuan
        </h2>
        <JejakPersetujuan jejak={laporan.riwayat} />
      </section>

      {pengguna.peran === PERAN.SEKRETARIS && (
        <p className="mt-6 text-xs text-slate-500">
          Anda masuk sebagai sekretaris: laporan dapat dilihat namun persetujuan hanya dapat
          diberikan Ketua RT dan Ketua RW.
        </p>
      )}
    </>
  );
}
