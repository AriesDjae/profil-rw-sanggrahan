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
import { KATEGORI_BERITA, STATUS_KONTEN } from "@/lib/konstanta";

import { simpanBerita, type Hasil } from "./aksi";

export type BeritaAwal = {
  id: number;
  judul: string;
  ringkasan: string;
  konten: string;
  kategori: string;
  status: string;
  gambar: string | null;
} | null;

export default function FormBerita({ awal }: { awal: BeritaAwal }) {
  const [status, aksi] = useActionState<Hasil, FormData>(simpanBerita, {});
  const v = pembacaNilai(status.nilai);

  return (
    <form action={aksi} className="space-y-5">
      {awal && <input type="hidden" name="id" value={awal.id} />}
      <PesanGalat pesan={status.galat} />

      <Teks
        label="Judul berita"
        nama="judul"
        wajib
        nilaiAwal={v("judul", awal?.judul)}
        placeholder="Contoh: Kerja Bakti Serentak Bersihkan Saluran Air"
        keterangan="Tautan berita dibuat otomatis dari judul."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Pilihan
          label="Kategori"
          nama="kategori"
          nilaiAwal={v("kategori", awal?.kategori ?? "Umum")}
          opsi={KATEGORI_BERITA.map((k) => ({ nilai: k, label: k }))}
        />
        <Pilihan
          label="Status"
          nama="status"
          nilaiAwal={v("status", awal?.status ?? STATUS_KONTEN.DRAFT)}
          opsi={[
            { nilai: STATUS_KONTEN.DRAFT, label: "Draf (belum tampil ke warga)" },
            { nilai: STATUS_KONTEN.TERBIT, label: "Terbit (tampil ke warga)" },
          ]}
        />
      </div>

      <AreaTeks
        label="Ringkasan"
        nama="ringkasan"
        wajib
        baris={3}
        nilaiAwal={v("ringkasan", awal?.ringkasan)}
        keterangan="Satu sampai dua kalimat yang tampil pada kartu berita dan hasil pencarian."
      />

      <AreaTeks
        label="Isi berita"
        nama="konten"
        wajib
        baris={16}
        nilaiAwal={v("konten", awal?.konten)}
        keterangan="Pisahkan antarparagraf dengan satu baris kosong."
      />

      <Berkas
        label="Gambar utama"
        nama="gambar"
        pratinjau={awal?.gambar}
        keterangan="JPG, PNG, atau WEBP maksimal 4 MB. Biarkan kosong untuk mempertahankan gambar lama."
      />

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
        <TombolSimpan label={awal ? "Simpan perubahan" : "Simpan berita"} />
        <Link
          href="/admin/berita"
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
