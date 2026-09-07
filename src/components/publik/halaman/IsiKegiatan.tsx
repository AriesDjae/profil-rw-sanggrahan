import Link from "next/link";

import KartuKegiatan from "@/components/publik/KartuKegiatan";
import JudulBagian from "@/components/ui/JudulBagian";
import Kosong from "@/components/ui/Kosong";
import { db } from "@/lib/db";
import { tanggalSingkat } from "@/lib/format";
import { NAMA_BULAN } from "@/lib/konstanta";
import { saringKontenRw } from "@/lib/rw";

import type { Lingkup } from "./lingkup";

/** Agenda kegiatan — dipakai `/kegiatan` dan `/rw/[n]/kegiatan`. */
export default async function IsiKegiatan({
  lingkup,
  tampilLampau,
}: {
  lingkup: Lingkup;
  tampilLampau: boolean;
}) {
  const rwId = lingkup.rw?.id ?? null;
  const saringRw = saringKontenRw(rwId);

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
      rw: { select: { nomor: true, nama: true } },
    },
  };

  const [kegiatan, jumlahMendatang, jumlahLampau] = await Promise.all([
    db.kegiatan.findMany({
      where: {
        ...saringRw,
        status: { in: ["TERBIT", "SELESAI"] },
        mulai: tampilLampau ? { lt: awalHariIni } : { gte: awalHariIni },
      },
      ...pilihan,
      take: 40,
    }),
    db.kegiatan.count({
      where: { ...saringRw, status: "TERBIT", mulai: { gte: awalHariIni } },
    }),
    db.kegiatan.count({
      where: {
        ...saringRw,
        status: { in: ["TERBIT", "SELESAI"] },
        mulai: { lt: awalHariIni },
      },
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

  const dasar = `${lingkup.basis}/kegiatan`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <JudulBagian
        kicker="Agenda"
        judul={`Kegiatan ${lingkup.nama}`}
        tingkat="h1"
        keterangan={
          lingkup.rw
            ? `Jadwal resmi kegiatan di ${lingkup.nama}, termasuk kegiatan bersama tingkat kampung. Kehadiran warga sangat diharapkan.`
            : "Jadwal kegiatan ketiga RW beserta kegiatan bersama tingkat kampung."
        }
      />

      <div className="mb-8 inline-flex rounded-xl border border-garis bg-white p-1">
        <Link
          href={dasar}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            !tampilLampau ? "bg-brand-600 text-white" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Akan datang ({jumlahMendatang})
        </Link>
        <Link
          href={`${dasar}?tampil=lampau`}
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
                  <KartuKegiatan key={k.slug} kegiatan={k} tampilkanRw={!lingkup.rw} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="mt-12 rounded-2xl border border-garis bg-white px-5 py-4 text-sm text-slate-600">
        Ingin mengusulkan kegiatan? Sampaikan kepada Ketua RT masing-masing paling lambat
        satu pekan sebelum pelaksanaan agar dapat dimasukkan ke agenda{" "}
        {lingkup.rw ? lingkup.nama : "RW Anda"}. Data per {tanggalSingkat(new Date())}.
      </p>
    </div>
  );
}
