import Image from "next/image";
import Link from "next/link";

const TAUTAN = [
  { href: "/berita", label: "Berita" },
  { href: "/kegiatan", label: "Agenda kegiatan" },
  { href: "/keuangan", label: "Laporan kas" },
  { href: "/galeri", label: "Galeri" },
];

/** Isi halaman 404. Tanpa kueri, supaya tetap tampil saat basis data bermasalah. */
export default function TidakDitemukan() {
  return (
    <section className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-14 sm:py-20 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0">
      <p className="judul text-[4rem] leading-none text-soga-500 sm:text-[5.5rem]">404</p>
      <h1 className="judul mt-4 text-3xl text-brand-900 sm:text-4xl">Halaman tidak ditemukan</h1>
      <p className="mt-4 max-w-md leading-relaxed text-tinta/70">
        Gang yang Anda tuju buntu. Alamatnya mungkin salah ketik, atau isinya sudah dipindahkan
        pengurus.
      </p>

      <Link
        href="/"
        className="mt-7 inline-flex min-h-11 items-center bg-brand-700 px-5 text-sm font-semibold text-white transition hover:bg-brand-800"
      >
        Kembali ke beranda
      </Link>

      <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-1 border-t border-garis pt-5">
        {TAUTAN.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              className="inline-flex min-h-8 items-center text-sm font-medium text-soga-700 underline underline-offset-4"
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
      </div>
      <Image
        src="/ilustrasi/gang-buntu.svg"
        alt="Ujung gang yang buntu dengan rambu dilarang masuk dan seekor kucing"
        width={640}
        height={420}
        className="potongan h-auto w-full"
      />
    </section>
  );
}
