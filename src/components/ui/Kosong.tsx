import { IkonDaftarKosong } from "./Ikon";

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
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center">
      <div
        aria-hidden
        className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400"
      >
        <IkonDaftarKosong ukuran={22} />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-800">{judul}</p>
      {keterangan && <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{keterangan}</p>}
      {aksi && <div className="mt-5">{aksi}</div>}
    </div>
  );
}
