import { aman, jawab } from "@/lib/api";
import { db } from "@/lib/db";

/** Daftar RW aktif beserta RT-nya. */
export const GET = aman(async () => {
  const daftar = await db.rw.findMany({
    where: { aktif: true },
    orderBy: { nomor: "asc" },
    select: {
      nomor: true,
      nama: true,
      slug: true,
      tagline: true,
      rt: { orderBy: { nomor: "asc" }, select: { nomor: true, nama: true, wilayah: true } },
    },
  });
  return jawab(daftar);
});
