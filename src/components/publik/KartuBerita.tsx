import Link from "next/link";

import { potong, tanggal } from "@/lib/format";

export type BeritaKartu = {
  slug: string;
  judul: string;
  ringkasan: string;
  kategori: string;
  gambar: string | null;
  terbitAt: Date | null;
  rw?: { nomor: number; nama: string } | null;
};

/**
 * Satu kabar dalam daftar. Tanpa kotak berbayang: foto berdiri sendiri di atas
 * teks, dipisahkan garis tipis seperti kolom pada lembar warta.
 *
 * Hanya judulnya yang menjadi tautan, lalu area tautan itu direntangkan ke
 * seluruh kartu. Dengan begitu pembaca layar mendengar satu tautan yang jelas,
 * sementara pembaca biasa tetap bisa menekan bagian mana pun termasuk fotonya.
 */
export default function KartuBerita({
  berita,
  utama = false,
  tampilkanRw = false,
}: {
  berita: BeritaKartu;
  utama?: boolean;
  /** Dinyalakan pada daftar yang mencampur ketiga RW, supaya pembaca tahu
   *  kabar ini datang dari RW mana. Di laman satu RW keterangan itu mubazir. */
  tampilkanRw?: boolean;
}) {
  return (
    <article
      className={`group relative ${utama ? "grid gap-6 sm:grid-cols-2 sm:items-center" : ""}`}
    >
      <div className="overflow-hidden bg-brand-100">
        <div className={utama ? "aspect-[4/3]" : "aspect-[16/10]"}>
          {berita.gambar ? (
            <img
              src={berita.gambar}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="h-full w-full bg-brand-600" />
          )}
        </div>
      </div>

      <div className={utama ? "" : "pt-4"}>
        <p className="text-[13px] text-tinta/55">
          {tampilkanRw ? `${berita.rw?.nama ?? "Se-kampung"} · ` : ""}
          {berita.kategori}, {tanggal(berita.terbitAt)}
        </p>

        <h3 className={`judul mt-2 text-brand-950 ${utama ? "text-[1.7rem]" : "text-lg"}`}>
          <Link
            href={`/berita/${berita.slug}`}
            className="underline-offset-[5px] after:absolute after:inset-0 group-hover:underline"
          >
            {berita.judul}
          </Link>
        </h3>

        <p className="mt-2.5 text-[15px] leading-relaxed text-tinta/75">
          {potong(berita.ringkasan, utama ? 200 : 120)}
        </p>
      </div>
    </article>
  );
}
