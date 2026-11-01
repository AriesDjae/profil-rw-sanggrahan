import { aman, galat, jawab } from "@/lib/api";
import { db } from "@/lib/db";
import { STATUS_KONTEN } from "@/lib/konstanta";

/** Satu berita terbit lengkap dengan isinya. */
export const GET = aman(
  async (_permintaan: Request, { params }: { params: Promise<{ slug: string }> }) => {
    const { slug } = await params;

    const berita = await db.berita.findFirst({
      where: { slug, status: STATUS_KONTEN.TERBIT },
      select: {
        slug: true,
        judul: true,
        ringkasan: true,
        konten: true,
        kategori: true,
        gambar: true,
        terbitAt: true,
        dilihat: true,
        rw: { select: { nomor: true, nama: true } },
      },
    });

    if (!berita) return galat(404, "BERITA_TIDAK_DITEMUKAN", "Berita tidak ditemukan.");
    return jawab(berita);
  },
);
