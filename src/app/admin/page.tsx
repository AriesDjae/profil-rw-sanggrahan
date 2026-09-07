import Link from "next/link";

import KepalaHalaman from "@/components/admin/KepalaHalaman";
import { LencanaStatus } from "@/components/ui/LencanaStatus";
import KartuStatistik from "@/components/ui/KartuStatistik";
import { db } from "@/lib/db";
import { angka, periode, rupiah, tanggalSingkat } from "@/lib/format";
import { hitungRingkasan } from "@/lib/keuangan";
import { LABEL_PERAN, PERAN, STATUS_KONTEN, STATUS_LAPORAN } from "@/lib/konstanta";
import {
  lingkupRw,
  saringRw,
  saringRwLewatRt,
  wajibMasuk,
} from "@/lib/otorisasi";

export const dynamic = "force-dynamic";

export default async function Dasbor({
  searchParams,
}: {
  searchParams: Promise<{ galat?: string }>;
}) {
  const [pengguna, sp] = await Promise.all([wajibMasuk(), searchParams]);
  const rwId = lingkupRw(pengguna);

  // Semua angka di dasbor dibatasi lingkup penggunanya. Ketua RW 02 yang
  // membuka dasbor harus melihat RW 02, bukan jumlah se-kampung yang tidak
  // dapat ia tindaklanjuti.
  const saringKonten = saringRw(pengguna);
  const saringKas = saringRwLewatRt(pengguna);

  const awalHariIni = new Date();
  awalHariIni.setHours(0, 0, 0, 0);

  const [
    jumlahBerita,
    jumlahKegiatan,
    jumlahWarga,
    perluTindakan,
    laporanTerbaru,
    kegiatanDekat,
  ] = await Promise.all([
    db.berita.count({ where: { ...saringKonten, status: STATUS_KONTEN.TERBIT } }),
    db.kegiatan.count({
      where: { ...saringKonten, status: STATUS_KONTEN.TERBIT, mulai: { gte: awalHariIni } },
    }),
    db.warga.count({ where: saringKas }),
    db.laporanKeuangan.findMany({
      where: {
        ...saringKas,
        status:
          pengguna.peran === PERAN.KETUA_RT
            ? STATUS_LAPORAN.DIAJUKAN
            : pengguna.peran === PERAN.KETUA_RW || pengguna.peran === PERAN.ADMIN
              ? STATUS_LAPORAN.DIVERIFIKASI_RT
              : { in: [STATUS_LAPORAN.DRAFT, STATUS_LAPORAN.DITOLAK] },
      },
      include: { rt: true, transaksi: { select: { jenis: true, jumlah: true } } },
      orderBy: [{ tahun: "desc" }, { bulan: "desc" }],
      take: 6,
    }),
    db.laporanKeuangan.findMany({
      where: saringKas,
      include: { rt: true, transaksi: { select: { jenis: true, jumlah: true } } },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    db.kegiatan.findMany({
      where: { ...saringKonten, status: STATUS_KONTEN.TERBIT, mulai: { gte: awalHariIni } },
      orderBy: { mulai: "asc" },
      take: 4,
    }),
  ]);

  const judulTindakan =
    pengguna.peran === PERAN.KETUA_RT
      ? "Menunggu verifikasi Anda"
      : pengguna.peran === PERAN.KETUA_RW
        ? `Menunggu persetujuan Anda di ${pengguna.rw?.nama ?? "RW Anda"}`
        : pengguna.peran === PERAN.ADMIN
          ? "Menunggu persetujuan Ketua RW (ketiga RW)"
          : "Laporan yang perlu Anda kerjakan";

  const bolehKonten = ([PERAN.ADMIN, PERAN.SEKRETARIS, PERAN.KETUA_RW] as string[]).includes(
    pengguna.peran,
  );
  const bolehKas =
    pengguna.peran === PERAN.BENDAHARA_RT || pengguna.peran === PERAN.ADMIN;

  const pintasan = [
    ...(bolehKas ? [{ href: "/admin/keuangan/baru", label: "Buat laporan kas baru" }] : []),
    ...(bolehKonten
      ? [
          { href: "/admin/berita/baru", label: "Tulis berita" },
          { href: "/admin/kegiatan/baru", label: "Jadwalkan kegiatan" },
          { href: "/admin/pengumuman", label: "Pasang pengumuman" },
        ]
      : []),
    { href: "/admin/keuangan", label: "Lihat semua laporan kas" },
  ];

  return (
    <>
      <KepalaHalaman
        judul="Dasbor"
        keterangan={`Ringkasan aktivitas ${
          pengguna.rt
            ? `${pengguna.rt.nama} (${pengguna.rw?.nama ?? "-"})`
            : rwId === null
              ? "seluruh Kampung Sanggrahan"
              : (pengguna.rw?.nama ?? "RW Anda")
        } untuk peran ${LABEL_PERAN[pengguna.peran] ?? pengguna.peran}.`}
      />

      {sp.galat === "akses" && (
        <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Anda tidak memiliki akses ke halaman tersebut. Hubungi administrator bila
          seharusnya memiliki akses.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KartuStatistik
          label={pengguna.peran === PERAN.KETUA_RT ? "Perlu diverifikasi" : "Perlu ditindak"}
          nilai={angka(perluTindakan.length)}
          keterangan="Laporan kas menunggu tindakan"
          nada={perluTindakan.length > 0 ? "peringatan" : "netral"}
        />
        <KartuStatistik
          label="Warga terdata"
          nilai={angka(jumlahWarga)}
          keterangan={
            pengguna.rt
              ? pengguna.rt.nama
              : rwId === null
                ? "Ketiga RW"
                : (pengguna.rw?.nama ?? "RW Anda")
          }
        />
        <KartuStatistik label="Berita terbit" nilai={angka(jumlahBerita)} />
        <KartuStatistik
          label="Agenda mendatang"
          nilai={angka(jumlahKegiatan)}
          keterangan="Kegiatan terjadwal"
        />
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-900">{judulTindakan}</h2>
            <Link
              href="/admin/keuangan"
              className="text-xs font-semibold text-brand-700 hover:text-brand-800"
            >
              Semua laporan
            </Link>
          </div>

          {perluTindakan.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500">
              Tidak ada laporan yang menunggu tindakan Anda saat ini.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {perluTindakan.map((l) => {
                const r = hitungRingkasan(l.transaksi, l.saldoAwal);
                return (
                  <li key={l.id}>
                    <Link
                      href={`/admin/keuangan/${l.id}`}
                      className="flex flex-wrap items-center gap-3 px-5 py-4 transition hover:bg-slate-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {l.rt.nama} · {periode(l.bulan, l.tahun)}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Saldo akhir {rupiah(r.saldoAkhir)} · diperbarui{" "}
                          {tanggalSingkat(l.updatedAt)}
                        </p>
                      </div>
                      <LencanaStatus status={l.status} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-bold text-slate-900">Pintasan</h2>
            <div className="grid gap-2">
              {pintasan.map((p) => (
                <Link
                  key={p.href + p.label}
                  href={p.href}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-brand-300 hover:bg-brand-50"
                >
                  <span aria-hidden className="text-brand-600">→</span>
                  {p.label}
                </Link>
              ))}
            </div>
          </div>

          {kegiatanDekat.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-bold text-slate-900">Agenda terdekat</h2>
              <ul className="space-y-3">
                {kegiatanDekat.map((k) => (
                  <li key={k.id} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-hidden />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{k.judul}</p>
                      <p className="text-xs text-slate-500">
                        {tanggalSingkat(k.mulai)} · {k.lokasi}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">Aktivitas laporan terbaru</h2>
        </div>
        {laporanTerbaru.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500">Belum ada laporan kas.</p>
        ) : (
          <div className="overflow-x-auto gulir-halus">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Laporan</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Saldo Akhir</th>
                  <th className="px-5 py-3 font-semibold">Diperbarui</th>
                </tr>
              </thead>
              <tbody>
                {laporanTerbaru.map((l) => {
                  const r = hitungRingkasan(l.transaksi, l.saldoAwal);
                  return (
                    <tr key={l.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/keuangan/${l.id}`}
                          className="font-medium text-slate-900 hover:text-brand-700"
                        >
                          {l.rt.nama} · {periode(l.bulan, l.tahun)}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <LencanaStatus status={l.status} />
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-700">
                        {rupiah(r.saldoAkhir)}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {tanggalSingkat(l.updatedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
