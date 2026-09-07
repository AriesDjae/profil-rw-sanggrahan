import Link from "next/link";

import BatangHorizontal from "@/components/grafik/BatangHorizontal";
import PiramidaUsia from "@/components/grafik/PiramidaUsia";
import JudulBagian from "@/components/ui/JudulBagian";
import KartuStatistik from "@/components/ui/KartuStatistik";
import { angka } from "@/lib/format";
import { daftarRt, statistikWarga } from "@/lib/kueri";

import type { Lingkup } from "./lingkup";

/**
 * Statistik kependudukan — dipakai `/data-warga` dan `/rw/[n]/data-warga`.
 *
 * Seluruh angkanya agregat. Nama, NIK, dan alamat warga tidak pernah sampai ke
 * halaman publik mana pun; itu hanya ada di panel pengurus.
 */
export default async function IsiDataWarga({
  lingkup,
  rtId,
}: {
  lingkup: Lingkup;
  rtId?: number;
}) {
  const rwId = lingkup.rw?.id ?? null;

  const [rtList, statistikMentah] = await Promise.all([
    daftarRt(rwId),
    statistikWarga(rtId, rwId),
  ]);

  // ?rt= bisa diketik tangan. RT dari RW lain diabaikan, bukan dipakai
  // menyaring — kalau tidak, laman RW 1 bisa menampilkan data RT milik RW 3.
  const rtTerpilih = rtList.find((r) => r.id === rtId);
  const statistik = rtId && !rtTerpilih ? await statistikWarga(undefined, rwId) : statistikMentah;
  const rtDipakai = rtTerpilih ? rtId : undefined;

  const rasio =
    statistik.perempuan > 0
      ? ((statistik.lakiLaki / statistik.perempuan) * 100).toFixed(0)
      : "-";
  const rerataKk =
    statistik.totalKk > 0 ? (statistik.totalJiwa / statistik.totalKk).toFixed(1) : "-";

  const dasar = `${lingkup.basis}/data-warga`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <JudulBagian
        kicker="Kependudukan"
        judul={`Data Warga ${rtTerpilih ? `${rtTerpilih.nama}` : lingkup.nama}`}
        tingkat="h1"
        keterangan="Seluruh angka pada halaman ini merupakan data agregat. Identitas pribadi warga (nama, NIK, alamat) hanya dapat diakses pengurus melalui panel administrasi."
      />

      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href={dasar}
          className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
            !rtDipakai
              ? "bg-brand-600 text-white"
              : "border border-garis bg-white text-slate-600 hover:border-brand-300"
          }`}
        >
          {lingkup.rw ? `Seluruh ${lingkup.nama}` : "Seluruh kampung"}
        </Link>
        {rtList.map((rt) => (
          <Link
            key={rt.id}
            href={`${dasar}?rt=${rt.id}`}
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
              rtDipakai === rt.id
                ? "bg-brand-600 text-white"
                : "border border-garis bg-white text-slate-600 hover:border-brand-300"
            }`}
          >
            RT {rt.nomor}
            {!lingkup.rw ? ` · ${rt.rw.nama}` : ""}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KartuStatistik label="Total Jiwa" nilai={angka(statistik.totalJiwa)} nada="brand" />
        <KartuStatistik
          label="Kepala Keluarga"
          nilai={angka(statistik.totalKk)}
          keterangan={`Rata-rata ${rerataKk} jiwa per KK`}
        />
        <KartuStatistik
          label="Laki-laki"
          nilai={angka(statistik.lakiLaki)}
          keterangan={
            statistik.totalJiwa
              ? `${((statistik.lakiLaki / statistik.totalJiwa) * 100).toFixed(1)}% dari total`
              : undefined
          }
        />
        <KartuStatistik
          label="Perempuan"
          nilai={angka(statistik.perempuan)}
          keterangan={`Rasio jenis kelamin ${rasio}`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <PiramidaUsia
          data={statistik.usia}
          judul="Komposisi Penduduk menurut Kelompok Usia"
          keterangan="Jumlah jiwa pada tiap rentang usia, dipisahkan menurut jenis kelamin."
        />

        {!rtDipakai && (
          <BatangHorizontal
            judul="Sebaran Jiwa per RT"
            keterangan={
              lingkup.rw
                ? `Jumlah warga terdata pada tiap RT di ${lingkup.nama}.`
                : "Jumlah warga terdata pada tiap RT di ketiga RW."
            }
            data={statistik.perRt}
            urutkan={false}
          />
        )}

        <BatangHorizontal
          judul="Mata Pencaharian Warga"
          keterangan="Pekerjaan utama yang tercatat pada data kependudukan."
          data={statistik.pekerjaan}
        />

        <BatangHorizontal
          judul="Tingkat Pendidikan"
          keterangan="Pendidikan terakhir yang ditamatkan atau sedang ditempuh."
          data={statistik.pendidikan}
        />

        <BatangHorizontal
          judul="Pemeluk Agama"
          keterangan="Agama yang tercatat pada kartu keluarga warga."
          data={statistik.agama}
        />

        {!rtDipakai && (
          <BatangHorizontal
            judul="Jumlah Kepala Keluarga per RT"
            data={statistik.kkPerRt}
            urutkan={false}
          />
        )}
      </div>

      <div className="mt-10 rounded-2xl border border-garis bg-white p-6">
        <h2 className="text-sm font-bold text-slate-900">Perbarui data Anda</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
          Terdapat perubahan data keluarga (kelahiran, kematian, pindah, atau perubahan
          pekerjaan)? Sampaikan kepada Ketua RT masing-masing dengan membawa fotokopi kartu
          keluarga agar pendataan tetap mutakhir. Data yang akurat membantu penyaluran
          bantuan sosial dan perencanaan kegiatan warga.
        </p>
      </div>
    </div>
  );
}
