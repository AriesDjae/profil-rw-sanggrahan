import Link from "next/link";

import BatangGanda from "@/components/grafik/BatangGanda";
import KartuBerita from "@/components/publik/KartuBerita";
import KartuKegiatan from "@/components/publik/KartuKegiatan";
import SorotanUtama from "@/components/publik/SorotanUtama";
import JudulBagian from "@/components/ui/JudulBagian";
import Kosong from "@/components/ui/Kosong";
import { db } from "@/lib/db";
import { angka, rupiah, tanggalSingkat } from "@/lib/format";
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
import { saringKontenRw } from "@/lib/rw";

import type { Lingkup } from "./lingkup";

/**
 * Beranda satu RW: /rw/1, /rw/2, /rw/3.
 *
 * Susunannya sama untuk ketiga RW dan isinya seluruhnya milik RW itu — kabar,
 * agenda, kas RT-nya, warganya. Yang menembus batas hanya konten bertingkat
 * kampung, yang memang ditujukan kepada warga ketiga RW.
 */
export default async function IsiBeranda({ lingkup }: { lingkup: Lingkup }) {
  const rw = lingkup.rw;
  if (!rw) throw new Error("IsiBeranda hanya untuk laman RW; beranda kampung punya halamannya sendiri.");

  const rwId = rw.id;
  const tahunIni = new Date().getFullYear();
  const dasar = lingkup.basis;

  const [pengaturan, rwPenuh, berita, kegiatan, pengumuman, statistik, keuangan, rtList, foto] =
    await Promise.all([
      ambilPengaturan(),
      db.rw.findUnique({ where: { id: rwId } }),
      beritaTerbit(8, 0, undefined, rwId),
      kegiatanMendatang(5, rwId),
      pengumumanAktif(3, rwId),
      statistikWarga(undefined, rwId),
      rekapKeuanganTahun(tahunIni, rwId),
      daftarRt(rwId),
      db.foto.findMany({
        where: { album: saringKontenRw(rwId) },
        take: 6,
        orderBy: { id: "desc" },
        include: { album: { select: { slug: true, nama: true } } },
      }),
    ]);

  const sorotan = berita.slice(0, 4).map((b) => ({
    slug: b.slug,
    judul: b.judul,
    ringkasan: b.ringkasan,
    kategori: b.kategori,
    gambar: b.gambar,
    tanggal: tanggalSingkat(b.terbitAt),
  }));
  const selanjutnya = berita.slice(4, 7);

  const dataGrafik = keuangan.perBulan.map(([bulan, nilai]) => ({
    label: NAMA_BULAN[bulan - 1].slice(0, 3),
    seri1: nilai.pemasukan,
    seri2: nilai.pengeluaran,
  }));

  const angkaRw = [
    { nilai: angka(statistik.totalKk), label: "kepala keluarga" },
    { nilai: angka(statistik.totalJiwa), label: "jiwa terdata" },
    { nilai: angka(rtList.length), label: "rukun tetangga" },
    { nilai: angka(keuangan.jumlahLaporan), label: `laporan kas terbit ${tahunIni}` },
  ];

  return (
    <>
      {/* Kepala halaman */}
      <section className="bidang-hijau text-white">
        <div className="motif-kawung">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">
              <Link href="/" className="underline-offset-4 hover:text-white hover:underline">
                {pengaturan.namaKampung}
              </Link>
            </p>
            <h1 className="judul mt-3 text-[2.4rem] leading-[1] text-white sm:text-[3.4rem]">
              {rw.nama}
            </h1>
            <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-brand-100">
              {rwPenuh?.deskripsi || rw.tagline || pengaturan.tagline}
            </p>

            <div className="mt-8 flex flex-wrap gap-2.5">
              {[
                { href: `${dasar}/keuangan`, label: "Laporan kas RT", utama: true },
                { href: `${dasar}/kegiatan`, label: "Agenda kegiatan" },
                { href: `${dasar}/data-warga`, label: "Data warga" },
                { href: `${dasar}/profil`, label: "Pengurus & kontak" },
              ].map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
                    t.utama
                      ? "bg-aksen-400 text-brand-950 hover:bg-aksen-200"
                      : "border border-white/30 text-white hover:bg-white/10"
                  }`}
                >
                  {t.label}
                </Link>
              ))}
            </div>

            <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/15 sm:grid-cols-4">
              {angkaRw.map((a) => (
                <div key={a.label} className="bg-brand-800/95 px-5 py-4">
                  <dd className="judul angka-kas text-[1.7rem] text-white">{a.nilai}</dd>
                  <dt className="mt-1 text-[13px] text-brand-200">{a.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {sorotan.length > 0 && <SorotanUtama daftar={sorotan} />}

      {/* Pengumuman */}
      {pengumuman.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="judul text-lg text-brand-950">Pengumuman</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-3">
            {pengumuman.map((p) => (
              <li
                key={p.id}
                className={`kartu p-5 ${p.penting ? "border-aksen-200 bg-aksen-50" : ""}`}
              >
                <p className="mb-2 flex flex-wrap gap-x-2 text-[12px] font-semibold">
                  {p.penting && <span className="text-aksen-800">Perlu perhatian</span>}
                  {p.rwId === null && (
                    <span className="text-brand-700">Seluruh kampung</span>
                  )}
                </p>
                <p className="judul text-[15px] leading-snug text-brand-950">{p.judul}</p>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-tinta/70">
                  {p.isi}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Kabar lain */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <JudulBagian
          kicker="Kabar warga"
          judul={`Yang sedang terjadi di ${rw.nama}`}
          tautan={`${dasar}/berita`}
        />

        {selanjutnya.length === 0 ? (
          <Kosong
            judul="Belum ada kabar lain"
            keterangan="Kabar baru akan muncul di sini setelah dipublikasikan pengurus."
          />
        ) : (
          <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
            {selanjutnya.map((b) => (
              <KartuBerita key={b.slug} berita={b} />
            ))}
          </div>
        )}
      </section>

      {/* Agenda */}
      <section className="border-y border-garis bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <JudulBagian
            kicker="Agenda"
            judul="Kegiatan yang akan berlangsung"
            keterangan="Catat tanggalnya, lalu datang. Kegiatan dalam sepekan ke depan ditandai kuning."
            tautan={`${dasar}/kegiatan`}
          />

          {kegiatan.length === 0 ? (
            <Kosong
              judul="Belum ada agenda terjadwal"
              keterangan="Agenda kegiatan mendatang akan tampil di sini."
            />
          ) : (
            <div className="grid gap-x-12 lg:grid-cols-2">
              {kegiatan.map((k) => (
                <KartuKegiatan key={k.slug} kegiatan={k} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Keuangan */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <JudulBagian
          kicker="Keterbukaan keuangan"
          judul={`Kas RT ${rw.nama} sepanjang ${tahunIni}`}
          keterangan="Angka ini hanya menghitung laporan yang sudah diperiksa Ketua RT dan disahkan Ketua RW."
          tautan={`${dasar}/keuangan`}
          labelTautan="Rincian per RT"
        />

        <dl className="grid border-t border-garis sm:grid-cols-3">
          {[
            { label: "Pemasukan", nilai: rupiah(keuangan.totalPemasukan), warna: "text-seri-1" },
            { label: "Pengeluaran", nilai: rupiah(keuangan.totalPengeluaran), warna: "text-seri-2" },
            { label: "Saldo kas terakhir", nilai: rupiah(keuangan.totalSaldo), warna: "text-brand-800" },
          ].map((s, i) => (
            <div
              key={s.label}
              className={`border-b border-garis py-5 sm:border-b-0 ${
                i < 2 ? "sm:border-r sm:pr-6" : ""
              } ${i > 0 ? "sm:pl-6" : ""}`}
            >
              <dt className="text-[13px] text-tinta/60">{s.label}</dt>
              <dd className={`judul angka-kas mt-2 text-[1.6rem] ${s.warna}`}>{s.nilai}</dd>
            </div>
          ))}
        </dl>

        {dataGrafik.length > 0 && (
          <div className="mt-8">
            <BatangGanda
              data={dataGrafik}
              judul={`Arus kas bulanan seluruh RT di ${rw.nama} (${tahunIni})`}
              keterangan="Nilai gabungan dari laporan kas yang sudah disahkan."
            />
          </div>
        )}
      </section>

      {/* Warga */}
      <section className="border-y border-garis bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <JudulBagian
            kicker="Kependudukan"
            judul={`Warga ${rw.nama} dalam angka`}
            keterangan="Data agregat, tanpa identitas pribadi siapa pun."
            tautan={`${dasar}/data-warga`}
            labelTautan="Statistik lengkap"
          />

          <div className="overflow-x-auto gulir-halus">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead>
                <tr className="border-y border-garis text-[13px] text-tinta/60">
                  <th className="py-3 pr-4 font-medium">Rukun Tetangga</th>
                  <th className="py-3 pr-4 font-medium">Wilayah</th>
                  <th className="py-3 pr-4 text-right font-medium">KK</th>
                  <th className="py-3 text-right font-medium">Jiwa</th>
                </tr>
              </thead>
              <tbody>
                {rtList.map((rt) => {
                  const jiwa = statistik.perRt.find((p) => p.rtId === rt.id)?.nilai ?? 0;
                  const kk = statistik.kkPerRt.find((p) => p.rtId === rt.id)?.nilai ?? 0;
                  return (
                    <tr key={rt.id} className="border-b border-garis last:border-b-0">
                      <td className="judul py-3 pr-4 text-[15px] text-brand-900">
                        {rt.nama}
                      </td>
                      <td className="py-3 pr-4 text-tinta/65">{rt.wilayah ?? "-"}</td>
                      <td className="angka-kas py-3 pr-4 text-right text-tinta/80">
                        {angka(kk)}
                      </td>
                      <td className="angka-kas py-3 text-right text-tinta/80">
                        {angka(jiwa)}
                      </td>
                    </tr>
                  );
                })}
                {rtList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-tinta/60">
                      Daftar RT {rw.nama} belum diisi pengurus.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Galeri */}
      {foto.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14">
          <JudulBagian
            kicker="Dokumentasi"
            judul="Wajah kegiatan warga"
            tautan={`${dasar}/galeri`}
            labelTautan="Semua album"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {foto.map((f) => (
              <Link
                key={f.id}
                href={`/galeri/${f.album.slug}`}
                className="group relative aspect-square overflow-hidden rounded-xl border border-garis bg-white"
              >
                <img
                  src={f.url}
                  alt={f.judul ?? f.album.nama}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 bg-brand-950/80 p-2 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
                  {f.album.nama}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Ajakan */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="overflow-hidden rounded-2xl bidang-hijau">
          <div className="motif-kawung px-6 py-14 text-center sm:px-12">
            <h2 className="judul mx-auto max-w-2xl text-[1.75rem] text-white sm:text-[2.15rem]">
              Punya usulan, keluhan, atau kabar untuk warga?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-brand-200">
              Sampaikan lewat Ketua RT masing-masing atau hubungi sekretariat {rw.nama}
              {rwPenuh?.telepon || pengaturan.telepon
                ? ` di ${rwPenuh?.telepon || pengaturan.telepon}`
                : ""}
              . Laporan kas yang sudah disahkan akan langsung tampil di halaman keuangan.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href={`${dasar}/profil`}
                className="bg-aksen-400 px-5 py-3 text-sm font-semibold text-brand-950 transition hover:bg-aksen-200"
              >
                Lihat pengurus {rw.nama}
              </Link>
              <Link
                href={`${dasar}/keuangan`}
                className="border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Telusuri laporan kas
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
