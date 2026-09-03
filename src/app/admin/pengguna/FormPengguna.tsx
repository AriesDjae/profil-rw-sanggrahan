"use client";

import { pembacaCentang, pembacaNilai } from "@/lib/formulir";

import { useActionState, useState } from "react";

import {
  Centang,
  PesanGalat,
  Pilihan,
  Teks,
  TombolSimpan,
} from "@/components/admin/Formulir";
import { LABEL_PERAN, PERAN, PERAN_TERIKAT_RT, type Peran } from "@/lib/konstanta";

import { simpanPengguna, type Hasil } from "./aksi";

export type PenggunaAwal = {
  id: number;
  nama: string;
  email: string;
  peran: string;
  rtId: number | null;
  jabatan: string | null;
  telepon: string | null;
  aktif: boolean;
} | null;

export default function FormPengguna({
  awal,
  rtList,
}: {
  awal?: PenggunaAwal;
  rtList: { id: number; nama: string }[];
}) {
  const [status, aksi] = useActionState<Hasil, FormData>(simpanPengguna, {});
  const v = pembacaNilai(status.nilai);
  const c = pembacaCentang(status.nilai);
  const peranAwal = String(v("peran", awal?.peran ?? PERAN.SEKRETARIS));
  const [peran, setPeran] = useState<string>(peranAwal);

  const butuhRt = PERAN_TERIKAT_RT.includes(peran as Peran);

  return (
    <form action={aksi} className="space-y-4">
      {awal && <input type="hidden" name="id" value={awal.id} />}
      <PesanGalat pesan={status.galat} />

      <Teks label="Nama lengkap" nama="nama" wajib nilaiAwal={v("nama", awal?.nama)} />
      <Teks
        label="Surel"
        nama="email"
        tipe="email"
        wajib
        nilaiAwal={v("email", awal?.email)}
        keterangan="Dipakai untuk masuk ke panel pengurus."
      />

      <div>
        <label htmlFor="peran" className="mb-1.5 block text-sm font-medium text-slate-700">
          Peran <span className="text-rose-600">*</span>
        </label>
        <select
          key={peranAwal}
          id="peran"
          name="peran"
          defaultValue={peranAwal}
          onChange={(e) => setPeran(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        >
          {Object.values(PERAN).map((p) => (
            <option key={p} value={p}>
              {LABEL_PERAN[p]}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-slate-500">
          {peran === PERAN.BENDAHARA_RT
            ? "Menyusun dan mengajukan laporan kas RT-nya."
            : peran === PERAN.KETUA_RT
              ? "Memverifikasi laporan kas RT-nya sebelum diteruskan ke Ketua RW."
              : peran === PERAN.KETUA_RW
                ? "Memberi persetujuan akhir sehingga laporan tampil ke warga."
                : peran === PERAN.SEKRETARIS
                  ? "Mengelola berita, kegiatan, galeri, dan data warga."
                  : "Akses penuh termasuk pengelolaan akun dan pengaturan situs."}
        </p>
      </div>

      {butuhRt && (
        <Pilihan
          label="Rukun Tetangga"
          nama="rtId"
          wajib
          kosong="Pilih RT"
          nilaiAwal={v("rtId", awal?.rtId)}
          opsi={rtList.map((r) => ({ nilai: r.id, label: r.nama }))}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Teks
          label="Jabatan"
          nama="jabatan"
          nilaiAwal={v("jabatan", awal?.jabatan)}
          placeholder="Contoh: Ketua RT 03"
        />
        <Teks label="Telepon" nama="telepon" nilaiAwal={v("telepon", awal?.telepon)} />
      </div>

      <Teks
        label={awal ? "Kata sandi baru (opsional)" : "Kata sandi awal"}
        nama="kataSandi"
        tipe="password"
        wajib={!awal}
        keterangan={
          awal
            ? "Kosongkan bila tidak ingin mengubah kata sandi."
            : "Minimal 8 karakter. Sampaikan kepada pemilik akun untuk diganti setelah masuk."
        }
        nilaiAwal={v("kataSandi")}
      />

      <Centang
        label="Akun aktif"
        nama="aktif"
        nilaiAwal={c("aktif", awal?.aktif ?? true)}
        keterangan="Akun nonaktif tidak dapat masuk ke panel."
      />

      <TombolSimpan label={awal ? "Simpan perubahan" : "Buat akun"} />
    </form>
  );
}
