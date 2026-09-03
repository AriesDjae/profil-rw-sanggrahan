"use client";

import { pembacaNilai } from "@/lib/formulir";

import { useActionState } from "react";

import {
  AreaTeks,
  PesanGalat,
  PesanSukses,
  Teks,
  TombolSimpan,
} from "@/components/admin/Formulir";

import { simpanAlbum, type Hasil } from "./aksi";

export default function FormAlbum({
  awal,
}: {
  awal?: {
    id: number;
    nama: string;
    deskripsi: string | null;
    tanggal: string;
  } | null;
}) {
  const [status, aksi] = useActionState<Hasil, FormData>(simpanAlbum, {});
  const v = pembacaNilai(status.nilai);

  return (
    <form action={aksi} className="space-y-4">
      {awal && <input type="hidden" name="id" value={awal.id} />}
      <PesanGalat pesan={status.galat} />
      <PesanSukses pesan={status.sukses} />

      <Teks
        label="Nama album"
        nama="nama"
        wajib
        nilaiAwal={v("nama", awal?.nama)}
        placeholder="Contoh: Kerja Bakti Saluran Air"
      />
      <Teks label="Tanggal kegiatan" nama="tanggal" tipe="date" nilaiAwal={v("tanggal", awal?.tanggal)} />
      <AreaTeks
        label="Deskripsi (opsional)"
        nama="deskripsi"
        baris={3}
        nilaiAwal={v("deskripsi", awal?.deskripsi)}
      />
      <TombolSimpan label={awal ? "Simpan album" : "Buat album"} />
    </form>
  );
}
