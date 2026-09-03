"use client";

import { pembacaNilai } from "@/lib/formulir";

import Link from "next/link";
import { useActionState } from "react";

import {
  PesanGalat,
  Pilihan,
  Teks,
  TombolSimpan,
} from "@/components/admin/Formulir";
import {
  AGAMA,
  HUBUNGAN_KELUARGA,
  LABEL_HUBUNGAN,
  PEKERJAAN,
  PENDIDIKAN,
  STATUS_PERKAWINAN,
} from "@/lib/konstanta";

import { simpanWarga, type Hasil } from "./aksi";

export type WargaAwal = {
  id: number;
  nama: string;
  nik: string | null;
  noKk: string | null;
  jenisKelamin: string;
  tempatLahir: string | null;
  tanggalLahir: string;
  agama: string | null;
  pendidikan: string | null;
  pekerjaan: string | null;
  statusPerkawinan: string | null;
  hubungan: string;
  alamat: string | null;
  rtId: number;
} | null;

export default function FormWarga({
  awal,
  rtList,
  rtTerkunci,
}: {
  awal: WargaAwal;
  rtList: { id: number; nama: string }[];
  rtTerkunci: { id: number; nama: string } | null;
}) {
  const [status, aksi] = useActionState<Hasil, FormData>(simpanWarga, {});
  const v = pembacaNilai(status.nilai);

  return (
    <form action={aksi} className="space-y-5">
      {awal && <input type="hidden" name="id" value={awal.id} />}
      <PesanGalat pesan={status.galat} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Teks label="Nama lengkap" nama="nama" wajib nilaiAwal={v("nama", awal?.nama)} />
        <Pilihan
          label="Jenis kelamin"
          nama="jenisKelamin"
          wajib
          kosong="Pilih"
          nilaiAwal={v("jenisKelamin", awal?.jenisKelamin)}
          opsi={[
            { nilai: "L", label: "Laki-laki" },
            { nilai: "P", label: "Perempuan" },
          ]}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Teks
          label="NIK"
          nama="nik"
          nilaiAwal={v("nik", awal?.nik)}
          inputMode="numeric"
          placeholder="16 digit"
          keterangan="Opsional, namun harus unik bila diisi."
        />
        <Teks label="Nomor Kartu Keluarga" nama="noKk" nilaiAwal={v("noKk", awal?.noKk)} inputMode="numeric" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Teks label="Tempat lahir" nama="tempatLahir" nilaiAwal={v("tempatLahir", awal?.tempatLahir)} />
        <Teks
          label="Tanggal lahir"
          nama="tanggalLahir"
          tipe="date"
          nilaiAwal={v("tanggalLahir", awal?.tanggalLahir)}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {rtTerkunci ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">Rukun Tetangga</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">{rtTerkunci.nama}</p>
            <input type="hidden" name="rtId" value={rtTerkunci.id} />
          </div>
        ) : (
          <Pilihan
            label="Rukun Tetangga"
            nama="rtId"
            wajib
            kosong="Pilih RT"
            nilaiAwal={v("rtId", awal?.rtId)}
            opsi={rtList.map((r) => ({ nilai: r.id, label: r.nama }))}
          />
        )}
        <Pilihan
          label="Hubungan dalam keluarga"
          nama="hubungan"
          nilaiAwal={v("hubungan", awal?.hubungan ?? "ANGGOTA")}
          opsi={HUBUNGAN_KELUARGA.map((h) => ({ nilai: h, label: LABEL_HUBUNGAN[h] ?? h }))}
        />
      </div>

      <Teks label="Alamat" nama="alamat" nilaiAwal={v("alamat", awal?.alamat)} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Pilihan
          label="Agama"
          nama="agama"
          kosong="Tidak diisi"
          nilaiAwal={v("agama", awal?.agama)}
          opsi={AGAMA.map((a) => ({ nilai: a, label: a }))}
        />
        <Pilihan
          label="Status perkawinan"
          nama="statusPerkawinan"
          kosong="Tidak diisi"
          nilaiAwal={v("statusPerkawinan", awal?.statusPerkawinan)}
          opsi={STATUS_PERKAWINAN.map((s) => ({ nilai: s, label: s }))}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Pilihan
          label="Pendidikan"
          nama="pendidikan"
          kosong="Tidak diisi"
          nilaiAwal={v("pendidikan", awal?.pendidikan)}
          opsi={PENDIDIKAN.map((p) => ({ nilai: p, label: p }))}
        />
        <Pilihan
          label="Pekerjaan"
          nama="pekerjaan"
          kosong="Tidak diisi"
          nilaiAwal={v("pekerjaan", awal?.pekerjaan)}
          opsi={PEKERJAAN.map((p) => ({ nilai: p, label: p }))}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
        <TombolSimpan label={awal ? "Simpan perubahan" : "Tambah warga"} />
        <Link
          href="/admin/warga"
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
