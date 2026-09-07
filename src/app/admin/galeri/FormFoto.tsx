"use client";

import { useActionState, useRef } from "react";

import {
  PesanGalat,
  PesanSukses,
  Teks,
  TombolSimpan,
} from "@/components/admin/Formulir";

import { tambahFoto, type Hasil } from "./aksi";

export default function FormFoto({ albumId }: { albumId: number }) {
  const [status, aksi] = useActionState<Hasil, FormData>(tambahFoto, {});
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      action={async (fd) => {
        await aksi(fd);
        ref.current?.reset();
      }}
      className="space-y-4"
    >
      <input type="hidden" name="albumId" value={albumId} />
      <PesanGalat pesan={status.galat} />
      <PesanSukses pesan={status.sukses} />

      <div>
        <label htmlFor="foto" className="mb-1.5 block text-sm font-medium text-slate-700">
          Pilih foto <span className="text-rose-600">*</span>
        </label>
        <input
          id="foto"
          name="foto"
          type="file"
          accept="image/*"
          multiple
          required
          className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
        />
        <p className="mt-1.5 text-xs text-slate-500">
          Dapat memilih beberapa foto sekaligus. Setiap berkas maksimal 12 MB dan dikecilkan otomatis.
        </p>
      </div>

      <Teks
        label="Keterangan foto (opsional)"
        nama="judul"
        placeholder="Berlaku untuk seluruh foto yang diunggah kali ini"
      />

      <TombolSimpan label="Unggah foto" labelProses="Mengunggah..." />
    </form>
  );
}
