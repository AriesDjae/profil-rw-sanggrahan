import Link from "next/link";

import { IkonTautanLuar } from "@/components/ui/Ikon";
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
              <span className="judul text-lg text-white">{namaKampung}</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-200">
              Satu papan informasi untuk tiga RW. Tiap RW dikelola pengurusnya
              sendiri; laporan kas yang tampil di sini sudah diperiksa Ketua RT
              dan disahkan Ketua RW yang bersangkutan.
            </p>

            <nav aria-label="Laman tiap RW" className="mt-6 flex flex-wrap gap-2">
              {daftarRw.map((r) => (
                <Link
                  key={r.nomor}
                  href={`/rw/${r.nomor}`}
                  className="border border-white/25 px-3 py-2 text-sm font-semibold text-white transition hover:border-aksen-400 hover:bg-white/5"
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
              className="mt-8 inline-flex max-w-sm items-start gap-3 border border-white/25 px-4 py-4 transition hover:border-aksen-400 hover:bg-white/5"
            >
              <span className="min-w-0">
                <span className="block text-xs font-semibold tracking-widest text-brand-300 uppercase">
                  Situs warga lainnya
                </span>
                <span className="judul mt-2 block text-base text-white">
                  {UMKM.nama}
                </span>
                <span className="mt-1 block text-sm text-brand-200">
                  {UMKM.keterangan}
                </span>
              </span>
              <IkonTautanLuar ukuran={14} className="mt-1 shrink-0 text-aksen-400" />
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
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-brand-300 sm:flex-row sm:items-center sm:justify-between">
            <p>
              &copy; {new Date().getFullYear()} {namaKampung}. Dikelola pengurus
              RW 01, RW 02, dan RW 03 bersama warga.
            </p>
            <p>Dibangun untuk keterbukaan informasi warga.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
