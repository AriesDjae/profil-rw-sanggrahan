import Link from "next/link";

export default function JudulBagian({
  kicker,
  judul,
  keterangan,
  tautan,
  labelTautan = "Lihat semua",
  terang = false,
  tingkat = "h2",
}: {
  kicker?: string;
  judul: string;
  keterangan?: string;
  tautan?: string;
  labelTautan?: string;
  terang?: boolean;
  /** Gunakan "h1" bila ini judul utama halaman. */
  tingkat?: "h1" | "h2";
}) {
  const Judul = tingkat;
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {kicker && (
          <p
            className={`text-xs font-semibold uppercase tracking-[0.14em] ${
              terang ? "text-brand-200" : "text-brand-600"
            }`}
          >
            {kicker}
          </p>
        )}
        <Judul
          className={`mt-2 text-2xl font-bold tracking-tight sm:text-3xl ${
            terang ? "text-white" : "text-slate-900"
          }`}
        >
          {judul}
        </Judul>
        {keterangan && (
          <p
            className={`mt-2 text-sm leading-relaxed ${
              terang ? "text-brand-200" : "text-slate-600"
            }`}
          >
            {keterangan}
          </p>
        )}
      </div>
      {tautan && (
        <Link
          href={tautan}
          className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
            terang
              ? "border-white/25 text-white hover:bg-white/10"
              : "border-brand-200 text-brand-700 hover:bg-brand-50"
          }`}
        >
          {labelTautan}
        </Link>
      )}
    </div>
  );
}
