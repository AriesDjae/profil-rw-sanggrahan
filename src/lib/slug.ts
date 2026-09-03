import "server-only";

import { db } from "./db";
import { slugify } from "./format";

type Model = "berita" | "kegiatan" | "album";

/** Membuat slug unik untuk sebuah model, dengan menambahkan angka bila bentrok. */
export async function slugUnik(
  model: Model,
  judul: string,
  abaikanId?: number,
): Promise<string> {
  const dasar = slugify(judul) || "tanpa-judul";
  let calon = dasar;
  let n = 1;

  for (;;) {
    const ada =
      model === "berita"
        ? await db.berita.findUnique({ where: { slug: calon }, select: { id: true } })
        : model === "kegiatan"
          ? await db.kegiatan.findUnique({ where: { slug: calon }, select: { id: true } })
          : await db.album.findUnique({ where: { slug: calon }, select: { id: true } });

    if (!ada || ada.id === abaikanId) return calon;
    n += 1;
    calon = `${dasar}-${n}`;
  }
}
