import Link from "next/link";

import { JAM_RESET_DEMO, URL_DEMO, modeDemo } from "@/lib/demo";

const KELAS_TAUTAN =
  "font-semibold underline decoration-aksen-400 underline-offset-2 hover:decoration-aksen-800";

/**
 * Pita pemberitahuan bahwa isi situs adalah data contoh hasil seed.
 *
 * Situs demo ini memakai nama kampung yang nyata, sehingga tanpa pita ini
 * pengunjung bisa mengira 825 warga dan laporan kas di dalamnya adalah data
 * sungguhan. Setelah situs diisi data warga asli, matikan pita dengan
 * `LABEL_DATA_CONTOH=mati` di variabel lingkungan lalu bangun ulang.
 *
 * Di situs demo (MODE_DEMO), pita ini sekaligus pintu ke panel pengurus.
 * Di situs utama, pita menautkan ke situs demo bila NEXT_PUBLIC_URL_DEMO diisi.
 */
export default function LabelDataContoh() {
  const demo = modeDemo();
  if (!demo && process.env.LABEL_DATA_CONTOH === "mati") return null;

  return (
    <aside
      aria-label="Catatan data contoh"
      className="tanpa-cetak border-b border-aksen-200 bg-aksen-50 px-4 py-2 text-center text-sm text-aksen-800"
    >
      {demo ? (
        <>
          <strong className="font-semibold">Situs demo panel pengurus.</strong> Semua data
          adalah contoh dan dikembalikan ke kondisi awal tiap {JAM_RESET_DEMO} jam.{" "}
          <Link href="/masuk" className={KELAS_TAUTAN}>
            Coba panel pengurus
          </Link>
        </>
      ) : (
        <>
          <strong className="font-semibold">Situs demo.</strong> Nama warga, pengurus,
          berita, dan laporan kas di sini adalah data contoh, bukan data warga Kampung
          Sanggrahan yang sebenarnya.
          {URL_DEMO && (
            <>
              {" "}
              <a href={`${URL_DEMO}/masuk`} className={KELAS_TAUTAN}>
                Coba panel pengurusnya
              </a>
            </>
          )}
        </>
      )}
    </aside>
  );
}
