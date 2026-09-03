import Link from "next/link";

export default function Footer({
  namaRw,
  alamat,
  telepon,
  email,
}: {
  namaRw: string;
  alamat: string;
  telepon: string;
  email: string;
}) {
  return (
    <footer className="mt-20 border-t border-brand-900/10 bg-brand-950 text-brand-100 tanpa-cetak">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500 text-sm font-extrabold text-white"
            >
              RW
            </span>
            <span className="text-lg font-bold text-white">{namaRw}</span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-200">
            Portal informasi warga: berita lingkungan, agenda kegiatan, data
            kependudukan, dan laporan keuangan kas RT yang diverifikasi berjenjang
            oleh Ketua RT dan Ketua RW.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white">Jelajahi</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              { href: "/profil", label: "Profil & Struktur" },
              { href: "/berita", label: "Berita" },
              { href: "/kegiatan", label: "Agenda Kegiatan" },
              { href: "/keuangan", label: "Laporan Keuangan" },
              { href: "/data-warga", label: "Data Warga" },
              { href: "/galeri", label: "Galeri Foto" },
            ].map((t) => (
              <li key={t.href}>
                <Link href={t.href} className="text-brand-200 transition hover:text-white">
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white">Sekretariat</h2>
          <ul className="mt-4 space-y-3 break-words text-sm text-brand-200">
            <li>{alamat || "Alamat belum diisi"}</li>
            {telepon && (
              <li>
                Telepon:{" "}
                <a href={`tel:${telepon.replace(/[^0-9+]/g, "")}`} className="hover:text-white">
                  {telepon}
                </a>
              </li>
            )}
            {email && (
              <li>
                Surel:{" "}
                <a href={`mailto:${email}`} className="hover:text-white">
                  {email}
                </a>
              </li>
            )}
            <li className="pt-2">
              <Link href="/masuk" className="font-medium text-white underline underline-offset-4">
                Masuk panel pengurus
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-brand-300 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {namaRw}. Seluruh data pada situs ini
            dikelola oleh pengurus RW.
          </p>
          <p>Dibangun untuk keterbukaan informasi warga.</p>
        </div>
      </div>
    </footer>
  );
}
