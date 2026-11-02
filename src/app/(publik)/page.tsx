import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import KepalaPanorama from "@/components/publik/KepalaPanorama";
import PapanArah from "@/components/publik/PapanArah";
import PetaMalas from "@/components/publik/PetaMalas";
import JudulBagian from "@/components/ui/JudulBagian";
import Kosong from "@/components/ui/Kosong";
import { db } from "@/lib/db";
import { angka, tanggalSingkat } from "@/lib/format";
import { STATUS_KONTEN } from "@/lib/konstanta";
import { pengumumanKampung } from "@/lib/kueri";
import { ambilPengaturan } from "@/lib/pengaturan";
import { TITIK_USAHA } from "@/lib/petaKampung";
import { daftarRw } from "@/lib/rw";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const p = await ambilPengaturan();
  return {
    title: `${p.namaKampung}: RW 01, RW 02, RW 03`,
    description: `Portal warga ${p.namaKampung}, Kelurahan ${p.kelurahan}, Kemantren ${p.kemantren}, ${p.kota}. Tiap RW punya lamannya sendiri: berita, agenda, data warga, dan laporan kas.`,
  };
}

const HALAMAN_GABUNGAN = [
  { href: "/berita", label: "Berita", ket: "Kabar dari ketiga RW" },
  { href: "/kegiatan", label: "Agenda kegiatan", ket: "Jadwal se-kampung" },
  { href: "/keuangan", label: "Laporan kas", ket: "Rekap kas seluruh RT" },
  { href: "/data-warga", label: "Data warga", ket: "Statistik kependudukan" },
  { href: "/galeri", label: "Galeri", ket: "Dokumentasi kegiatan" },
  { href: "/profil", label: "Profil kampung", ket: "Sejarah dan pengurus" },
];

/**
 * Beranda kampung — sengaja dibuat ringkas.
 *
 * Warga Sanggrahan tidak datang untuk membaca "kampung"; ia datang untuk
 * mengurus sesuatu di RW-nya. Karena itu halaman ini berisi papan penunjuk RW,
 * pengumuman yang berlaku se-kampung, letak kampung di peta, lalu tautan ke
 * halaman gabungan bagi yang memang ingin melihat ketiganya bersamaan.
 */
export default async function BerandaKampung() {
  const awalHariIni = new Date();
  awalHariIni.setHours(0, 0, 0, 0);

  const [pengaturan, rwList, pengumuman, sampulRw] = await Promise.all([
    ambilPengaturan(),
    daftarRw(),
    pengumumanKampung(4),
    db.rw.findMany({ where: { aktif: true }, select: { id: true, heroFoto: true } }),
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
  const petaSampul = new Map(sampulRw.map((r) => [r.id, r.heroFoto]));

  return (
    <>
      <KepalaPanorama
        gambar={pengaturan.heroFoto || "/ilustrasi/panorama-kampung.svg"}
        alt="Pagi di Kampung Sanggrahan: deretan rumah, gapura, pos ronda, dan warga di gang, dengan Merapi di kejauhan"
        samping={rwList.length > 0 ? <PapanArah daftar={rwList} /> : undefined}
      >
        <h1 className="judul text-[2.9rem] leading-[0.98] text-brand-900 sm:text-[4.25rem]">
          {pengaturan.namaKampung}
        </h1>
        <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-brand-900/85">
          {pengaturan.deskripsi ||
            pengaturan.tagline ||
            "Satu situs untuk tiga RW. Pilih RW Anda untuk melihat kabar, agenda, data warga, dan laporan kasnya."}
        </p>
        <p className="mt-3 text-sm text-brand-800/75">
          Kelurahan {pengaturan.kelurahan}, Kemantren {pengaturan.kemantren}, {pengaturan.kota}
        </p>
      </KepalaPanorama>

      <section className="mx-auto max-w-6xl px-4 pt-16">
        <JudulBagian
          judul="Tiap RW mengurus lamannya sendiri"
          keterangan="Pengurusnya yang menulis kabar, menjadwalkan kegiatan, dan mengesahkan laporan kas RT di wilayahnya."
        />

        {rwList.length === 0 ? (
          <Kosong
            judul="Belum ada RW yang aktif"
            keterangan="Hubungi administrator kampung untuk mengaktifkan laman RW."
          />
        ) : (
          <ul className="border-t border-garis">
            {rwList.map((rw, i) => {
              const h = petaHitung.get(rw.id);
              const sampul = petaSampul.get(rw.id);
              return (
                <li
                  key={rw.id}
                  className="group relative grid gap-4 border-b border-garis py-6 sm:grid-cols-[15rem_minmax(0,1fr)] sm:items-center sm:gap-8"
                >
                  <div
                    className={`h-32 overflow-hidden bg-langit sm:h-28 ${
                      i % 2 ? "potongan-b" : "potongan"
                    }`}
                  >
                    {sampul && (
                      <Image
                        src={sampul}
                        alt=""
                        width={480}
                        height={132}
                        className="h-full w-full object-cover object-[60%_100%] transition duration-500 group-hover:scale-[1.03]"
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="judul text-[1.45rem] text-brand-900">
                      <Link
                        href={`/rw/${rw.nomor}`}
                        className="underline-offset-[5px] after:absolute after:inset-0 group-hover:underline"
                      >
                        {rw.nama}
                      </Link>
                    </h3>
                    <p className="mt-1 text-[15px] text-soga-700">
                      {rw.tagline || "Belum ada keterangan singkat."}
                    </p>
                    <p className="mt-2 text-[15px] leading-relaxed text-tinta/70">
                      {angka(h?.rt ?? 0)} RT, {angka(h?.kk ?? 0)} KK, dan {angka(h?.jiwa ?? 0)} jiwa.{" "}
                      {angka(h?.berita ?? 0)} berita terbit dan {angka(h?.kegiatan ?? 0)} agenda
                      mendatang.
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Pengumuman tingkat kampung */}
      {pengumuman.length > 0 && (
        <section className="mt-16 bg-soga-100">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <JudulBagian
              judul="Papan pengumuman"
              keterangan="Berlaku untuk warga ketiga RW. Pengumuman khusus satu RW ada di laman RW-nya."
            />
            <ul className="gap-6 sm:columns-2 lg:columns-3">
              {pengumuman.map((p) => (
                <li key={p.id} className={`catatan mb-6 p-5 ${p.penting ? "catatan-penting" : ""}`}>
                  {p.penting && (
                    <p className="mb-2 text-[13px] font-semibold text-aksen-800">Perlu perhatian</p>
                  )}
                  <p className="judul text-[1.05rem] leading-snug text-brand-900">{p.judul}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-tinta/75">{p.isi}</p>
                  {p.berakhir && (
                    <p className="mt-3 text-[13px] text-tinta/60">
                      Berlaku sampai {tanggalSingkat(p.berakhir)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Letak kampung */}
      <section className="mx-auto grid max-w-6xl gap-8 px-4 pt-16 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start lg:gap-12">
        <div>
          <JudulBagian
            judul="Di mana Sanggrahan?"
            keterangan={`Di Semaki, Umbulharjo, tidak jauh dari Stadion Mandala Krida. Titik di peta adalah ${TITIK_USAHA.length} usaha warga RW 01 dan RW 03.`}
          />
          <Link
            href="/peta"
            className="text-sm font-semibold text-soga-700 underline underline-offset-4 hover:text-soga-800"
          >
            Buka peta lengkap
          </Link>
        </div>
        <PetaMalas titik={TITIK_USAHA} ringkas />
      </section>

      {/* Halaman gabungan */}
      <section className="mx-auto max-w-6xl px-4 pt-16">
        <JudulBagian
          judul="Ingin melihat ketiga RW sekaligus?"
          keterangan="Halaman ini menggabungkan isi RW 01, 02, dan 03 dalam satu daftar, lengkap dengan keterangan asal RW-nya."
        />
        <ul className="grid gap-x-12 sm:grid-cols-2">
          {HALAMAN_GABUNGAN.map((b) => (
            <li key={b.href} className="border-t border-garis">
              <Link
                href={b.href}
                className="group flex items-baseline justify-between gap-4 py-3.5"
              >
                <span className="font-semibold text-brand-800 underline-offset-4 group-hover:underline">
                  {b.label}
                </span>
                <span className="text-sm text-tinta/60">{b.ket}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
