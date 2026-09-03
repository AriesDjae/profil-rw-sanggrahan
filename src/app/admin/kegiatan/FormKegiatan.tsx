"use client";

import { pembacaNilai } from "@/lib/formulir";

import Link from "next/link";
import { useActionState } from "react";

import {
  AreaTeks,
  Berkas,
  PesanGalat,
  Pilihan,
  Teks,
  TombolSimpan,
} from "@/components/admin/Formulir";
import { KATEGORI_KEGIATAN } from "@/lib/konstanta";

import { simpanKegiatan, type Hasil } from "./aksi";

export type KegiatanAwal = {
  id: number;
  judul: string;
  deskripsi: string;
  mulai: string;
  selesai: string;
  lokasi: string;
  penyelenggara: string | null;
  kategori: string;
  kontak: string | null;
  status: string;
  gambar: string | null;
} | null;

export default function FormKegiatan({ awal }: { awal: KegiatanAwal }) {
  const [status, aksi] = useActionState<Hasil, FormData>(simpanKegiatan, {});
  const v = pembacaNilai(status.nilai);

  return (
    <form action={aksi} className="space-y-5">
      {awal && <input type="hidden" name="id" value={awal.id} />}
      <PesanGalat pesan={status.galat} />

      <Teks
        label="Nama kegiatan"
        nama="judul"
        wajib
        nilaiAwal={v("judul", awal?.judul)}
        placeholder="Contoh: Kerja Bakti Pengecatan Pos Ronda"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Teks
          label="Waktu mulai"
          nama="mulai"
          tipe="datetime-local"
          wajib
          nilaiAwal={v("mulai", awal?.mulai)}
        />
        <Teks
          label="Waktu selesai (opsional)"
          nama="selesai"
          tipe="datetime-local"
          nilaiAwal={v("selesai", awal?.selesai)}
        />
      </div>

      <Teks
        label="Lokasi"
        nama="lokasi"
        wajib
        nilaiAwal={v("lokasi", awal?.lokasi)}
        placeholder="Contoh: Balai RW 05"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Teks
          label="Penyelenggara"
          nama="penyelenggara"
          nilaiAwal={v("penyelenggara", awal?.penyelenggara)}
          placeholder="Contoh: Karang Taruna RW 05"
        />
        <Teks
          label="Kontak panitia"
          nama="kontak"
          nilaiAwal={v("kontak", awal?.kontak)}
          placeholder="Contoh: Sekretariat RW 0812-3456-7890"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Pilihan
          label="Kategori"
          nama="kategori"
          nilaiAwal={v("kategori", awal?.kategori ?? "Umum")}
          opsi={KATEGORI_KEGIATAN.map((k) => ({ nilai: k, label: k }))}
        />
        <Pilihan
          label="Status"
          nama="status"
          nilaiAwal={v("status", awal?.status ?? "DRAFT")}
          opsi={[
            { nilai: "DRAFT", label: "Draf (belum tampil)" },
            { nilai: "TERBIT", label: "Terbit (tampil di agenda)" },
            { nilai: "SELESAI", label: "Selesai (masuk arsip)" },
            { nilai: "BATAL", label: "Batal" },
          ]}
        />
      </div>

      <AreaTeks
        label="Keterangan kegiatan"
        nama="deskripsi"
        wajib
        baris={8}
        nilaiAwal={v("deskripsi", awal?.deskripsi)}
        keterangan="Jelaskan rangkaian acara, apa yang perlu dibawa warga, dan ketentuan lainnya."
      />

      <Berkas
        label="Gambar kegiatan"
        nama="gambar"
        pratinjau={awal?.gambar}
        keterangan="Opsional. Biarkan kosong untuk mempertahankan gambar lama."
      />

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
        <TombolSimpan label={awal ? "Simpan perubahan" : "Simpan kegiatan"} />
        <Link
          href="/admin/kegiatan"
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
