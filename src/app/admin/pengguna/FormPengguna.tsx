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
import {
  LABEL_PERAN,
  PERAN,
  PERAN_TERIKAT_RT,
  PERAN_TERIKAT_RW,
  type Peran,
} from "@/lib/konstanta";

import { simpanPengguna, type Hasil } from "./aksi";

export type PenggunaAwal = {
  id: number;
  nama: string;
  email: string;
  peran: string;
  rwId: number | null;
  rtId: number | null;
  jabatan: string | null;
  telepon: string | null;
  aktif: boolean;
} | null;

export default function FormPengguna({
  awal,
  rwList,
  rtList,
  bolehAngkatAdmin,
  rwTerkunci,
}: {
  awal?: PenggunaAwal;
  rwList: { id: number; nomor: number; nama: string }[];
  rtList: { id: number; rwId: number; nama: string }[];
  /** Hanya administrator kampung yang boleh membuat administrator lain. */
  bolehAngkatAdmin: boolean;
  /** Diisi bila pengelolanya Ketua RW: RW-nya tidak bisa dipilih, hanya ditampilkan. */
  rwTerkunci: { id: number; nama: string } | null;
}) {
  const [status, aksi] = useActionState<Hasil, FormData>(simpanPengguna, {});
  const v = pembacaNilai(status.nilai);
  const c = pembacaCentang(status.nilai);
  const peranAwal = String(v("peran", awal?.peran ?? PERAN.SEKRETARIS));
  const [peran, setPeran] = useState<string>(peranAwal);

  const rwPilihanAwal = String(v("rwId", awal?.rwId ?? rwTerkunci?.id ?? rwList[0]?.id ?? ""));
  const [rwId, setRwId] = useState<string>(rwPilihanAwal);

  const butuhRt = PERAN_TERIKAT_RT.includes(peran as Peran);
  const butuhRw = PERAN_TERIKAT_RW.includes(peran as Peran);

  const peranTersedia = Object.values(PERAN).filter(
    (p) => bolehAngkatAdmin || p !== PERAN.ADMIN,
  );

  // RT dari RW lain tidak pernah ditawarkan: akun yang terlanjur terhubung ke
  // sana akan melihat kas RW lain, dan pembuatnya sendiri tak bisa mengoreksinya.
  const rtTersedia = rtList.filter((r) => String(r.rwId) === rwId);

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
          {peranTersedia.map((p) => (
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
                  : "Berwenang lintas RW: seluruh isi ketiga RW, akun, dan pengaturan kampung."}
        </p>
      </div>

      {butuhRw &&
        (rwTerkunci ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
            <input type="hidden" name="rwId" value={rwTerkunci.id} />
            <p className="text-sm font-medium text-slate-700">
              Rukun Warga: {rwTerkunci.nama}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Anda hanya dapat membuat akun untuk {rwTerkunci.nama}. Akun untuk RW lain
              dibuat oleh pengurus RW tersebut atau oleh administrator kampung.
            </p>
          </div>
        ) : (
          <div>
            <label htmlFor="rwId" className="mb-1.5 block text-sm font-medium text-slate-700">
              Rukun Warga <span className="text-rose-600">*</span>
            </label>
            <select
              key={rwPilihanAwal}
              id="rwId"
              name="rwId"
              defaultValue={rwPilihanAwal}
              onChange={(e) => setRwId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            >
              {rwList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nama}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-500">
              Akun ini hanya akan melihat dan mengubah data RW tersebut.
            </p>
          </div>
        ))}

      {butuhRt && (
        <Pilihan
          label="Rukun Tetangga"
          nama="rtId"
          wajib
          kosong="Pilih RT"
          nilaiAwal={v("rtId", awal?.rtId)}
          opsi={rtTersedia.map((r) => ({ nilai: r.id, label: r.nama }))}
          keterangan="Hanya RT di dalam RW yang dipilih di atas."
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
