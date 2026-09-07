"use client";

import { Bidang } from "@/components/admin/Formulir";

export type OpsiRw = { id: number; nama: string };

/**
 * Pemilih pemilik sebuah tulisan: satu RW, atau seluruh kampung.
 *
 * Dipakai berita, kegiatan, pengumuman, galeri, dan pengurus — kelimanya
 * memakai aturan yang sama, jadi bidangnya dikumpulkan di satu berkas supaya
 * kalimat penjelasnya tidak berbeda-beda dari satu formulir ke formulir lain.
 *
 * Pengurus RW tidak diberi pilihan sama sekali: tulisannya selalu jatuh di
 * RW-nya. Yang menjaganya bukan komponen ini melainkan server action, tetapi
 * menampilkan pilihan yang pasti ditolak hanya membuat orang mengira ia boleh.
 */
export default function PilihRw({
  rwList,
  rwTerkunci,
  nilaiAwal,
  bolehKampung = true,
  keterangan,
  onGanti,
}: {
  rwList: OpsiRw[];
  /** Diisi bila penggunanya terikat satu RW. */
  rwTerkunci: OpsiRw | null;
  nilaiAwal?: number | string | null;
  /** Pilihan "seluruh kampung" (rwId kosong). */
  bolehKampung?: boolean;
  keterangan?: string;
  /** Dipanggil saat pilihan berubah — dipakai formulir yang menyaring daftar RT. */
  onGanti?: (rwId: string) => void;
}) {
  if (rwTerkunci) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
        <p className="text-xs font-medium text-slate-500">Tampil di</p>
        <p className="mt-0.5 text-sm font-semibold text-slate-900">{rwTerkunci.nama}</p>
        <p className="mt-1 text-xs text-slate-500">
          Warga RW lain tidak melihatnya. Untuk kabar yang menyangkut ketiga RW,
          mintakan kepada administrator kampung.
        </p>
      </div>
    );
  }

  return (
    <Bidang
      label="Tampil di"
      nama="rwId"
      keterangan={
        keterangan ??
        "Pilih satu RW, atau seluruh kampung bila isinya menyangkut ketiga RW sekaligus."
      }
      anak={
        <select
          id="rwId"
          name="rwId"
          defaultValue={nilaiAwal == null ? "" : String(nilaiAwal)}
          onChange={(e) => onGanti?.(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        >
          {bolehKampung && <option value="">Seluruh kampung (ketiga RW)</option>}
          {rwList.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nama}
            </option>
          ))}
        </select>
      }
    />
  );
}
