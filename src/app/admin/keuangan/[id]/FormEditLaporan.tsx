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

import { ubahLaporan, type Hasil } from "../aksi";

export default function FormEditLaporan({
  id,
  saldoAwal,
  catatan,
}: {
  id: number;
  saldoAwal: number;
  catatan: string | null;
}) {
  const [status, aksi] = useActionState<Hasil, FormData>(ubahLaporan, {});
  const v = pembacaNilai(status.nilai);

  return (
    <form action={aksi} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <PesanGalat pesan={status.galat} />
      <PesanSukses pesan={status.sukses} />

      <Teks
        label="Saldo awal (Rp)"
        nama="saldoAwal"
        tipe="text"
        inputMode="numeric"
        nilaiAwal={v("saldoAwal", saldoAwal)}
      />
      <AreaTeks label="Catatan bendahara" nama="catatan" baris={3} nilaiAwal={v("catatan", catatan)} />
      <TombolSimpan label="Simpan perubahan" />
    </form>
  );
}
