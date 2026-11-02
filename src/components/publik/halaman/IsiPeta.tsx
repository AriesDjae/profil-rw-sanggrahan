import PetaMalas from "@/components/publik/PetaMalas";
import JudulBagian from "@/components/ui/JudulBagian";
import Kosong from "@/components/ui/Kosong";
import { TITIK_USAHA } from "@/lib/petaKampung";
import { UMKM } from "@/lib/tautanLuar";

import type { Lingkup } from "./lingkup";

/** Peta kampung dengan titik usaha warga — dipakai `/peta` dan `/rw/[n]/peta`. */
export default function IsiPeta({ lingkup }: { lingkup: Lingkup }) {
  const nomor = lingkup.rw?.nomor;
  const titik = nomor ? TITIK_USAHA.filter((t) => t.rw === nomor) : TITIK_USAHA;
  const perkiraan = titik.filter((t) => t.perkiraan).length;

  // Pengelompokan per kategori; daftar ini juga pengganti peta bagi pembaca layar.
  const perKategori = new Map<string, typeof titik>();
  for (const t of titik) {
    perKategori.set(t.kategori, [...(perKategori.get(t.kategori) ?? []), t]);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <JudulBagian
        judul={`Peta ${lingkup.nama}`}
        tingkat="h1"
        keterangan={
          titik.length > 0
            ? `${titik.length} usaha warga tercatat di peta. Tekan titiknya untuk melihat nama usaha, lalu lanjutkan ke situs ${UMKM.nama}.`
            : `Letak ${lingkup.nama} di Kampung Sanggrahan. Usaha warga di wilayah ini belum didata pada peta.`
        }
      />

      <PetaMalas titik={titik.length > 0 ? titik : TITIK_USAHA.slice(0, 0)} />

      {!nomor && (
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-tinta/70">
          <li className="flex items-center gap-2">
            <span aria-hidden className="pin-usaha pin-rw-1 inline-block h-3.5 w-3.5" />
            RW 01
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="pin-usaha pin-rw-3 inline-block h-3.5 w-3.5" />
            RW 03
          </li>
        </ul>
      )}

      {perkiraan > 0 && (
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-tinta/65">
          {perkiraan} dari {titik.length} titik masih perkiraan: ditarik dari banner peta kampung
          lalu dicocokkan ke jalan OpenStreetMap, bukan hasil ukur di tempat. Anggap titiknya
          menunjuk gang yang benar, bukan alamat pintu.
        </p>
      )}

      {titik.length === 0 ? (
        <div className="mt-10">
          <Kosong
            judul={`Belum ada usaha ${lingkup.nama} di peta`}
            keterangan="Warga yang punya usaha bisa mendaftar lewat situs Usaha Warga."
            aksi={
              <a href={UMKM.url} className="text-sm font-semibold text-soga-700 underline underline-offset-4">
                Buka {UMKM.nama}
              </a>
            }
          />
        </div>
      ) : (
        <section className="mt-14">
          <h2 className="judul text-[1.5rem] text-brand-900">Daftar usaha warga</h2>
          <div className="mt-6 gap-10 sm:columns-2 lg:columns-3">
            {[...perKategori.entries()].map(([kategori, daftar]) => (
              <div key={kategori} className="mb-8 break-inside-avoid">
                <h3 className="text-sm font-semibold text-soga-700">{kategori}</h3>
                <ul className="mt-2 space-y-1.5">
                  {daftar.map((t) => (
                    <li key={t.slug} className="text-[15px] leading-snug">
                      <a
                        href={`${UMKM.url}/umkm/${encodeURIComponent(t.slug)}`}
                        className="text-tinta underline-offset-4 hover:text-brand-700 hover:underline"
                      >
                        {t.nama}
                      </a>
                      {!nomor && (
                        <span className="text-[13px] text-tinta/55">
                          {" "}
                          RW {String(t.rw).padStart(2, "0")}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
