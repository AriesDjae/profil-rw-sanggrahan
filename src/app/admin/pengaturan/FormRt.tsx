"use client";

import { pembacaNilai } from "@/lib/formulir";

import { useActionState, useRef } from "react";

import {
  PesanGalat,
  PesanSukses,
  Pilihan,
  Teks,
  TombolSimpan,
} from "@/components/admin/Formulir";

import { simpanRt, type Hasil } from "./aksi";

export default function FormRt({
  awal,
  rwList,
  rwTerkunci,
}: {
  awal?: {
    id: number;
    nomor: string;
    nama: string;
    wilayah: string | null;
    rw: { nama: string };
  } | null;
  rwList: { id: number; nama: string }[];
  /** Diisi bila pengelolanya Ketua RW: RT baru selalu jatuh di RW-nya. */
  rwTerkunci: { id: number; nama: string } | null;
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

      {awal ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
          <p className="text-xs font-medium text-slate-500">Berada di</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">{awal.rw.nama}</p>
          <p className="mt-1 text-xs text-slate-500">
            RT tidak dapat dipindahkan ke RW lain: warga, kas, dan akun pengurusnya
            ikut menggantung di sini.
          </p>
        </div>
      ) : rwTerkunci ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
          <input type="hidden" name="rwId" value={rwTerkunci.id} />
          <p className="text-xs font-medium text-slate-500">RT baru untuk</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">{rwTerkunci.nama}</p>
        </div>
      ) : (
        <Pilihan
          label="Rukun Warga"
          nama="rwId"
          wajib
          kosong="Pilih RW"
          nilaiAwal={v("rwId")}
          opsi={rwList.map((r) => ({ nilai: r.id, label: r.nama }))}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Teks
          label="Nomor RT"
          nama="nomor"
          wajib
          nilaiAwal={v("nomor", awal?.nomor)}
          placeholder="01"
          keterangan="Dua digit, misalnya 01. Cukup unik di dalam RW-nya."
        />
        <Teks label="Nama tampilan" nama="nama" nilaiAwal={v("nama", awal?.nama)} placeholder="RT 01 / RW 01" />
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
