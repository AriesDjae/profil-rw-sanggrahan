import Image from "next/image";
import Link from "next/link";

import JudulBagian from "@/components/ui/JudulBagian";
import Kosong from "@/components/ui/Kosong";
import { db } from "@/lib/db";
import { tanggal } from "@/lib/format";
import { saringKontenRw } from "@/lib/rw";

import type { Lingkup } from "./lingkup";

/** Galeri album — dipakai `/galeri` dan `/rw/[n]/galeri`. */
export default async function IsiGaleri({ lingkup }: { lingkup: Lingkup }) {
  const album = await db.album.findMany({
    where: saringKontenRw(lingkup.rw?.id ?? null),
    orderBy: { tanggal: "desc" },
    include: {
      rw: { select: { nama: true } },
      foto: { orderBy: { urutan: "asc" }, take: 4 },
      _count: { select: { foto: true } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <JudulBagian
        judul={`Galeri Kegiatan ${lingkup.nama}`}
        tingkat="h1"
        keterangan={
          lingkup.rw
            ? `Foto kegiatan warga ${lingkup.nama} yang didokumentasikan pengurus.`
            : "Dokumentasi kegiatan warga dari ketiga RW."
        }
      />

      {album.length === 0 ? (
        <Kosong
          judul="Belum ada album foto"
          keterangan="Album akan tampil setelah pengurus mengunggah dokumentasi."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {album.map((a) => (
            <Link
              key={a.id}
              href={`/galeri/${a.slug}`}
              className="group block"
            >
              <div className="potongan grid aspect-[4/3] grid-cols-2 gap-1 bg-soga-100">
                {a.foto.slice(0, 4).map((f, i) => (
                  <Image
                    key={f.id}
                    src={f.url}
                    alt=""
                    width={400}
                    height={300}
                    sizes="(min-width: 1024px) 180px, (min-width: 640px) 25vw, 50vw"
                    className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
                      a.foto.length === 1 ? "col-span-2 row-span-2" : ""
                    } ${a.foto.length === 3 && i === 0 ? "row-span-2" : ""}`}
                  />
                ))}
              </div>
              <div className="pt-3">
                <h2 className="judul text-[1.1rem] text-brand-900 group-hover:underline underline-offset-4">
                  {a.nama}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {!lingkup.rw ? `${a.rw?.nama ?? "Se-kampung"}, ` : ""}
                  {tanggal(a.tanggal)}, {a._count.foto} gambar
                </p>
                {a.deskripsi && (
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{a.deskripsi}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
