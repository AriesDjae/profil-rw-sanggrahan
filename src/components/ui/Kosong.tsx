/** Keadaan kosong: kalimat biasa, tanpa ikon hiasan. */
export default function Kosong({
  judul,
  keterangan,
  aksi,
}: {
  judul: string;
  keterangan?: string;
  aksi?: React.ReactNode;
}) {
  return (
    <div className="border-l-2 border-soga-300 py-2 pl-5">
      <p className="text-[15px] font-semibold text-tinta">{judul}</p>
      {keterangan && <p className="mt-1 max-w-md text-sm text-tinta/65">{keterangan}</p>}
      {aksi && <div className="mt-4">{aksi}</div>}
    </div>
  );
}
