import Link from "next/link";

import { hitungMundur, jam, potong, selisihHari } from "@/lib/format";
import { NAMA_BULAN } from "@/lib/konstanta";

export type KegiatanKartu = {
  slug: string;
  judul: string;
  deskripsi: string;
  mulai: Date;
  selesai: Date | null;
  lokasi: string;
  kategori: string;
  penyelenggara: string | null;
  rw?: { nomor: number; nama: string } | null;
};

/**
 * Satu baris agenda: tanggal di kolom kiri, keterangan di kanan, dipisahkan
 * garis. Kegiatan dalam sepekan ditandai agar langsung terlihat.
 */
export default function KartuKegiatan({
  kegiatan,
  tampilkanRw = false,
}: {
  kegiatan: KegiatanKartu;
  /** Lihat catatan yang sama di KartuBerita. */
  tampilkanRw?: boolean;
}) {
  const mulai = new Date(kegiatan.mulai);
  const hari = selisihHari(mulai);
  const segera = hari >= 0 && hari <= 7;

  return (
    <article className="group flex min-w-0 gap-5 border-t border-garis py-5 first:border-t-0">
      {/* Tanggal seperti kalender sobek di dinding; merah bila tinggal sepekan lagi. */}
      <div className="w-14 shrink-0 overflow-hidden rounded-md border border-garis bg-white text-center">
        <p className={`py-0.5 text-[11px] font-semibold text-white ${segera ? "bg-merah" : "bg-brand-700"}`}>
          {NAMA_BULAN[mulai.getMonth()].slice(0, 3)}
        </p>
        <p className="judul pt-1.5 text-[1.45rem] leading-none text-brand-900">{mulai.getDate()}</p>
        <p className="pt-0.5 pb-1 text-[11px] text-tinta/60">{mulai.getFullYear()}</p>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="judul text-[17px] text-brand-950">
          <Link
            href={`/kegiatan/${kegiatan.slug}`}
            className="underline-offset-[5px] hover:underline"
          >
            {kegiatan.judul}
          </Link>
        </h3>

        <p className="mt-1.5 line-clamp-2 text-[15px] leading-relaxed text-tinta/70">
          {potong(kegiatan.deskripsi, 110)}
        </p>

        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-tinta/60">
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">Waktu</dt>
            <dd>
              Pukul {jam(mulai)}
              {kegiatan.selesai ? `–${jam(kegiatan.selesai)}` : ""}
            </dd>
          </div>
          <div className="flex min-w-0 items-baseline gap-1.5">
            <dt className="sr-only">Lokasi</dt>
            <dd className="truncate">{kegiatan.lokasi}</dd>
          </div>
          {tampilkanRw && (
            <div className="flex items-baseline gap-1.5">
              <dt className="sr-only">Rukun Warga</dt>
              <dd className="font-medium text-brand-800">
                {kegiatan.rw?.nama ?? "Se-kampung"}
              </dd>
            </div>
          )}
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">Hitung mundur</dt>
            <dd className={segera ? "font-semibold text-aksen-800" : ""}>
              {hitungMundur(mulai)}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
