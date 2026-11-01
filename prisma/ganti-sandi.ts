// Mengganti kata sandi semua akun yang masih memakai sandi bawaan seed.
//
//   SANDI_BARU="..." npm run akun:ganti-sandi
//
// Akun yang sandinya sudah diganti tidak disentuh. Pakai KECUALI (surel dipisah
// koma) untuk menyisakan akun demo, mis. KECUALI=bendaharart01.rw1@sanggrahan.id
//
// Tulis KONFIRMASI=ya untuk benar-benar menyimpan. Tanpa itu, skrip hanya
// menghitung akun yang akan berubah.
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const SANDI_BAWAAN = "sanggrahan123";
const PANJANG_MINIMAL = 12;

const db = new PrismaClient();

async function utama() {
  const sandiBaru = process.env.SANDI_BARU ?? "";
  if (sandiBaru.length < PANJANG_MINIMAL) {
    throw new Error(`SANDI_BARU wajib diisi, minimal ${PANJANG_MINIMAL} karakter.`);
  }
  if (sandiBaru === SANDI_BAWAAN) throw new Error("SANDI_BARU sama dengan sandi bawaan.");

  const kecuali = new Set(
    (process.env.KECUALI ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );

  const akun = await db.user.findMany({ select: { id: true, email: true, passwordHash: true } });
  const sasaran: number[] = [];
  for (const a of akun) {
    if (kecuali.has(a.email.toLowerCase())) continue;
    if (await bcrypt.compare(SANDI_BAWAAN, a.passwordHash)) sasaran.push(a.id);
  }

  console.log(`${sasaran.length} dari ${akun.length} akun masih memakai sandi bawaan.`);
  if (process.env.KONFIRMASI !== "ya") {
    console.log("Belum ada yang diubah. Tambahkan KONFIRMASI=ya untuk menyimpan.");
    return;
  }

  const passwordHash = await bcrypt.hash(sandiBaru, 10);
  const { count } = await db.user.updateMany({
    where: { id: { in: sasaran } },
    data: { passwordHash },
  });
  console.log(`${count} akun diperbarui.`);
}

utama()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
