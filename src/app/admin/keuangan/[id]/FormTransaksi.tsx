"use client";

import { pembacaNilai } from "@/lib/formulir";

import { useActionState, useRef, useState } from "react";

import {
  AreaTeks,
  Berkas,
  PesanGalat,
  PesanSukses,
  Pilihan,
  Teks,
  TombolSimpan,
} from "@/components/admin/Formulir";
import { KATEGORI_PEMASUKAN, KATEGORI_PENGELUARAN } from "@/lib/konstanta";

import { tambahTransaksi, type Hasil } from "../aksi";

export default function FormTransaksi({
  laporanId,
  tanggalAwal,
}: {
  laporanId: number;
  tanggalAwal: string;
}) {
  const [status, aksi] = useActionState<Hasil, FormData>(tambahTransaksi, {});
  const v = pembacaNilai(status.nilai);
  const jenisAwal = (String(v("jenis", "PEMASUKAN")) === "PENGELUARAN"
    ? "PENGELUARAN"
    : "PEMASUKAN") as "PEMASUKAN" | "PENGELUARAN";
  const [jenis, setJenis] = useState<"PEMASUKAN" | "PENGELUARAN">(jenisAwal);
  const formRef = useRef<HTMLFormElement>(null);

  const kategori = jenis === "PEMASUKAN" ? KATEGORI_PEMASUKAN : KATEGORI_PENGELUARAN;

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await aksi(fd);
        formRef.current?.reset();
      }}
      className="space-y-5"
    >
      <input type="hidden" name="laporanId" value={laporanId} />

      <PesanGalat pesan={status.galat} />
      <PesanSukses pesan={status.sukses} />

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">Jenis transaksi</legend>
        <div className="grid grid-cols-2 gap-3">
          {(["PEMASUKAN", "PENGELUARAN"] as const).map((j) => (
            <label
              key={j}
              className={`cursor-pointer rounded-xl border px-4 py-3 text-center text-sm font-semibold transition ${
                jenis === j
                  ? j === "PEMASUKAN"
                    ? "border-seri-1 bg-blue-50 text-seri-1"
                    : "border-seri-2 bg-orange-50 text-seri-2"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              <input
                key={jenisAwal}
                type="radio"
                name="jenis"
                value={j}
                defaultChecked={jenisAwal === j}
                onChange={() => setJenis(j)}
                className="sr-only"
              />
              {j === "PEMASUKAN" ? "Pemasukan" : "Pengeluaran"}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Teks label="Tanggal" nama="tanggal" tipe="date" wajib nilaiAwal={v("tanggal", tanggalAwal)} />
        <Teks
          label="Jumlah (Rp)"
          nama="jumlah"
          tipe="text"
          inputMode="numeric"
          wajib
          placeholder="150000"
        nilaiAwal={v("jumlah")}
      />
      </div>

      <Pilihan
        label="Kategori"
        nama="kategori"
        wajib
        opsi={kategori.map((k) => ({ nilai: k, label: k }))}
        nilaiAwal={v("kategori")}
      />

      <AreaTeks
        label="Keterangan"
        nama="keterangan"
        wajib
        baris={2}
        placeholder="Contoh: Iuran rutin 28 KK bulan September"
        nilaiAwal={v("keterangan")}
      />

      <Berkas
        label="Bukti (opsional)"
        nama="bukti"
        terima="image/*,application/pdf"
        keterangan="Foto nota atau bukti transfer. Foto maksimal 12 MB dan dikecilkan otomatis, PDF maksimal 4 MB."
      />

      <TombolSimpan label="Tambahkan transaksi" labelProses="Menyimpan..." />
    </form>
  );
}
