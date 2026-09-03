import TombolHapus from "@/components/admin/TombolHapus";
import { rupiah, tanggalSingkat } from "@/lib/format";

export type BarisTransaksi = {
  id: number;
  tanggal: Date;
  kategori: string;
  keterangan: string;
  jumlah: number;
  bukti: string | null;
};

/**
 * Tabel rincian transaksi satu jenis (pemasukan atau pengeluaran).
 * Bila `aksiHapus` diberikan, setiap baris mendapat tombol hapus.
 */
export default function TabelTransaksi({
  judul,
  data,
  warna,
  aksiHapus,
  tampilkanJumlahBaris = false,
}: {
  judul: string;
  data: BarisTransaksi[];
  warna: string;
  aksiHapus?: ((formData: FormData) => Promise<void>) | null;
  tampilkanJumlahBaris?: boolean;
}) {
  const total = data.reduce((a, t) => a + t.jumlah, 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
        <h3 className="text-sm font-bold text-slate-900">
          {judul}
          {tampilkanJumlahBaris && (
            <span className="ml-1 font-normal text-slate-500">
              ({data.length} transaksi)
            </span>
          )}
        </h3>
        <span className={`text-sm font-bold tabular-nums ${warna}`}>{rupiah(total)}</span>
      </div>

      {data.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-500">
          Tidak ada transaksi pada periode ini.
        </p>
      ) : (
        <div className="overflow-x-auto gulir-halus">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2.5 font-semibold">Tanggal</th>
                <th className="px-5 py-2.5 font-semibold">Kategori</th>
                <th className="px-5 py-2.5 font-semibold">Keterangan</th>
                <th className="px-5 py-2.5 text-right font-semibold">Jumlah</th>
                {aksiHapus && <th className="px-5 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id} className="border-t border-slate-100">
                  <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                    {tanggalSingkat(t.tanggal)}
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {t.kategori}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {t.keterangan}
                    {t.bukti && (
                      <a
                        href={t.bukti}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-xs font-semibold text-brand-700 underline underline-offset-2"
                      >
                        bukti
                      </a>
                    )}
                  </td>
                  <td className={`px-5 py-3 text-right tabular-nums font-semibold ${warna}`}>
                    {rupiah(t.jumlah)}
                  </td>
                  {aksiHapus && (
                    <td className="px-5 py-3 text-right">
                      <form action={aksiHapus}>
                        <input type="hidden" name="id" value={t.id} />
                        <TombolHapus kecil pesan="Hapus transaksi ini?" />
                      </form>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
