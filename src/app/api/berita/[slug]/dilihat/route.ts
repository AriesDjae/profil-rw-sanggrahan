import { NextResponse } from "next/server";

import { db } from "@/lib/db";

/**
 * Menambah penghitung pembaca satu berita.
 *
 * Dipisahkan dari perenderan halaman karena menulis ke basis data saat
 * merender membuat halaman tidak bisa disimpan di cache: setiap pembaca
 * harus menunggu satu perjalanan tulis ke basis data sebelum melihat isinya.
 */
export async function POST(
  _permintaan: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  await db.berita
    .updateMany({
      where: { slug, status: "TERBIT" },
      data: { dilihat: { increment: 1 } },
    })
    .catch(() => null);

  return NextResponse.json({ ok: true });
}
