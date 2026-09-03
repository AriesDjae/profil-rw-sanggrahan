import { angka, rupiah } from "@/lib/format";

export type BarisBatang = { label: string; nilai: number; catatan?: string };

/**
 * Batang horizontal satu seri untuk perbandingan besaran antar kategori.
 * Setiap batang diberi label nilai langsung, sehingga tetap terbaca tanpa warna.
 */
export default function BatangHorizontal({
  data,
  format = "angka",
  judul,
  keterangan,
  urutkan = true,
}: {
  data: BarisBatang[];
  format?: "angka" | "rupiah";
  judul: string;
  keterangan?: string;
  urutkan?: boolean;
}) {
  const baris = urutkan ? [...data].sort((a, b) => b.nilai - a.nilai) : data;
  const maks = Math.max(1, ...baris.map((b) => b.nilai));
  const tampil = (n: number) => (format === "rupiah" ? rupiah(n) : angka(n));
  const total = baris.reduce((a, b) => a + b.nilai, 0);

  return (
    <figure className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <figcaption className="mb-1 text-sm font-semibold text-slate-900">{judul}</figcaption>
      {keterangan && <p className="mb-4 text-xs text-slate-500">{keterangan}</p>}

      <div className="mt-4 space-y-2.5">
        {baris.map((b) => {
          const persen = (b.nilai / maks) * 100;
          return (
            <div key={b.label} className="group grid grid-cols-[minmax(6.5rem,9rem)_1fr_auto] items-center gap-3">
              <span className="truncate text-xs font-medium text-slate-600" title={b.label}>
                {b.label}
              </span>
              <span className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <span
                  className="block h-full rounded-full bg-seri-1 transition-opacity group-hover:opacity-80"
                  style={{ width: `${Math.max(persen, 1.5)}%` }}
                />
              </span>
              <span className="tabular-nums text-xs font-semibold text-slate-800">
                {tampil(b.nilai)}
              </span>
            </div>
          );
        })}
      </div>

      <details className="mt-5 text-xs text-slate-500">
        <summary className="cursor-pointer font-medium text-slate-600 hover:text-slate-900">
          Lihat sebagai tabel
        </summary>
        <div className="mt-3 overflow-x-auto gulir-halus">
          <table className="w-full min-w-[18rem] text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-3 font-medium">Kategori</th>
                <th className="py-2 pr-3 text-right font-medium">Nilai</th>
                <th className="py-2 text-right font-medium">Porsi</th>
              </tr>
            </thead>
            <tbody>
              {baris.map((b) => (
                <tr key={b.label} className="border-b border-slate-100 last:border-0">
                  <td className="py-1.5 pr-3 text-slate-700">{b.label}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums text-slate-800">
                    {tampil(b.nilai)}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-slate-500">
                    {total ? `${((b.nilai / total) * 100).toFixed(1)}%` : "-"}
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
