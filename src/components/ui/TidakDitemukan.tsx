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
    <section className="mx-auto max-w-3xl px-4 py-20 sm:py-28">
      <p className="judul angka-kas text-[5rem] leading-none text-aksen-600 sm:text-[7rem]">404</p>
      <h1 className="judul mt-5 text-3xl text-brand-950 sm:text-4xl">Halaman tidak ditemukan</h1>
      <p className="mt-4 max-w-xl leading-relaxed text-tinta/70">
        Alamat ini mungkin salah ketik, atau isinya sudah dipindahkan pengurus. Coba mulai lagi
        dari beranda atau dari salah satu bagian di bawah ini.
      </p>

      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center bg-brand-700 px-5 text-sm font-semibold text-white transition hover:bg-brand-800"
      >
        Kembali ke beranda
      </Link>

      <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-1 border-t border-garis pt-5">
        {TAUTAN.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              className="inline-flex min-h-8 items-center text-sm font-medium text-brand-700 underline-offset-4 hover:underline"
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
