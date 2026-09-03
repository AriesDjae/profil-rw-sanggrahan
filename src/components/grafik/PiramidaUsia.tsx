import { angka } from "@/lib/format";

export type BarisPiramida = { kelompok: string; lakiLaki: number; perempuan: number };

/**
 * Piramida penduduk: laki-laki ke kiri, perempuan ke kanan.
 * Nilai dilabeli langsung di tiap sisi agar tidak bergantung pada warna saja.
 */
export default function PiramidaUsia({
  data,
  judul,
  keterangan,
}: {
  data: BarisPiramida[];
  judul: string;
  keterangan?: string;
}) {
  const maks = Math.max(1, ...data.flatMap((d) => [d.lakiLaki, d.perempuan]));
  const totalL = data.reduce((a, d) => a + d.lakiLaki, 0);
  const totalP = data.reduce((a, d) => a + d.perempuan, 0);

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
            Laki-laki ({angka(totalL)})
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-seri-2" />
            Perempuan ({angka(totalP)})
          </li>
        </ul>
      </div>

      <div className="mt-5 space-y-2">
        {data.map((d) => (
          <div key={d.kelompok} className="grid grid-cols-[1fr_4.5rem_1fr] items-center gap-2">
            <div className="flex items-center justify-end gap-2">
              <span className="tabular-nums text-[11px] font-semibold text-slate-700">
                {angka(d.lakiLaki)}
              </span>
              <span className="h-3 w-full max-w-[16rem] overflow-hidden rounded-l-full bg-slate-100">
                <span
                  className="ml-auto block h-full rounded-l-full bg-seri-1"
                  style={{ width: `${Math.max((d.lakiLaki / maks) * 100, 1)}%` }}
                />
              </span>
            </div>
            <span className="text-center text-[11px] font-medium text-slate-500">
              {d.kelompok}
            </span>
            <div className="flex items-center gap-2">
              <span className="h-3 w-full max-w-[16rem] overflow-hidden rounded-r-full bg-slate-100">
                <span
                  className="block h-full rounded-r-full bg-seri-2"
                  style={{ width: `${Math.max((d.perempuan / maks) * 100, 1)}%` }}
                />
              </span>
              <span className="tabular-nums text-[11px] font-semibold text-slate-700">
                {angka(d.perempuan)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </figure>
  );
}
