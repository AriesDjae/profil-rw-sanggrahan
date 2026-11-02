import Image from "next/image";
import Link from "next/link";

import BatangGanda from "@/components/grafik/BatangGanda";
import KartuBerita from "@/components/publik/KartuBerita";
import KartuKegiatan from "@/components/publik/KartuKegiatan";
import KepalaPanorama from "@/components/publik/KepalaPanorama";
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

  const tautanRw = [
    { href: `${dasar}/keuangan`, label: "Laporan kas RT" },
    { href: `${dasar}/kegiatan`, label: "Agenda kegiatan" },
    { href: `${dasar}/data-warga`, label: "Data warga" },
    { href: `${dasar}/peta`, label: "Peta" },
    { href: `${dasar}/profil`, label: "Pengurus dan kontak" },
  ];

  return (
    <>
      <KepalaPanorama
        gambar={rwPenuh?.heroFoto || `/ilustrasi/panorama-kampung.svg`}
        alt={`Suasana gang di ${rw.nama} Kampung Sanggrahan`}
      >
        <p className="text-sm font-medium text-brand-800/80">
          <Link href="/" className="underline underline-offset-4 hover:text-brand-950">
            {pengaturan.namaKampung}
          </Link>
        </p>
        <h1 className="judul mt-2 text-[2.9rem] leading-[0.98] text-brand-900 sm:text-[4.25rem]">
          {rw.nama}
        </h1>
        <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-brand-900/85">
          {rwPenuh?.deskripsi || rw.tagline || pengaturan.tagline}
        </p>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-brand-900/75">
          {angka(statistik.totalKk)} kepala keluarga dan {angka(statistik.totalJiwa)} jiwa di{" "}
          {angka(rtList.length)} RT. Tahun ini {angka(keuangan.jumlahLaporan)} laporan kas sudah
          disahkan.
        </p>
        <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
          {tautanRw.map((t) => (
            <li key={t.href}>
              <Link
                href={t.href}
                className="text-[15px] font-semibold text-brand-800 underline decoration-aksen-400 decoration-2 underline-offset-4 hover:text-brand-950"
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </KepalaPanorama>

      {sorotan.length > 0 && <SorotanUtama daftar={sorotan} />}

      {/* Pengumuman */}
      {pengumuman.length > 0 && (
        <section className="bg-soga-100">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <h2 className="judul text-[1.5rem] text-brand-900">Papan pengumuman</h2>
            <ul className="mt-7 gap-6 sm:columns-2 lg:columns-3">
              {pengumuman.map((p) => (
                <li key={p.id} className={`catatan mb-6 p-5 ${p.penting ? "catatan-penting" : ""}`}>
                  {(p.penting || p.rwId === null) && (
                    <p className="mb-2 text-[13px] font-semibold text-aksen-800">
                      {p.penting ? "Perlu perhatian" : "Seluruh kampung"}
                    </p>
                  )}
                  <p className="judul text-[1.05rem] leading-snug text-brand-900">{p.judul}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-tinta/75">{p.isi}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Kabar lain */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <JudulBagian
          judul={`Yang sedang terjadi di ${rw.nama}`}
          tautan={`${dasar}/berita`}
        />

        {selanjutnya.length === 0 ? (
          <Kosong
            judul="Belum ada kabar lain"
            keterangan="Kabar baru akan muncul di sini setelah dipublikasikan pengurus."
          />
        ) : (
          <div className={selanjutnya.length > 1 ? "grid gap-10 sm:grid-cols-3 sm:gap-8" : ""}>
            {selanjutnya.map((b) => (
              <KartuBerita key={b.slug} berita={b} utama={selanjutnya.length === 1} />
            ))}
          </div>
        )}
      </section>

      {/* Agenda */}
      <section className="border-y border-garis bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <JudulBagian
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
            judul="Wajah kegiatan warga"
            tautan={`${dasar}/galeri`}
            labelTautan="Semua album"
          />
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {foto.map((f, i) => (
              <Link
                key={f.id}
                href={`/galeri/${f.album.slug}`}
                className={`group relative overflow-hidden bg-soga-100 ${
                  i === 0 ? "col-span-2 aspect-[16/10] sm:row-span-2 sm:aspect-auto" : "aspect-[4/3]"
                } ${i > 4 ? "hidden" : ""}`}
              >
                <Image
                  src={f.url}
                  alt={f.judul ?? f.album.nama}
                  width={i === 0 ? 800 : 400}
                  height={i === 0 ? 500 : 300}
                  sizes={i === 0 ? "(min-width: 640px) 50vw, 100vw" : "(min-width: 640px) 25vw, 50vw"}
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
      <section className="mx-auto max-w-6xl px-4 pb-6">
        <div className="max-w-2xl border-l-4 border-aksen-400 pl-6">
          <h2 className="judul text-[1.5rem] text-brand-900 sm:text-[1.75rem]">
            Punya usulan, keluhan, atau kabar untuk warga?
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-tinta/75">
            Sampaikan lewat Ketua RT masing-masing atau hubungi sekretariat {rw.nama}
            {rwPenuh?.telepon || pengaturan.telepon
              ? ` di ${rwPenuh?.telepon || pengaturan.telepon}`
              : ""}
            . Nama pengurus ada di{" "}
            <Link
              href={`${dasar}/profil`}
              className="font-semibold text-soga-700 underline underline-offset-4"
            >
              halaman profil {rw.nama}
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
