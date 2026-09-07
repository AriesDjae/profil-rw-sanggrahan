import type { Metadata } from "next";
import Link from "next/link";

import { IkonPanahKanan } from "@/components/ui/Ikon";
import JudulBagian from "@/components/ui/JudulBagian";
import Kosong from "@/components/ui/Kosong";
import { db } from "@/lib/db";
import { angka, tanggalSingkat } from "@/lib/format";
import { STATUS_KONTEN } from "@/lib/konstanta";
import { pengumumanKampung } from "@/lib/kueri";
import { ambilPengaturan } from "@/lib/pengaturan";
import { daftarRw } from "@/lib/rw";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const p = await ambilPengaturan();
  return {
    title: `${p.namaKampung} — RW 01, RW 02, RW 03`,
    description: `Portal warga ${p.namaKampung}, Kelurahan ${p.kelurahan}, Kemantren ${p.kemantren}, ${p.kota}. Tiap RW punya lamannya sendiri: berita, agenda, data warga, dan laporan kas.`,
  };
}

/**
 * Beranda kampung — sengaja dibuat ringkas.
 *
 * Warga Sanggrahan tidak datang untuk membaca "kampung"; ia datang untuk
 * mengurus sesuatu di RW-nya. Karena itu halaman ini tidak mencoba menjadi
 * beranda ketiga RW sekaligus, melainkan pintu masuk: tiga kartu RW, pengumuman
 * yang berlaku se-kampung, lalu tautan ke halaman gabungan bagi yang memang
 * ingin melihat ketiganya bersamaan.
 */
export default async function BerandaKampung() {
  const awalHariIni = new Date();
  awalHariIni.setHours(0, 0, 0, 0);

  const [pengaturan, rwList, pengumuman] = await Promise.all([
    ambilPengaturan(),
    daftarRw(),
    pengumumanKampung(4),
  ]);

  // Satu kueri per angka akan menjadi belasan perjalanan ke Singapura. Seluruh
  // hitungan per RW dikerjakan basis data sekaligus, lalu dicocokkan di sini.
  const hitung = await db.$queryRaw<
    {
      rwid: number;
      rt: number;
      jiwa: number;
      kk: number;
      berita: number;
      kegiatan: number;
    }[]
  >`
    SELECT w.id AS rwid,
           (SELECT COUNT(*)::int FROM "Rt" r WHERE r."rwId" = w.id) AS rt,
           (SELECT COUNT(*)::int FROM "Warga" g
              JOIN "Rt" r ON r.id = g."rtId" WHERE r."rwId" = w.id) AS jiwa,
           (SELECT COUNT(DISTINCT g."noKk")::int FROM "Warga" g
              JOIN "Rt" r ON r.id = g."rtId" WHERE r."rwId" = w.id) AS kk,
           (SELECT COUNT(*)::int FROM "Berita" b
              WHERE b."rwId" = w.id AND b.status = ${STATUS_KONTEN.TERBIT}) AS berita,
           (SELECT COUNT(*)::int FROM "Kegiatan" k
              WHERE k."rwId" = w.id AND k.status = ${STATUS_KONTEN.TERBIT}
                AND k.mulai >= ${awalHariIni}) AS kegiatan
    FROM "Rw" w
    WHERE w.aktif = true
    ORDER BY w.nomor`;

  const petaHitung = new Map(hitung.map((h) => [h.rwid, h]));

  const bagian = [
    { href: "/berita", label: "Berita", ket: "Kabar dari ketiga RW" },
    { href: "/kegiatan", label: "Agenda kegiatan", ket: "Jadwal se-kampung" },
    { href: "/keuangan", label: "Laporan kas", ket: "Rekap kas seluruh RT" },
    { href: "/data-warga", label: "Data warga", ket: "Statistik kependudukan" },
    { href: "/galeri", label: "Galeri", ket: "Dokumentasi kegiatan" },
    { href: "/profil", label: "Profil kampung", ket: "Sejarah dan pengurus" },
  ];

  return (
    <>
      <section className="bidang-hijau text-white">
        <div className="motif-kawung">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">
              Kelurahan {pengaturan.kelurahan} · Kemantren {pengaturan.kemantren} ·{" "}
              {pengaturan.kota}
            </p>
            <h1 className="judul mt-4 text-[2.4rem] leading-[1] text-white sm:text-[3.4rem]">
              {pengaturan.namaKampung}
            </h1>
            <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-brand-100">
              {pengaturan.deskripsi ||
                pengaturan.tagline ||
                "Satu situs untuk tiga RW. Pilih RW Anda untuk melihat kabar, agenda, data warga, dan laporan kasnya."}
            </p>
          </div>
        </div>
      </section>

      {/* Tiga pintu masuk */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <JudulBagian
          kicker="Pilih wilayah Anda"
          judul="Tiga RW di Kampung Sanggrahan"
          keterangan="Tiap RW mengelola lamannya sendiri: pengurusnya yang menulis kabar, menjadwalkan kegiatan, dan mengesahkan laporan kas RT di wilayahnya."
        />

        {rwList.length === 0 ? (
          <Kosong
            judul="Belum ada RW yang aktif"
            keterangan="Hubungi administrator kampung untuk mengaktifkan laman RW."
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {rwList.map((rw) => {
              const h = petaHitung.get(rw.id);
              return (
                <Link
                  key={rw.id}
                  href={`/rw/${rw.nomor}`}
                  className="group flex flex-col rounded-2xl border border-garis bg-white p-6 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
                >
                  <span className="judul angka-kas text-[2.6rem] leading-none text-brand-700 transition group-hover:text-brand-900">
                    {String(rw.nomor).padStart(2, "0")}
                  </span>
                  <h3 className="judul mt-3 text-lg text-brand-950">{rw.nama}</h3>
                  <p className="mt-2 min-h-[2.5rem] text-sm leading-relaxed text-tinta/70">
                    {rw.tagline || "Belum ada keterangan singkat."}
                  </p>

                  <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-garis pt-4 text-center">
                    {[
                      { l: "RT", v: angka(h?.rt ?? 0) },
                      { l: "KK", v: angka(h?.kk ?? 0) },
                      { l: "Jiwa", v: angka(h?.jiwa ?? 0) },
                    ].map((s) => (
                      <div key={s.l}>
                        <dd className="judul angka-kas text-[1.2rem] text-brand-900">{s.v}</dd>
                        <dt className="mt-0.5 text-[11px] text-tinta/55">{s.l}</dt>
                      </div>
                    ))}
                  </dl>

                  <p className="mt-4 text-[13px] text-tinta/60">
                    {angka(h?.berita ?? 0)} berita terbit · {angka(h?.kegiatan ?? 0)} agenda
                    mendatang
                  </p>

                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 group-hover:underline">
                    Buka laman {rw.nama}
                    <IkonPanahKanan ukuran={14} />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Pengumuman tingkat kampung */}
      {pengumuman.length > 0 && (
        <section className="border-y border-garis bg-white">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <h2 className="judul text-lg text-brand-950">Pengumuman se-kampung</h2>
            <p className="mt-1 text-sm text-tinta/60">
              Berlaku untuk warga ketiga RW. Pengumuman khusus satu RW ada di laman
              RW-nya masing-masing.
            </p>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                  <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-tinta/70">
                    {p.isi}
                  </p>
                  {p.berakhir && (
                    <p className="mt-3 text-[12px] text-tinta/50">
                      Berlaku sampai {tanggalSingkat(p.berakhir)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Halaman gabungan */}
      <section className="mx-auto max-w-6xl px-4 py-14 pb-20">
        <JudulBagian
          kicker="Lintas RW"
          judul="Melihat ketiga RW sekaligus"
          keterangan="Halaman ini menggabungkan isi RW 01, 02, dan 03 dalam satu daftar, lengkap dengan keterangan asal RW-nya."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bagian.map((b) => (
            <Link
              key={b.href}
              href={b.href}
              className="group flex items-center justify-between gap-4 rounded-xl border border-garis bg-white px-5 py-4 transition hover:border-brand-300 hover:bg-brand-50/40"
            >
              <span>
                <span className="block text-sm font-semibold text-brand-950">{b.label}</span>
                <span className="mt-0.5 block text-[13px] text-tinta/60">{b.ket}</span>
              </span>
              <IkonPanahKanan ukuran={16} className="shrink-0 text-brand-600" />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
