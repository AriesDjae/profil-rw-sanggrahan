import { createHash, timingSafeEqual } from "node:crypto";

import { revalidatePath } from "next/cache";

import { modeDemo } from "@/lib/demo";

/**
 * Dipanggil workflow reset-demo setelah basis data demo dikembalikan ke isi
 * seed. Halaman publik disajikan dari cache sampai 30 menit; tanpa panggilan
 * ini, isi yang baru saja dihapus reset masih tampil selama itu.
 *
 * Hanya hidup di situs demo, dan hanya untuk pemegang RAHASIA_SEGARKAN_DEMO.
 */
export const dynamic = "force-dynamic";

function sidik(teks: string): Buffer {
  return createHash("sha256").update(teks).digest();
}

export async function POST(request: Request) {
  const rahasia = process.env.RAHASIA_SEGARKAN_DEMO ?? "";
  if (!modeDemo() || rahasia.length < 32) {
    return new Response(null, { status: 404 });
  }

  // Sidik SHA-256 menyamakan panjang kedua sisi, syarat timingSafeEqual.
  const dikirim = request.headers.get("authorization") ?? "";
  if (!timingSafeEqual(sidik(dikirim), sidik(`Bearer ${rahasia}`))) {
    return Response.json(
      { galat: { kode: "TIDAK_BERWENANG", pesan: "Token tidak sah." } },
      { status: 401 },
    );
  }

  revalidatePath("/", "layout");
  return Response.json({ disegarkan: true });
}
