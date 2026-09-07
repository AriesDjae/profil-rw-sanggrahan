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

import PilihRw, { type OpsiRw } from "@/components/admin/PilihRw";
import { LEVEL_PENGURUS } from "@/lib/konstanta";

import { simpanPengurus, type Hasil } from "./aksi";

export type PengurusAwal = {
  id: number;
  nama: string;
  jabatan: string;
  level: string;
  rwId: number | null;
  rtId: number | null;
  telepon: string | null;
  periode: string | null;
  urutan: number;
  foto: string | null;
} | null;

export default function FormPengurus({
  awal,
  rtList,
  rwList,
  rwTerkunci,
  bolehTingkatKampung,
}: {
  awal?: PengurusAwal;
  rtList: { id: number; rwId: number; nama: string }[];
  rwList: OpsiRw[];
  rwTerkunci: OpsiRw | null;
  /** Kepengurusan yang menaungi ketiga RW hanya disusun administrator kampung. */
  bolehTingkatKampung: boolean;
}) {
  const [status, aksi] = useActionState<Hasil, FormData>(simpanPengurus, {});
  const v = pembacaNilai(status.nilai);
  const levelAwal = String(v("level", awal?.level ?? LEVEL_PENGURUS.RW));
  const [level, setLevel] = useState(levelAwal);
  const rwAwal = String(v("rwId", awal?.rwId ?? rwTerkunci?.id ?? ""));
  const [rwId, setRwId] = useState(rwAwal);
  const ref = useRef<HTMLFormElement>(null);

  const tingkatKampung = level === LEVEL_PENGURUS.KAMPUNG;
  // RT dari RW lain tidak ditawarkan: namanya akan muncul di laman RW yang
  // bukan tempatnya bertugas.
  const rtTersedia = rwId ? rtList.filter((r) => String(r.rwId) === rwId) : rtList;

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

      {!tingkatKampung && (
        <PilihRw
          rwList={rwList}
          rwTerkunci={rwTerkunci}
          nilaiAwal={rwAwal || null}
          bolehKampung={false}
          onGanti={setRwId}
          keterangan="Pengurus ini tampil pada halaman profil RW tersebut."
        />
      )}

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
            {bolehTingkatKampung && (
              <option value={LEVEL_PENGURUS.KAMPUNG}>
                Tingkat kampung (menaungi ketiga RW)
              </option>
            )}
            <option value={LEVEL_PENGURUS.RW}>Pengurus RW</option>
            <option value={LEVEL_PENGURUS.RT}>Ketua / Pengurus RT</option>
            <option value="LEMBAGA">Lembaga (PKK, Karang Taruna, dll.)</option>
          </select>
        </div>

        {level === LEVEL_PENGURUS.RT ? (
          <Pilihan
            label="Rukun Tetangga"
            nama="rtId"
            kosong="Pilih RT"
            nilaiAwal={v("rtId", awal?.rtId)}
            opsi={rtTersedia.map((r) => ({ nilai: r.id, label: r.nama }))}
          />
        ) : (
          <Teks label="Periode" nama="periode" nilaiAwal={v("periode", awal?.periode)} placeholder="2024 - 2027" />
        )}
      </div>

      {level === LEVEL_PENGURUS.RT && (
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
