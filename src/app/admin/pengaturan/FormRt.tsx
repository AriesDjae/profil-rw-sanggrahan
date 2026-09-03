"use client";

import { pembacaNilai } from "@/lib/formulir";

import { useActionState, useRef } from "react";

import {
  PesanGalat,
  PesanSukses,
  Teks,
  TombolSimpan,
} from "@/components/admin/Formulir";

import { simpanRt, type Hasil } from "./aksi";

export default function FormRt({
  awal,
}: {
  awal?: { id: number; nomor: string; nama: string; wilayah: string | null } | null;
}) {
  const [status, aksi] = useActionState<Hasil, FormData>(simpanRt, {});
  const v = pembacaNilai(status.nilai);
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      action={async (fd) => {
        await aksi(fd);
        if (!awal) ref.current?.reset();
      }}
      className="space-y-4"
    >
      {awal && <input type="hidden" name="id" value={awal.id} />}
      <PesanGalat pesan={status.galat} />
      <PesanSukses pesan={status.sukses} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Teks
          label="Nomor RT"
          nama="nomor"
          wajib
          nilaiAwal={v("nomor", awal?.nomor)}
          placeholder="01"
          keterangan="Gunakan dua digit, misalnya 01."
        />
        <Teks label="Nama tampilan" nama="nama" nilaiAwal={v("nama", awal?.nama)} placeholder="RT 01 / RW 05" />
      </div>

      <Teks
        label="Cakupan wilayah"
        nama="wilayah"
        nilaiAwal={v("wilayah", awal?.wilayah)}
        placeholder="Contoh: Gang Melati dan sekitarnya"
      />

      <TombolSimpan label={awal ? "Simpan RT" : "Tambah RT"} />
    </form>
  );
}
