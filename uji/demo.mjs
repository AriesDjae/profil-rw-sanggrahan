// Uji situs demo: masuk satu klik, akun demo yang terkunci, unggahan yang
// dimatikan, robots, dan titik segarkan cache.
//
// Server-nya harus dibangun DAN dijalankan dengan MODE_DEMO=nyala, karena
// robots.txt dan tajuk X-Robots-Tag ditetapkan saat build:
//   MODE_DEMO=nyala RAHASIA_SEGARKAN_DEMO=... npx next build && npx next start -p 3312
//   DASAR=http://localhost:3312 RAHASIA_SEGARKAN_DEMO=... node uji/demo.mjs
//
// Kebalikannya (situs utama tidak membuka apa pun dari mode demo) diuji di
// uji/keamanan-masuk.mjs, yang berjalan terhadap server biasa.
import { bukaPeramban } from "./peramban.mjs";

const DASAR = process.env.DASAR ?? "http://localhost:3000";
const RAHASIA = process.env.RAHASIA_SEGARKAN_DEMO ?? "";

let gagal = 0;
const cek = (nama, kondisi, catatan = "") => {
  console.log(`${kondisi ? "LULUS" : "GAGAL"}  ${nama}${catatan ? ` — ${catatan}` : ""}`);
  if (!kondisi) gagal++;
};

const browser = await bukaPeramban();

async function masukDemo(label) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("  [galat halaman]", e.message));
  await page.goto(`${DASAR}/masuk`);
  await page.getByRole("button", { name: new RegExp(`Masuk sebagai ${label}`) }).click();
  await page.waitForURL(/\/admin/, { timeout: 20000 });
  return { ctx, page };
}

try {
  // ---------- Pintu masuk ----------
  const ctxTamu = await browser.newContext();
  const tamu = await ctxTamu.newPage();
  await tamu.goto(`${DASAR}/masuk`);
  const jumlahTombol = await tamu.getByRole("button", { name: /^Masuk sebagai / }).count();
  cek("Halaman masuk menawarkan lima akun demo", jumlahTombol === 5, `${jumlahTombol} tombol`);

  await tamu.goto(`${DASAR}/`);
  cek(
    "Pita situs demo menautkan ke panel",
    (await tamu.getByRole("complementary", { name: "Catatan data contoh" }).getByRole("link", { name: "Coba panel pengurus" }).count()) === 1,
  );
  await ctxTamu.close();

  // ---------- Masuk satu klik, lalu ganti peran ----------
  {
    const { ctx, page } = await masukDemo("Bendahara RT 01");
    const teks = await page.textContent("body");
    cek("Tombol Bendahara membuka panel sebagai Bendahara RT", /Bendahara RT/.test(teks ?? ""));
    cek("Panel menampilkan catatan mode demo", /Mode demo\./.test(teks ?? ""));

    await page.getByRole("button", { name: "Ganti peran" }).click();
    await page.waitForURL(/\/masuk/, { timeout: 15000 });
    cek(
      "Ganti peran kembali ke pilihan akun",
      (await page.getByRole("button", { name: /Masuk sebagai Ketua RW 01/ }).count()) === 1,
    );
    await ctx.close();
  }

  // ---------- Akun demo tidak bisa dimatikan ----------
  {
    const { ctx, page } = await masukDemo("Administrator kampung");
    await page.goto(`${DASAR}/admin/pengguna`);
    const baris = page.locator("tr", { hasText: "bendaharart01.rw1@sanggrahan.id" });
    await baris.getByRole("button", { name: "Nonaktifkan" }).click();
    await page.waitForURL(/galat=/, { timeout: 15000 });
    cek(
      "Menonaktifkan akun demo ditolak dengan pesan",
      (await page.getByText("Akun ini dipakai tombol masuk demo").count()) > 0,
    );
    cek(
      "Akun demo tetap aktif",
      (await baris.getByRole("button", { name: "Nonaktifkan" }).count()) === 1,
    );
    await ctx.close();

    // Tombol masuknya pun masih bekerja setelah percobaan tadi.
    const lagi = await masukDemo("Bendahara RT 01");
    cek("Tombol Bendahara tetap bekerja", lagi.page.url().includes("/admin"));
    await lagi.ctx.close();
  }

  // ---------- Unggahan dimatikan ----------
  {
    const { ctx, page } = await masukDemo("Sekretaris RW 01");
    await page.goto(`${DASAR}/admin/berita/baru`);
    await page.fill('input[name="judul"]', `Uji unggah demo ${Date.now()}`);
    await page.fill(
      'textarea[name="ringkasan"]',
      "Ringkasan uji untuk memastikan unggahan berkas ditolak di situs demo.",
    );
    await page.fill(
      'textarea[name="konten"]',
      "Isi uji. Berita ini tidak boleh tersimpan karena membawa berkas gambar, sedangkan situs demo tidak menerima unggahan dari pengunjung.",
    );
    // PNG 1x1 piksel.
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    await page.setInputFiles('input[name="gambar"]', {
      name: "uji.png",
      mimeType: "image/png",
      buffer: png,
    });
    await page.getByRole("button", { name: "Simpan berita" }).click();
    await page.waitForSelector("text=Unggahan berkas dimatikan di situs demo", { timeout: 15000 });
    cek("Unggahan ditolak dengan pesan yang jelas", page.url().includes("/admin/berita/baru"));
    await ctx.close();
  }

  // ---------- Tidak diindeks ----------
  const robots = await (await fetch(`${DASAR}/robots.txt`)).text();
  cek("robots.txt menutup seluruh situs", /Disallow: \/\s*$/m.test(robots), JSON.stringify(robots));
  const beranda = await fetch(`${DASAR}/`);
  cek(
    "Tajuk X-Robots-Tag noindex terpasang",
    /noindex/.test(beranda.headers.get("x-robots-tag") ?? ""),
  );

  // ---------- Titik segarkan cache ----------
  const tanpaToken = await fetch(`${DASAR}/api/demo/segarkan`, { method: "POST" });
  cek("Segarkan tanpa token ditolak", tanpaToken.status === 401, `status ${tanpaToken.status}`);
  const tokenSalah = await fetch(`${DASAR}/api/demo/segarkan`, {
    method: "POST",
    headers: { Authorization: "Bearer salah" },
  });
  cek("Segarkan dengan token salah ditolak", tokenSalah.status === 401, `status ${tokenSalah.status}`);
  const sah = await fetch(`${DASAR}/api/demo/segarkan`, {
    method: "POST",
    headers: { Authorization: `Bearer ${RAHASIA}` },
  });
  cek("Segarkan dengan token sah berhasil", sah.status === 200, `status ${sah.status}`);
} catch (e) {
  console.log("GAGAL  Uji berhenti:", e instanceof Error ? e.message : e);
  gagal++;
} finally {
  await browser.close();
}

console.log(gagal ? `\n${gagal} pemeriksaan gagal.` : "\nSemua pemeriksaan situs demo lulus.");
process.exit(gagal ? 1 : 0);
