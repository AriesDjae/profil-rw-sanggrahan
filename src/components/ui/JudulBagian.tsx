import Link from "next/link";

/** Judul satu bagian halaman. Jarak dan ukuran huruf yang memisahkan, bukan garis atau kotak. */
export default function JudulBagian({
  judul,
  keterangan,
  tautan,
  labelTautan = "Lihat semua",
  terang = false,
  tingkat = "h2",
}: {
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
    <div className="mb-8">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <Judul
          className={`judul max-w-2xl ${
            tingkat === "h1" ? "text-[2.1rem] sm:text-[2.75rem]" : "text-[1.6rem] sm:text-[2rem]"
          } ${terang ? "text-white" : "text-brand-900"}`}
        >
          {judul}
        </Judul>

        {tautan && (
          <Link
            href={tautan}
            className={`shrink-0 pb-1 text-sm font-semibold underline underline-offset-4 ${
              terang ? "text-white" : "text-soga-700 hover:text-soga-800"
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
