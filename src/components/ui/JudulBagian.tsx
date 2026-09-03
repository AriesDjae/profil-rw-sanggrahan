import Link from "next/link";

/**
 * Kepala bagian bergaya papan: garis pemisah di atas, label pendek dengan
 * huruf biasa (bukan kapital renggang), lalu judul. Garis inilah yang
 * memisahkan bagian, bukan kotak berbayang.
 */
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
    <div className={`mb-8 border-t pt-5 ${terang ? "border-white/25" : "border-garis"}`}>
      {kicker && (
        <p
          className={`mb-3 text-[13px] font-medium ${
            terang ? "text-aksen-200" : "text-brand-700"
          }`}
        >
          {kicker}
        </p>
      )}

      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <Judul
          className={`judul max-w-2xl text-[1.75rem] sm:text-[2.15rem] ${
            terang ? "text-white" : "text-brand-950"
          }`}
        >
          {judul}
        </Judul>

        {tautan && (
          <Link
            href={tautan}
            className={`shrink-0 pb-1 text-sm font-semibold underline-offset-4 hover:underline ${
              terang ? "text-white" : "text-brand-700"
            }`}
          >
            {labelTautan}
          </Link>
        )}
      </div>

      {keterangan && (
        <p
          className={`mt-3 max-w-2xl text-[15px] leading-relaxed ${
            terang ? "text-brand-200" : "text-tinta/70"
          }`}
        >
          {keterangan}
        </p>
      )}
    </div>
  );
}
