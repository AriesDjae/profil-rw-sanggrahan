import type { Metadata } from "next";
import Link from "next/link";

import KartuKegiatan from "@/components/publik/KartuKegiatan";
import JudulBagian from "@/components/ui/JudulBagian";
import Kosong from "@/components/ui/Kosong";
import { db } from "@/lib/db";
import { NAMA_BULAN } from "@/lib/konstanta";
import { tanggalSingkat } from "@/lib/format";

export const metadata: Metadata = {
  title: "Agenda Kegiatan",
  description:
    "Jadwal kegiatan warga RW 05 Sanggrahan: kerja bakti, posyandu, rapat, dan kegiatan sosial lainnya.",
};

export const dynamic = "force-dynamic";

export default async function HalamanKegiatan({
  searchParams,
}: {
  searchParams: Promise<{ tampil?: string }>;
}) {
  const sp = await searchParams;
  const tampilLampau = sp.tampil === "lampau";

  const awalHariIni = new Date();
  awalHariIni.setHours(0, 0, 0, 0);

  const pilihan = {
    orderBy: { mulai: tampilLampau ? ("desc" as const) : ("asc" as const) },
    select: {
      id: true,
      slug: true,
      judul: true,
      deskripsi: true,
      mulai: true,
      selesai: true,
      lokasi: true,
      kategori: true,
      penyelenggara: true,
    },
  };

  const [kegiatan, jumlahMendatang, jumlahLampau] = await Promise.all([
    db.kegiatan.findMany({
      where: {
        status: { in: ["TERBIT", "SELESAI"] },
        mulai: tampilLampau ? { lt: awalHariIni } : { gte: awalHariIni },
      },
      ...pilihan,
      take: 40,
    }),
    db.kegiatan.count({ where: { status: "TERBIT", mulai: { gte: awalHariIni } } }),
    db.kegiatan.count({
      where: { status: { in: ["TERBIT", "SELESAI"] }, mulai: { lt: awalHariIni } },
    }),
  ]);

  // Kelompokkan per bulan untuk agenda mendatang
  const perBulan = new Map<string, typeof kegiatan>();
  for (const k of kegiatan) {
    const d = new Date(k.mulai);
    const kunci = `${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`;
    if (!perBulan.has(kunci)) perBulan.set(kunci, []);
    perBulan.get(kunci)!.push(k);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <JudulBagian
        kicker="Agenda"
        judul="Kegiatan Warga"
        tingkat="h1"
        keterangan="Jadwal resmi kegiatan di lingkungan RW 05. Kehadiran warga sangat diharapkan."
      />

      <div className="mb-8 inline-flex rounded-xl border border-garis bg-white p-1">
        <Link
          href="/kegiatan"
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            !tampilLampau ? "bg-brand-600 text-white" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Akan datang ({jumlahMendatang})
        </Link>
        <Link
          href="/kegiatan?tampil=lampau"
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            tampilLampau ? "bg-brand-600 text-white" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Sudah berlangsung ({jumlahLampau})
        </Link>
      </div>

      {kegiatan.length === 0 ? (
        <Kosong
          judul={tampilLampau ? "Belum ada arsip kegiatan" : "Belum ada agenda mendatang"}
          keterangan="Agenda baru akan muncul di sini setelah dijadwalkan pengurus."
        />
      ) : (
        <div className="space-y-10">
          {[...perBulan.entries()].map(([bulan, daftar]) => (
            <section key={bulan}>
              <h2 className="mb-4 flex items-center gap-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                {bulan}
                <span className="h-px flex-1 bg-slate-200" aria-hidden />
                <span className="text-xs font-medium normal-case text-slate-400">
                  {daftar.length} kegiatan
                </span>
              </h2>
              <div className="grid gap-4">
                {daftar.map((k) => (
                  <KartuKegiatan key={k.slug} kegiatan={k} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="mt-12 rounded-2xl border border-garis bg-white px-5 py-4 text-sm text-slate-600">
        Ingin mengusulkan kegiatan? Sampaikan kepada Ketua RT masing-masing paling lambat
        satu pekan sebelum pelaksanaan agar dapat dimasukkan ke agenda RW. Data per{" "}
        {tanggalSingkat(new Date())}.
      </p>
    </div>
  );
}
