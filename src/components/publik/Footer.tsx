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
    <footer className="mt-24 bidang-hijau text-brand-100 tanpa-cetak">
      <div className="motif-kawung">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="grid h-10 w-10 place-items-center bg-aksen-400 text-[13px] font-bold text-brand-900"
              >
                RW
              </span>
              <span className="judul text-lg text-white">{namaRw}</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-200">
              Papan informasi warga yang dikelola pengurus RW. Laporan kas yang
              tampil di sini sudah diperiksa Ketua RT dan disahkan Ketua RW.
            </p>
          </div>

          <div>
            <h2 className="judul text-sm text-white">Jelajahi</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { href: "/profil", label: "Profil dan pengurus" },
                { href: "/berita", label: "Berita" },
                { href: "/kegiatan", label: "Agenda kegiatan" },
                { href: "/keuangan", label: "Laporan keuangan" },
                { href: "/data-warga", label: "Data warga" },
                { href: "/galeri", label: "Galeri foto" },
              ].map((t) => (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    className="text-brand-200 underline-offset-4 transition hover:text-white hover:underline"
                  >
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="judul text-sm text-white">Sekretariat</h2>
            <ul className="mt-4 space-y-3 break-words text-sm text-brand-200">
              <li>{alamat || "Alamat belum diisi"}</li>
              {telepon && (
                <li>
                  <a
                    href={`tel:${telepon.replace(/[^0-9+]/g, "")}`}
                    className="underline-offset-4 hover:text-white hover:underline"
                  >
                    {telepon}
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a
                    href={`mailto:${email}`}
                    className="underline-offset-4 hover:text-white hover:underline"
                  >
                    {email}
                  </a>
                </li>
              )}
              <li className="pt-2">
                <Link
                  href="/masuk"
                  className="font-semibold text-white underline underline-offset-4"
                >
                  Masuk panel pengurus
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/15">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-brand-300 sm:flex-row sm:items-center sm:justify-between">
            <p>
              &copy; {new Date().getFullYear()} {namaRw}. Dikelola pengurus RW
              bersama warga.
            </p>
            <p>Dibangun untuk keterbukaan informasi warga.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
