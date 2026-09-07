import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import KartuKegiatan from "@/components/publik/KartuKegiatan";
import Paragraf from "@/components/ui/Paragraf";
import { db } from "@/lib/db";
import { hitungMundur, jam, potong, selisihHari, tanggal } from "@/lib/format";

// Dirender sekali lalu disajikan dari cache. Setiap perubahan dari panel
// pengurus memanggil revalidatePath, jadi halaman ini tetap segar seketika;
// angka 600 detik hanya jaring pengaman bila ada perubahan di luar aplikasi.
export const revalidate = 600;

/**
 * Menyiapkan seluruh halaman ini saat build sehingga pembaca menerimanya dari
 * cache, bukan menunggu kueri basis data. Halaman baru yang belum ada saat
 * build tetap dilayani dan ikut tersimpan setelah permintaan pertama.
 */
export async function generateStaticParams() {
  const kegiatan = await db.kegiatan.findMany({
    where: { status: { in: ["TERBIT", "SELESAI"] } },
    select: { slug: true },
    orderBy: { mulai: "desc" },
    take: 100,
  });
  return kegiatan.map((k) => ({ slug: k.slug }));
}

async function ambilKegiatan(slug: string) {
  return db.kegiatan.findFirst({
    where: { slug, status: { in: ["TERBIT", "SELESAI"] } },
    include: { rw: { select: { nomor: true, nama: true } } },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const k = await ambilKegiatan(slug);
  if (!k) return { title: "Kegiatan tidak ditemukan" };
  return { title: k.judul, description: potong(k.deskripsi, 155) };
}

export default async function DetailKegiatan({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const kegiatan = await ambilKegiatan(slug);
  if (!kegiatan) notFound();

  const mulai = new Date(kegiatan.mulai);
  const hari = selisihHari(mulai);
  const sudahLewat = hari < 0;

  const awalHariIni = new Date();
  awalHariIni.setHours(0, 0, 0, 0);

  const lainnya = await db.kegiatan.findMany({
    where: {
      status: "TERBIT",
      mulai: { gte: awalHariIni },
      NOT: { id: kegiatan.id },
    },
    orderBy: { mulai: "asc" },
    take: 2,
    select: {
      slug: true,
      judul: true,
      deskripsi: true,
      mulai: true,
      selesai: true,
      lokasi: true,
      kategori: true,
      penyelenggara: true,
    },
  });

  const rincian = [
    { label: "Tanggal", nilai: tanggal(mulai) },
    {
      label: "Waktu",
      nilai: `${jam(mulai)}${kegiatan.selesai ? ` - ${jam(kegiatan.selesai)}` : ""} WIB`,
    },
    { label: "Lokasi", nilai: kegiatan.lokasi },
    {
      label: "Wilayah",
      nilai: kegiatan.rw ? kegiatan.rw.nama : "Seluruh kampung (ketiga RW)",
    },
    { label: "Penyelenggara", nilai: kegiatan.penyelenggara ?? "Pengurus RW" },
    { label: "Kontak", nilai: kegiatan.kontak ?? "-" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500" aria-label="Remah roti">
        <Link href="/" className="hover:text-brand-700">
          Beranda
        </Link>
        <span aria-hidden>/</span>
        <Link href="/kegiatan" className="hover:text-brand-700">
          Kegiatan
        </Link>
        <span aria-hidden>/</span>
        <span className="truncate text-slate-700">{kegiatan.judul}</span>
      </nav>

      <div className="overflow-hidden rounded-3xl border border-garis bg-white shadow-sm">
        {kegiatan.gambar && (
          <img src={kegiatan.gambar} alt="" className="h-56 w-full object-cover sm:h-72" />
        )}

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              {kegiatan.kategori}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                sudahLewat
                  ? "bg-slate-100 text-slate-600"
                  : hari <= 7
                    ? "bg-aksen-100 text-aksen-800"
                    : "bg-slate-100 text-slate-600"
              }`}
            >
              {sudahLewat ? "Sudah berlangsung" : hitungMundur(mulai)}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-3xl">
            {kegiatan.judul}
          </h1>

          <dl className="mt-6 grid gap-4 rounded-2xl bg-kertas p-5 sm:grid-cols-2">
            {rincian.map((r) => (
              <div key={r.label}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {r.label}
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{r.nilai}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
              Keterangan
            </h2>
            <Paragraf teks={kegiatan.deskripsi} />
          </div>
        </div>
      </div>

      {lainnya.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-lg font-bold text-slate-900">Agenda berikutnya</h2>
          <div className="grid gap-4">
            {lainnya.map((k) => (
              <KartuKegiatan key={k.slug} kegiatan={k} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
