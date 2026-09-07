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

import { simpanPengaturan, type Hasil } from "./aksi";

export default function FormPengaturan({
  awal,
}: {
  awal: {
    namaKampung: string;
    kelurahan: string;
    kemantren: string;
    kota: string;
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
}) {
  const [status, aksi] = useActionState<Hasil, FormData>(simpanPengaturan, {});
  const v = pembacaNilai(status.nilai);

  return (
    <form action={aksi} className="space-y-5">
      <PesanGalat pesan={status.galat} />
      <PesanSukses pesan={status.sukses} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Teks
          label="Nama kampung"
          nama="namaKampung"
          wajib
          nilaiAwal={v("namaKampung", awal.namaKampung)}
          keterangan="Menaungi RW 01, RW 02, dan RW 03. Tampil di kop seluruh halaman."
        />
        <Teks
          label="Tagline"
          nama="tagline"
          nilaiAwal={v("tagline", awal.tagline)}
          placeholder="Guyub Rukun, Warga Maju"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Teks label="Kelurahan" nama="kelurahan" nilaiAwal={v("kelurahan", awal.kelurahan)} />
        <Teks label="Kemantren" nama="kemantren" nilaiAwal={v("kemantren", awal.kemantren)} />
        <Teks label="Kota" nama="kota" nilaiAwal={v("kota", awal.kota)} />
      </div>

      <AreaTeks
        label="Deskripsi singkat"
        nama="deskripsi"
        baris={3}
        nilaiAwal={v("deskripsi", awal.deskripsi)}
        keterangan="Tampil pada beranda kampung. Tiap RW punya deskripsinya sendiri."
      />

      <AreaTeks
        label="Sejarah kampung"
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
        <Teks label="Alamat sekretariat" nama="alamat" nilaiAwal={v("alamat", awal.alamat)} />
        <Teks label="Telepon" nama="telepon" nilaiAwal={v("telepon", awal.telepon)} />
        <Teks label="Surel" nama="email" tipe="email" nilaiAwal={v("email", awal.email)} />
      </div>

      <Berkas
        label="Foto utama beranda"
        nama="heroFoto"
        pratinjau={awal.heroFoto}
        keterangan="Opsional. Gambar sambutan beranda kampung."
      />

      <div className="border-t border-slate-100 pt-5">
        <TombolSimpan label="Simpan pengaturan kampung" />
      </div>
    </form>
  );
}
