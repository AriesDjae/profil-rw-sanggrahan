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

export const dynamic = "force-dynamic";

export default async function Beranda() {
  const tahunIni = new Date().getFullYear();

  const [pengaturan, berita, kegiatan, pengumuman, statistik, keuangan, rtList, foto] =
    await Promise.all([
      ambilPengaturan(),
      beritaTerbit(8),
      kegiatanMendatang(5),
      pengumumanAktif(3),
      statistikWarga(),
      rekapKeuanganTahun(tahunIni),
      daftarRt(),
      db.foto.findMany({
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

  const angkaKampung = [
    { nilai: angka(statistik.totalKk), label: "kepala keluarga" },
    { nilai: angka(statistik.totalJiwa), label: "jiwa terdata" },
    { nilai: angka(rtList.length), label: "rukun tetangga" },
    { nilai: angka(keuangan.jumlahLaporan), label: `laporan kas terbit ${tahunIni}` },
  ];

  return (
    <>
      {/* Kepala halaman: sambutan berwarna, angka pokok, dan pintasan tugas */}
      <section className="bidang-hijau text-white">
        <div className="motif-kawung">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
            <h1 className="judul text-[2.4rem] leading-[1] text-white sm:text-[3.4rem]">
              {pengaturan.namaRw}
            </h1>
            <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-brand-100">
              {pengaturan.deskripsi || pengaturan.tagline}
            </p>

            {/* Pintasan: empat hal yang paling sering dicari warga */}
            <div className="mt-8 flex flex-wrap gap-2.5">
              {[
                { href: "/keuangan", label: "Laporan kas RT", utama: true },
                { href: "/kegiatan", label: "Agenda kegiatan" },
                { href: "/data-warga", label: "Data warga" },
                { href: "/profil", label: "Pengurus & kontak" },
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
              {angkaKampung.map((a) => (
                <div key={a.label} className="bg-brand-800/95 px-5 py-4">
                  <dd className="judul angka-kas text-[1.7rem] text-white">{a.nilai}</dd>
                  <dt className="mt-1 text-[13px] text-brand-200">{a.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Sorotan kabar */}
      {sorotan.length > 0 && <SorotanUtama daftar={sorotan} />}

      {/* Pengumuman: seperti kertas yang ditempel di papan */}
      {pengumuman.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="judul text-lg text-brand-950">Pengumuman</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-3">
            {pengumuman.map((p) => (
              <li
                key={p.id}
                className={`kartu p-5 ${p.penting ? "border-aksen-200 bg-aksen-50" : ""}`}
              >
                {p.penting && (
                  <p className="mb-2 text-[12px] font-semibold text-aksen-800">
                    Perlu perhatian
                  </p>
                )}
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
          judul="Yang sedang terjadi di lingkungan kita"
          tautan="/berita"
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
            tautan="/kegiatan"
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

      {/* Keuangan: dibaca seperti halaman buku kas */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <JudulBagian
          kicker="Keterbukaan keuangan"
          judul={`Kas RT sepanjang ${tahunIni}`}
          keterangan="Angka ini hanya menghitung laporan yang sudah diperiksa Ketua RT dan disahkan Ketua RW."
          tautan="/keuangan"
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
              judul={`Arus kas bulanan seluruh RT (${tahunIni})`}
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
            judul="Warga RW 05 dalam angka"
            keterangan="Data agregat, tanpa identitas pribadi siapa pun."
            tautan="/data-warga"
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
                  const jiwa =
                    statistik.perRt.find((p) => p.label === `RT ${rt.nomor}`)?.nilai ?? 0;
                  const kk =
                    statistik.kkPerRt.find((p) => p.label === `RT ${rt.nomor}`)?.nilai ?? 0;
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
            tautan="/galeri"
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
              Sampaikan lewat Ketua RT masing-masing atau hubungi sekretariat RW
              {pengaturan.telepon ? ` di ${pengaturan.telepon}` : ""}. Laporan kas yang
              sudah disahkan akan langsung tampil di halaman keuangan.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/profil"
                className="bg-aksen-400 px-5 py-3 text-sm font-semibold text-brand-950 transition hover:bg-aksen-200"
              >
                Lihat pengurus RW
              </Link>
              <Link
                href="/keuangan"
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
