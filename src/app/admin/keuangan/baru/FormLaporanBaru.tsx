"use client";

import { pembacaNilai } from "@/lib/formulir";

import Link from "next/link";

import { useActionState } from "react";

import {
  AreaTeks,
  PesanGalat,
  Pilihan,
  Teks,
  TombolSimpan,
} from "@/components/admin/Formulir";
import { NAMA_BULAN } from "@/lib/konstanta";

import { buatLaporan, type Hasil } from "../aksi";

export default function FormLaporanBaru({
  rtList,
  rtTerkunci,
  saldoUsulan,
  bulanUsulan,
  tahunUsulan,
}: {
  rtList: { id: number; nama: string }[];
  rtTerkunci: { id: number; nama: string } | null;
  saldoUsulan: number;
  bulanUsulan: number;
  tahunUsulan: number;
}) {
  const [status, aksi] = useActionState<Hasil, FormData>(buatLaporan, {});
  const v = pembacaNilai(status.nilai);
  const tahunOpsi = [tahunUsulan - 1, tahunUsulan, tahunUsulan + 1];

  return (
    <form action={aksi} className="space-y-5">
      <PesanGalat pesan={status.galat} />

      {rtTerkunci ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium text-slate-500">Kas milik</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">{rtTerkunci.nama}</p>
        </div>
      ) : (
        <Pilihan
          label="Rukun Tetangga"
          nama="rtId"
          wajib
          kosong="Pilih RT"
          opsi={rtList.map((r) => ({ nilai: r.id, label: r.nama }))}
          keterangan="Kas dikelola per RT; rekapitulasi tingkat RW dihitung otomatis."
        nilaiAwal={v("rtId")}
      />
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Pilihan
          label="Bulan"
          nama="bulan"
          wajib
          nilaiAwal={v("bulan", bulanUsulan)}
          opsi={NAMA_BULAN.map((b, i) => ({ nilai: i + 1, label: b }))}
        />
        <Pilihan
          label="Tahun"
          nama="tahun"
          wajib
          nilaiAwal={v("tahun", tahunUsulan)}
          opsi={tahunOpsi.map((t) => ({ nilai: t, label: String(t) }))}
        />
      </div>

      <Teks
        label="Saldo awal (Rp)"
        nama="saldoAwal"
        tipe="text"
        inputMode="numeric"
        nilaiAwal={v("saldoAwal", saldoUsulan)}
        keterangan={
          saldoUsulan > 0
            ? "Terisi otomatis dari saldo akhir laporan sebelumnya yang tercatat. Ubah bila perlu."
            : "Isi saldo kas pada awal periode. Kosongkan bila memulai dari nol."
        }
      />

      <AreaTeks
        label="Catatan bendahara (opsional)"
        nama="catatan"
        baris={3}
        placeholder="Misalnya: dua KK belum menyetorkan iuran bulan ini."
        keterangan="Catatan ini terbaca oleh Ketua RT dan Ketua RW saat memeriksa laporan."
        nilaiAwal={v("catatan")}
      />

      <div className="flex items-center gap-3 pt-2">
        <TombolSimpan label="Buat laporan" labelProses="Membuat..." />
        <Link
          href="/admin/keuangan"
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
