"use client";

import { useFormStatus } from "react-dom";

const KELAS_INPUT =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 disabled:bg-slate-50 disabled:text-slate-500";

export function Bidang({
  label,
  nama,
  keterangan,
  wajib,
  anak,
}: {
  label: string;
  nama: string;
  keterangan?: string;
  wajib?: boolean;
  anak: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={nama} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {wajib && <span className="ml-1 text-rose-600">*</span>}
      </label>
      {anak}
      {keterangan && <p className="mt-1.5 text-xs text-slate-500">{keterangan}</p>}
    </div>
  );
}

export function Teks({
  label,
  nama,
  keterangan,
  wajib,
  tipe = "text",
  nilaiAwal,
  placeholder,
  ...sisa
}: {
  label: string;
  nama: string;
  keterangan?: string;
  wajib?: boolean;
  tipe?: string;
  nilaiAwal?: string | number | null;
  placeholder?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Bidang
      label={label}
      nama={nama}
      keterangan={keterangan}
      wajib={wajib}
      anak={
        <input
          id={nama}
          name={nama}
          type={tipe}
          required={wajib}
          defaultValue={nilaiAwal ?? undefined}
          placeholder={placeholder}
          className={KELAS_INPUT}
          {...sisa}
        />
      }
    />
  );
}

export function AreaTeks({
  label,
  nama,
  keterangan,
  wajib,
  nilaiAwal,
  baris = 5,
  placeholder,
}: {
  label: string;
  nama: string;
  keterangan?: string;
  wajib?: boolean;
  nilaiAwal?: string | number | null;
  baris?: number;
  placeholder?: string;
}) {
  return (
    <Bidang
      label={label}
      nama={nama}
      keterangan={keterangan}
      wajib={wajib}
      anak={
        <textarea
          id={nama}
          name={nama}
          rows={baris}
          required={wajib}
          defaultValue={nilaiAwal ?? undefined}
          placeholder={placeholder}
          className={`${KELAS_INPUT} leading-relaxed`}
        />
      }
    />
  );
}

export function Pilihan({
  label,
  nama,
  opsi,
  keterangan,
  wajib,
  nilaiAwal,
  kosong,
  disabled,
}: {
  label: string;
  nama: string;
  opsi: { nilai: string | number; label: string }[];
  keterangan?: string;
  wajib?: boolean;
  nilaiAwal?: string | number | null;
  kosong?: string;
  disabled?: boolean;
}) {
  return (
    <Bidang
      label={label}
      nama={nama}
      keterangan={keterangan}
      wajib={wajib}
      anak={
        <select
          key={String(nilaiAwal ?? "")}
          id={nama}
          name={nama}
          required={wajib}
          disabled={disabled}
          defaultValue={nilaiAwal ?? ""}
          className={KELAS_INPUT}
        >
          {kosong && <option value="">{kosong}</option>}
          {opsi.map((o) => (
            <option key={o.nilai} value={o.nilai}>
              {o.label}
            </option>
          ))}
        </select>
      }
    />
  );
}

export function Berkas({
  label,
  nama,
  keterangan,
  terima = "image/*",
  pratinjau,
}: {
  label: string;
  nama: string;
  keterangan?: string;
  terima?: string;
  pratinjau?: string | null;
}) {
  return (
    <Bidang
      label={label}
      nama={nama}
      keterangan={keterangan}
      anak={
        <div className="flex items-center gap-4">
          {pratinjau && (
            <img
              src={pratinjau}
              alt=""
              className="h-16 w-24 shrink-0 rounded-lg border border-slate-200 object-cover"
            />
          )}
          <input
            id={nama}
            name={nama}
            type="file"
            accept={terima}
            className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
          />
        </div>
      }
    />
  );
}

export function Centang({
  label,
  nama,
  keterangan,
  nilaiAwal,
}: {
  label: string;
  nama: string;
  keterangan?: string;
  nilaiAwal?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
      <input
        key={String(nilaiAwal)}
        id={nama}
        name={nama}
        type="checkbox"
        defaultChecked={nilaiAwal}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
      />
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {keterangan && <span className="mt-0.5 block text-xs text-slate-500">{keterangan}</span>}
      </span>
    </label>
  );
}

export function TombolSimpan({
  label = "Simpan",
  labelProses = "Menyimpan...",
  gaya = "utama",
}: {
  label?: string;
  labelProses?: string;
  gaya?: "utama" | "bahaya" | "netral";
}) {
  const { pending } = useFormStatus();
  const kelas = {
    utama: "bg-brand-600 text-white hover:bg-brand-700",
    bahaya: "bg-rose-600 text-white hover:bg-rose-700",
    netral: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  }[gaya];

  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${kelas}`}
    >
      {pending ? labelProses : label}
    </button>
  );
}

export function PesanGalat({ pesan }: { pesan?: string | null }) {
  if (!pesan) return null;
  return (
    <p
      role="alert"
      className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
    >
      {pesan}
    </p>
  );
}

export function PesanSukses({ pesan }: { pesan?: string | null }) {
  if (!pesan) return null;
  return (
    <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
      {pesan}
    </p>
  );
}
