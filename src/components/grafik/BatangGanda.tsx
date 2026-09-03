"use client";

import { useState } from "react";

import { rupiah } from "@/lib/format";

export type KelompokBatang = {
  label: string;
  seri1: number;
  seri2: number;
  sublabel?: string;
};

/**
 * Dua seri berdampingan per kelompok (mis. pemasukan vs pengeluaran per bulan).
 * Warna biru/oranye dipilih karena tetap terbedakan bagi pembaca buta warna;
 * identitas seri juga ditegaskan lewat legenda dan tabel data.
 */
export default function BatangGanda({
  data,
  judul,
  keterangan,
  namaSeri1 = "Pemasukan",
  namaSeri2 = "Pengeluaran",
}: {
  data: KelompokBatang[];
  judul: string;
  keterangan?: string;
  namaSeri1?: string;
  namaSeri2?: string;
}) {
  const [sorot, setSorot] = useState<{ i: number; seri: 1 | 2 } | null>(null);
  const maks = Math.max(1, ...data.flatMap((d) => [d.seri1, d.seri2]));

  return (
    <figure className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <figcaption className="text-sm font-semibold text-slate-900">{judul}</figcaption>
          {keterangan && <p className="mt-1 text-xs text-slate-500">{keterangan}</p>}
        </div>
        <ul className="flex items-center gap-4 text-xs text-slate-600">
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-seri-1" />
            {namaSeri1}
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-seri-2" />
            {namaSeri2}
          </li>
        </ul>
      </div>

      <div className="relative mt-6">
        <div className="flex h-52 items-end gap-3 border-b border-slate-200 sm:gap-5">
          {data.map((d, i) => (
            <div key={d.label} className="flex h-full flex-1 flex-col justify-end">
              <div className="flex h-full items-end justify-center gap-[3px]">
                {([1, 2] as const).map((seri) => {
                  const nilai = seri === 1 ? d.seri1 : d.seri2;
                  const tinggi = (nilai / maks) * 100;
                  const aktif = sorot?.i === i && sorot.seri === seri;
                  return (
                    <button
                      key={seri}
                      type="button"
                      onMouseEnter={() => setSorot({ i, seri })}
                      onMouseLeave={() => setSorot(null)}
                      onFocus={() => setSorot({ i, seri })}
                      onBlur={() => setSorot(null)}
                      aria-label={`${d.label}, ${seri === 1 ? namaSeri1 : namaSeri2}: ${rupiah(nilai)}`}
                      className={`w-[14px] rounded-t-[4px] transition-opacity sm:w-5 ${
                        seri === 1 ? "bg-seri-1" : "bg-seri-2"
                      } ${aktif ? "opacity-100" : sorot ? "opacity-45" : "opacity-95"}`}
                      style={{ height: `${Math.max(tinggi, 1.5)}%` }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 flex gap-3 sm:gap-5">
          {data.map((d) => (
            <div key={d.label} className="flex-1 text-center">
              <p className="text-[11px] font-medium text-slate-600">{d.label}</p>
              {d.sublabel && <p className="text-[10px] text-slate-400">{d.sublabel}</p>}
            </div>
          ))}
        </div>

        {sorot && (
          <div className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-center text-xs text-white shadow-lg">
            <p className="font-semibold">{data[sorot.i].label}</p>
            <p className="mt-0.5 text-slate-200">
              {sorot.seri === 1 ? namaSeri1 : namaSeri2}:{" "}
              <span className="font-semibold text-white">
                {rupiah(sorot.seri === 1 ? data[sorot.i].seri1 : data[sorot.i].seri2)}
              </span>
            </p>
          </div>
        )}
      </div>

      <details className="mt-5 text-xs text-slate-500">
        <summary className="cursor-pointer font-medium text-slate-600 hover:text-slate-900">
          Lihat sebagai tabel
        </summary>
        <div className="mt-3 overflow-x-auto gulir-halus">
          <table className="w-full min-w-[22rem] text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-3 font-medium">Periode</th>
                <th className="py-2 pr-3 text-right font-medium">{namaSeri1}</th>
                <th className="py-2 pr-3 text-right font-medium">{namaSeri2}</th>
                <th className="py-2 text-right font-medium">Selisih</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.label} className="border-b border-slate-100 last:border-0">
                  <td className="py-1.5 pr-3 text-slate-700">{d.label}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{rupiah(d.seri1)}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{rupiah(d.seri2)}</td>
                  <td
                    className={`py-1.5 text-right tabular-nums font-medium ${
                      d.seri1 - d.seri2 >= 0 ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {rupiah(d.seri1 - d.seri2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
