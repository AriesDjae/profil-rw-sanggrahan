"use client";

import { pembacaNilai } from "@/lib/formulir";

import { useActionState, useRef, useState } from "react";

import {
  Berkas,
  PesanGalat,
  PesanSukses,
  Pilihan,
  Teks,
  TombolSimpan,
} from "@/components/admin/Formulir";

import { simpanPengurus, type Hasil } from "./aksi";

export type PengurusAwal = {
  id: number;
  nama: string;
  jabatan: string;
  level: string;
  rtId: number | null;
  telepon: string | null;
  periode: string | null;
  urutan: number;
  foto: string | null;
} | null;

export default function FormPengurus({
  awal,
  rtList,
}: {
  awal?: PengurusAwal;
  rtList: { id: number; nama: string }[];
}) {
  const [status, aksi] = useActionState<Hasil, FormData>(simpanPengurus, {});
  const v = pembacaNilai(status.nilai);
  const levelAwal = String(v("level", awal?.level ?? "RW"));
  const [level, setLevel] = useState(levelAwal);
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

      <Teks label="Nama" nama="nama" wajib nilaiAwal={v("nama", awal?.nama)} />
      <Teks
        label="Jabatan"
        nama="jabatan"
        wajib
        nilaiAwal={v("jabatan", awal?.jabatan)}
        placeholder="Contoh: Seksi Keamanan & Ketertiban"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="level" className="mb-1.5 block text-sm font-medium text-slate-700">
            Tingkat
          </label>
          <select
            key={levelAwal}
            id="level"
            name="level"
            defaultValue={levelAwal}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          >
            <option value="RW">Pengurus RW</option>
            <option value="RT">Ketua / Pengurus RT</option>
            <option value="LEMBAGA">Lembaga (PKK, Karang Taruna, dll.)</option>
          </select>
        </div>

        {level === "RT" ? (
          <Pilihan
            label="Rukun Tetangga"
            nama="rtId"
            kosong="Pilih RT"
            nilaiAwal={v("rtId", awal?.rtId)}
            opsi={rtList.map((r) => ({ nilai: r.id, label: r.nama }))}
          />
        ) : (
          <Teks label="Periode" nama="periode" nilaiAwal={v("periode", awal?.periode)} placeholder="2024 - 2027" />
        )}
      </div>

      {level === "RT" && (
        <Teks label="Periode" nama="periode" nilaiAwal={v("periode", awal?.periode)} placeholder="2024 - 2027" />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Teks label="Telepon" nama="telepon" nilaiAwal={v("telepon", awal?.telepon)} />
        <Teks
          label="Urutan tampil"
          nama="urutan"
          tipe="number"
          nilaiAwal={v("urutan", awal?.urutan ?? 0)}
          keterangan="Angka kecil tampil lebih dulu."
        />
      </div>

      <Berkas label="Foto" nama="foto" pratinjau={awal?.foto} />

      <TombolSimpan label={awal ? "Simpan perubahan" : "Tambah pengurus"} />
    </form>
  );
}
