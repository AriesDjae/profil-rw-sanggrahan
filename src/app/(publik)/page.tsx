import Link from "next/link";

import BatangGanda from "@/components/grafik/BatangGanda";
import KartuBerita from "@/components/publik/KartuBerita";
import KartuKegiatan from "@/components/publik/KartuKegiatan";
import JudulBagian from "@/components/ui/JudulBagian";
import Kosong from "@/components/ui/Kosong";
import { db } from "@/lib/db";
import { angka, rupiah, tanggal } from "@/lib/format";
import { NAMA_BULAN } from "@/lib/konstanta";
import {
  beritaTerbit,
  daftarRt,
  kegiatanMendatang,
  pengumumanAktif,
  rekapKeuanganTahun,
  statistikWarga,
} from "@/lib/kueri";
import { ambilPengaturan } from "@/lib/pengaturan";

export const dynamic = "force-dynamic";

export default async function Beranda() {
  const tahunIni = new Date().getFullYear();

  const [pengaturan, berita, kegiatan, pengumuman, statistik, keuangan, rtList, foto] =
    await Promise.all([
      ambilPengaturan(),
      beritaTerbit(4),
      kegiatanMendatang(4),
      pengumumanAktif(3),
      statistikWarga(),
      rekapKeuanganTahun(tahunIni),
      daftarRt(),
      db.foto.findMany({
        take: 8,
        orderBy: { id: "desc" },
        include: { album: { select: { slug: true, nama: true } } },
      }),
    ]);

  const [utama, ...lainnya] = berita;

  const dataGrafik = keuangan.perBulan.map(([bulan, nilai]) => ({
    label: NAMA_BULAN[bulan - 1].slice(0, 3),
    seri1: nilai.pemasukan,
    seri2: nilai.pengeluaran,
  }));

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden motif-hero text-white">
        <div className="absolute inset-0 motif-batik" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-aksen-400" aria-hidden />
              Portal Resmi Warga
            </span>
            <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {pengaturan.namaRw}
            </h1>
            <p className="mt-3 text-lg font-medium text-brand-100">{pengaturan.tagline}</p>
            <p className="mt-5 max-w-xl leading-relaxed text-brand-100/90">
              {pengaturan.deskripsi ||
                "Pusat informasi warga: berita lingkungan, agenda kegiatan, data kependudukan, dan laporan keuangan kas RT."}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/keuangan"
                className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-800 shadow-sm transition hover:bg-brand-50"
              >
                Lihat Laporan Keuangan
              </Link>
              <Link
                href="/kegiatan"
                className="rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Agenda Kegiatan
              </Link>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:gap-4">
            {[
              { label: "Kepala Keluarga", nilai: angka(statistik.totalKk) },
              { label: "Jiwa Terdata", nilai: angka(statistik.totalJiwa) },
              { label: "Rukun Tetangga", nilai: angka(rtList.length) },
              {
                label: `Laporan Kas Terbit ${tahunIni}`,
                nilai: angka(keuangan.jumlahLaporan),
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur"
              >
                <dd className="text-3xl font-bold tabular-nums">{s.nilai}</dd>
                <dt className="mt-1 text-xs font-medium text-brand-100">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Pengumuman */}
      {pengumuman.length > 0 && (
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <p className="flex shrink-0 items-center gap-2 text-sm font-bold text-brand-800">
                <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 11v2a1 1 0 001 1h2l4 4V6L6 10H4a1 1 0 00-1 1z" />
                  <path d="M16 9a4 4 0 010 6" />
                </svg>
                Pengumuman
              </p>
              <ul className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pengumuman.map((p) => (
                  <li
                    key={p.id}
                    className={`rounded-xl border px-4 py-3 ${
                      p.penting
                        ? "border-aksen-200 bg-aksen-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">{p.judul}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">
                      {p.isi}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Berita */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <JudulBagian
          kicker="Kabar Warga"
          judul="Berita Terbaru dari Lingkungan Kita"
          keterangan="Informasi kegiatan, pembangunan, dan pengumuman resmi dari pengurus RW."
          tautan="/berita"
        />

        {berita.length === 0 ? (
          <Kosong judul="Belum ada berita" keterangan="Berita akan tampil di sini setelah dipublikasikan pengurus." />
        ) : (
          <div className="grid gap-6">
            {utama && <KartuBerita berita={utama} utama />}
            {lainnya.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {lainnya.map((b) => (
                  <KartuBerita key={b.slug} berita={b} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Kegiatan */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <JudulBagian
            kicker="Agenda"
            judul="Kegiatan yang Akan Berlangsung"
            keterangan="Catat tanggalnya dan ikut ambil bagian dalam kegiatan warga."
            tautan="/kegiatan"
          />
          {kegiatan.length === 0 ? (
            <Kosong judul="Belum ada agenda terjadwal" keterangan="Agenda kegiatan mendatang akan tampil di sini." />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {kegiatan.map((k) => (
                <KartuKegiatan key={k.slug} kegiatan={k} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Transparansi keuangan */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <JudulBagian
          kicker="Transparansi"
          judul={`Keuangan Kas RT Tahun ${tahunIni}`}
          keterangan="Angka di bawah hanya menghitung laporan yang telah diverifikasi Ketua RT dan disetujui Ketua RW."
          tautan="/keuangan"
          labelTautan="Rincian laporan"
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total Pemasukan
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-seri-1">
              {rupiah(keuangan.totalPemasukan)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total Pengeluaran
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-seri-2">
              {rupiah(keuangan.totalPengeluaran)}
            </p>
          </div>
          <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              Saldo Kas Terakhir
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-brand-800">
              {rupiah(keuangan.totalSaldo)}
            </p>
            <p className="mt-1 text-xs text-brand-700/80">Gabungan seluruh RT</p>
          </div>
        </div>

        {dataGrafik.length > 0 && (
          <div className="mt-6">
            <BatangGanda
              data={dataGrafik}
              judul={`Arus Kas Bulanan Seluruh RT (${tahunIni})`}
              keterangan="Nilai gabungan dari laporan kas yang telah disetujui berjenjang."
            />
          </div>
        )}
      </section>

      {/* Data warga */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <JudulBagian
            kicker="Kependudukan"
            judul="Data Warga Secara Ringkas"
            keterangan="Data agregat, tidak menampilkan identitas pribadi warga."
            tautan="/data-warga"
            labelTautan="Statistik lengkap"
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Jiwa", nilai: angka(statistik.totalJiwa) },
              { label: "Kepala Keluarga", nilai: angka(statistik.totalKk) },
              { label: "Laki-laki", nilai: angka(statistik.lakiLaki) },
              { label: "Perempuan", nilai: angka(statistik.perempuan) },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-slate-200 p-5">
                <p className="text-2xl font-bold tabular-nums text-slate-900">{s.nilai}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 overflow-x-auto gulir-halus rounded-2xl border border-slate-200">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Rukun Tetangga</th>
                  <th className="px-4 py-3 font-semibold">Wilayah</th>
                  <th className="px-4 py-3 text-right font-semibold">KK</th>
                  <th className="px-4 py-3 text-right font-semibold">Jiwa</th>
                </tr>
              </thead>
              <tbody>
                {rtList.map((rt) => {
                  const jiwa =
                    statistik.perRt.find((p) => p.label === `RT ${rt.nomor}`)?.nilai ?? 0;
                  const kk =
                    statistik.kkPerRt.find((p) => p.label === `RT ${rt.nomor}`)?.nilai ?? 0;
                  return (
                    <tr key={rt.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-semibold text-slate-900">{rt.nama}</td>
                      <td className="px-4 py-3 text-slate-600">{rt.wilayah ?? "-"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                        {angka(kk)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                        {angka(jiwa)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Galeri */}
      {foto.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <JudulBagian
            kicker="Dokumentasi"
            judul="Galeri Kegiatan Warga"
            tautan="/galeri"
            labelTautan="Semua album"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {foto.map((f) => (
              <Link
                key={f.id}
                href={`/galeri/${f.album.slug}`}
                className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100"
              >
                <img
                  src={f.url}
                  alt={f.judul ?? f.album.nama}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-[11px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                  {f.album.nama}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Ajakan */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="rounded-3xl border border-brand-100 bg-brand-50 px-6 py-12 text-center sm:px-12">
          <h2 className="text-2xl font-bold tracking-tight text-brand-900">
            Ada usulan, keluhan, atau kabar untuk warga?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-brand-800/80">
            Sampaikan melalui Ketua RT masing-masing atau hubungi sekretariat RW
            {pengaturan.telepon ? ` di ${pengaturan.telepon}` : ""}. Setiap laporan kas
            yang disetujui akan langsung tampil di halaman keuangan situs ini.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/profil"
              className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Lihat Struktur Pengurus
            </Link>
            <Link
              href="/keuangan"
              className="rounded-xl border border-brand-300 bg-white px-5 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
            >
              Telusuri Laporan Kas
            </Link>
          </div>
          <p className="mt-6 text-xs text-brand-700/70">
            Terakhir diperbarui {tanggal(pengaturan.updatedAt ?? new Date())}
          </p>
        </div>
      </section>
    </>
  );
}
