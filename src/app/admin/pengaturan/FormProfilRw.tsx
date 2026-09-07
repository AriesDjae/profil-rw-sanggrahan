"use client";

import { pembacaNilai } from "@/lib/formulir";

import { useActionState } from "react";

import {
  AreaTeks,
  Berkas,
  PesanGalat,
  PesanSukses,
  Teks,
  TombolSimpan,
} from "@/components/admin/Formulir";

import { simpanProfilRw, type Hasil } from "./aksi";

export type ProfilRwAwal = {
  id: number;
  nomor: number;
  nama: string;
  tagline: string;
  deskripsi: string;
  sejarah: string;
  visi: string;
  misi: string;
  alamat: string;
  telepon: string;
  email: string;
  heroFoto: string | null;
};

/**
 * Profil satu RW — inilah isi laman /rw/1, /rw/2, /rw/3.
 *
 * Nomor RW sengaja tidak dapat disunting: ia sudah tertanam di alamat halaman,
 * di tautan yang beredar di grup warga, dan di penomoran RT di bawahnya.
 */
export default function FormProfilRw({ awal }: { awal: ProfilRwAwal }) {
  const [status, aksi] = useActionState<Hasil, FormData>(simpanProfilRw, {});
  const v = pembacaNilai(status.nilai);

  return (
    <form action={aksi} className="space-y-5">
      <input type="hidden" name="id" value={awal.id} />
      <PesanGalat pesan={status.galat} />
      <PesanSukses pesan={status.sukses} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Teks
          label="Nama RW"
          nama="nama"
          wajib
          nilaiAwal={v("nama", awal.nama)}
          keterangan={`Laman publiknya tetap di /rw/${awal.nomor}.`}
        />
        <Teks
          label="Tagline RW"
          nama="tagline"
          nilaiAwal={v("tagline", awal.tagline)}
          placeholder="Guyub Rukun, Warga Maju"
        />
      </div>

      <AreaTeks
        label="Deskripsi singkat"
        nama="deskripsi"
        baris={3}
        nilaiAwal={v("deskripsi", awal.deskripsi)}
        keterangan="Tampil pada sambutan laman RW ini dan pada kartunya di beranda kampung."
      />

      <AreaTeks
        label="Sejarah RW"
        nama="sejarah"
        baris={10}
        nilaiAwal={v("sejarah", awal.sejarah)}
        keterangan="Pisahkan antarparagraf dengan satu baris kosong."
      />

      <AreaTeks label="Visi" nama="visi" baris={3} nilaiAwal={v("visi", awal.visi)} />

      <AreaTeks
        label="Misi"
        nama="misi"
        baris={7}
        nilaiAwal={v("misi", awal.misi)}
        keterangan="Tulis satu poin misi per baris. Penomoran dibuat otomatis."
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <Teks label="Alamat sekretariat RW" nama="alamat" nilaiAwal={v("alamat", awal.alamat)} />
        <Teks label="Telepon" nama="telepon" nilaiAwal={v("telepon", awal.telepon)} />
        <Teks label="Surel" nama="email" tipe="email" nilaiAwal={v("email", awal.email)} />
      </div>

      <Berkas
        label="Foto utama laman RW"
        nama="heroFoto"
        pratinjau={awal.heroFoto}
        keterangan="Opsional. Tampil sebagai gambar sambutan di laman RW ini."
      />

      <div className="border-t border-slate-100 pt-5">
        <TombolSimpan label={`Simpan profil ${awal.nama}`} />
      </div>
    </form>
  );
}
