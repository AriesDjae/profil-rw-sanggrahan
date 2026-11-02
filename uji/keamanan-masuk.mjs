// Uji pengaman halaman masuk: pengalihan ke situs luar dan pembatas percobaan.
// Jalankan dengan server hidup:  DASAR=http://localhost:3311 node uji/keamanan-masuk.mjs
import { bukaPeramban } from "./peramban.mjs";

const DASAR = process.env.DASAR ?? "http://localhost:3000";
const SANDI = "sanggrahan123";

let gagal = 0;
const cek = (nama, kondisi, catatan = "") => {
  console.log(`${kondisi ? "LULUS" : "GAGAL"}  ${nama}${catatan ? ` — ${catatan}` : ""}`);
  if (!kondisi) gagal++;
};

const browser = await bukaPeramban();

async function cobaMasuk(page, email, sandi) {
  await page.fill("#email", email);
  await page.fill("#kataSandi", sandi);
  await page.click('form:has(#kataSandi) button[type="submit"]');
}

try {
  // ---------- Pengalihan setelah masuk ----------
  for (const jahat of ["//contoh.invalid/tiruan", "/\\contoh.invalid/tiruan"]) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${DASAR}/masuk?next=${encodeURIComponent(jahat)}`);
    await cobaMasuk(page, "admin@sanggrahan.id", SANDI);
    await page.waitForURL(/\/admin/, { timeout: 15000 }).catch(() => {});
    cek(`Tetap di situs ini untuk next=${jahat}`, page.url().startsWith(`${DASAR}/admin`), page.url());
    await ctx.close();
  }

  const ctxSah = await browser.newContext();
  const halamanSah = await ctxSah.newPage();
  await halamanSah.goto(`${DASAR}/masuk?next=${encodeURIComponent("/admin/keuangan")}`);
  await cobaMasuk(halamanSah, "admin@sanggrahan.id", SANDI);
  await halamanSah.waitForURL(/\/admin\/keuangan/, { timeout: 15000 });
  cek("Tujuan di dalam situs tetap diikuti", true);
  await ctxSah.close();

  // ---------- Pembatas percobaan ----------
  // Surel acak yang tidak terdaftar, supaya akun demo tidak ikut terkunci.
  const email = `uji-${Date.now()}@contoh.invalid`;
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${DASAR}/masuk`);

  for (let i = 1; i <= 5; i++) {
    // Pesannya sama di tiap percobaan, jadi yang ditunggu jawaban server-nya.
    const jawaban = page.waitForResponse((r) => r.request().method() === "POST");
    await cobaMasuk(page, email, "sandi-salah");
    await jawaban;
    await page.waitForSelector("text=Surel atau kata sandi tidak sesuai", { timeout: 15000 });
  }
  cek("Lima percobaan gagal mendapat pesan yang sama", true);

  await cobaMasuk(page, email, "sandi-salah");
  await page.waitForSelector("text=Terlalu banyak percobaan masuk", { timeout: 15000 });
  cek("Percobaan keenam dikunci", true);
  await ctx.close();

  // ---------- Header keamanan ----------
  const r = await fetch(`${DASAR}/masuk`);
  cek("Header X-Frame-Options terpasang", r.headers.get("x-frame-options") === "DENY");
  cek("Header nosniff terpasang", r.headers.get("x-content-type-options") === "nosniff");
  cek("Header CSP terpasang", (r.headers.get("content-security-policy") ?? "").includes("default-src"));

  // ---------- Mode demo tertutup di situs utama ----------
  // Server uji ini berjalan tanpa MODE_DEMO, sama seperti situs utama.
  const htmlMasuk = await r.text();
  cek("Tidak ada tombol masuk demo", !htmlMasuk.includes("Coba tanpa kata sandi"));
  cek("Tidak ada tajuk noindex untuk seluruh situs", !r.headers.get("x-robots-tag"));
  const segarkan = await fetch(`${DASAR}/api/demo/segarkan`, { method: "POST" });
  cek("Titik segarkan demo tidak ada", segarkan.status === 404, `status ${segarkan.status}`);
} finally {
  await browser.close();
}

console.log(gagal === 0 ? "\nSemua uji keamanan masuk lulus." : `\n${gagal} uji gagal.`);
process.exitCode = gagal === 0 ? 0 : 1;
