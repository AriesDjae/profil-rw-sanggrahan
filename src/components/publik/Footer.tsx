import Image from "next/image";
import Link from "next/link";

import { IkonTautanLuar } from "@/components/ui/Ikon";
import TandaKawung from "@/components/ui/TandaKawung";
import { UMKM } from "@/lib/tautanLuar";

export default function Footer({
  namaKampung,
  alamat,
  telepon,
  email,
  daftarRw,
}: {
  namaKampung: string;
  alamat: string;
  telepon: string;
  email: string;
  daftarRw: { nomor: number; nama: string }[];
}) {
  return (
    <footer className="mt-24 text-brand-100 tanpa-cetak">
      {/* Deret atap yang sama warnanya dengan kaki halaman, jadi halaman berakhir di
          kampung, bukan di garis lurus. */}
      <Image
        src="/ilustrasi/siluet-atap.svg"
        alt=""
        width={1600}
        height={70}
        sizes="100vw"
        className="-mb-px h-10 w-full object-cover object-bottom sm:h-auto"
      />

      <div className="bg-brand-900">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <div className="flex items-center gap-3">
              <TandaKawung ukuran={36} />
              <span className="judul text-lg text-white">{namaKampung}</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-200">
              Satu papan informasi untuk tiga RW. Tiap RW dikelola pengurusnya sendiri, dan
              laporan kas yang tampil di sini sudah diperiksa Ketua RT lalu disahkan Ketua RW.
            </p>

            <nav aria-label="Laman tiap RW" className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
              {daftarRw.map((r) => (
                <Link
                  key={r.nomor}
                  href={`/rw/${r.nomor}`}
                  className="text-sm font-semibold text-white underline underline-offset-4 decoration-aksen-400 hover:text-aksen-200"
                >
                  {r.nama}
                </Link>
              ))}
            </nav>

            {/*
              Urusan usaha warga punya situsnya sendiri. Warga yang mencarinya
              di sini diantar ke sana, bukan dibiarkan menutup tab.
            */}
            <a
              href={UMKM.url}
              className="mt-6 inline-flex max-w-sm items-baseline gap-2 text-sm text-brand-200 transition hover:text-white"
            >
              <span>
                Mencari usaha tetangga? Lihat{" "}
                <span className="font-semibold text-white">{UMKM.nama}</span>
              </span>
              <IkonTautanLuar ukuran={12} className="shrink-0 text-aksen-400" />
            </a>
          </div>

          <div>
            <h2 className="judul text-sm text-white">Jelajahi se-kampung</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { href: "/profil", label: "Profil dan pengurus" },
                { href: "/berita", label: "Berita" },
                { href: "/kegiatan", label: "Agenda kegiatan" },
                { href: "/keuangan", label: "Laporan keuangan" },
                { href: "/data-warga", label: "Data warga" },
                { href: "/galeri", label: "Galeri" },
                { href: "/peta", label: "Peta kampung" },
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
            <h2 className="judul text-sm text-white">Sekretariat kampung</h2>
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
          <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-brand-300">
            &copy; {new Date().getFullYear()} {namaKampung}. Dikelola pengurus RW 01, RW 02, dan
            RW 03 bersama warga.
          </p>
        </div>
      </div>
    </footer>
  );
}
