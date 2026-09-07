"use client";

import { pembacaCentang, pembacaNilai } from "@/lib/formulir";

import { useActionState, useRef } from "react";

import {
  AreaTeks,
  Centang,
  PesanGalat,
  PesanSukses,
  Teks,
  TombolSimpan,
} from "@/components/admin/Formulir";

import PilihRw, { type OpsiRw } from "@/components/admin/PilihRw";

import { simpanPengumuman, type Hasil } from "./aksi";

export type PengumumanAwal = {
  id: number;
  rwId: number | null;
  judul: string;
  isi: string;
  penting: boolean;
  aktif: boolean;
  berakhir: string;
} | null;

export default function FormPengumuman({
  awal,
  rwList,
  rwTerkunci,
  onSelesai,
}: {
  awal?: PengumumanAwal;
  rwList: OpsiRw[];
  rwTerkunci: OpsiRw | null;
  onSelesai?: () => void;
}) {
  const [status, aksi] = useActionState<Hasil, FormData>(simpanPengumuman, {});
  const v = pembacaNilai(status.nilai);
  const c = pembacaCentang(status.nilai);
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      action={async (fd) => {
        await aksi(fd);
        if (!awal) ref.current?.reset();
        onSelesai?.();
      }}
      className="space-y-4"
    >
      {awal && <input type="hidden" name="id" value={awal.id} />}
      <PesanGalat pesan={status.galat} />

      <PilihRw
        rwList={rwList}
        rwTerkunci={rwTerkunci}
        nilaiAwal={awal?.rwId}
        keterangan="Pengumuman satu RW hanya tampil di laman RW itu."
      />
      <PesanSukses pesan={status.sukses} />

      <Teks
        label="Judul"
        nama="judul"
        wajib
        nilaiAwal={v("judul", awal?.judul)}
        placeholder="Contoh: Iuran warga bulan September dibuka"
      />
      <AreaTeks
        label="Isi pengumuman"
        nama="isi"
        wajib
        baris={4}
        nilaiAwal={v("isi", awal?.isi)}
        placeholder="Tuliskan informasi singkat dan jelas untuk warga."
      />
      <Teks
        label="Berlaku sampai (opsional)"
        nama="berakhir"
        tipe="date"
        nilaiAwal={v("berakhir", awal?.berakhir)}
        keterangan="Setelah tanggal ini pengumuman otomatis tidak tampil di beranda."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Centang
          label="Tandai penting"
          nama="penting"
          nilaiAwal={c("penting", awal?.penting ?? false)}
          keterangan="Ditampilkan dengan warna sorot di beranda."
        />
        <Centang
          label="Aktif"
          nama="aktif"
          nilaiAwal={c("aktif", awal?.aktif ?? true)}
          keterangan="Nonaktifkan untuk menyembunyikan tanpa menghapus."
        />
      </div>

      <TombolSimpan label={awal ? "Simpan perubahan" : "Tambah pengumuman"} />
    </form>
  );
}
