// Uji CRUD agenda kegiatan lewat panel pengurus, di peramban sungguhan.
//
// Satu kegiatan ditempuh dari dijadwalkan sampai dihapus, sekaligus membuktikan
// bahwa agenda satu RW tidak bocor ke agenda RW lain.
//
// Jalankan dengan server hidup:  DASAR=http://localhost:3311 node uji/crud-kegiatan.mjs
import { chromium } from "playwright";

const DASAR = process.env.DASAR ?? "http://localhost:3000";
const SANDI = "sanggrahan123";
const TEMBAKAN = process.env.SHOT_DIR;

let gagal = 0;
let nomor = 0;
const cek = (nama, kondisi, catatan = "") => {
  nomor++;
  console.log(
    `${kondisi ? "LULUS" : "GAGAL"}  ${String(nomor).padStart(2, "0")}. ${nama}${
      catatan ? ` — ${catatan}` : ""
    }`,
  );
  if (!kondisi) gagal++;
};

async function masuk(browser, email) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("  [galat halaman]", e.message));
  await page.goto(`${DASAR}/masuk`);
  await page.fill("#email", email);
  await page.fill("#kataSandi", SANDI);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin/, { timeout: 20000 });
  return { ctx, page };
}

const potret = async (page, nama) => {
  if (TEMBAKAN) await page.screenshot({ path: `${TEMBAKAN}/${nama}.png`, fullPage: true });
};

/** "2026-09-17T08:00" — bentuk yang diminta input datetime-local. */
function waktuLokal(selisihHari, jam) {
  const d = new Date();
  d.setDate(d.getDate() + selisihHari);
  d.setHours(jam, 0, 0, 0);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(
    d.getMinutes(),
  )}`;
}

const TANDA = Date.now().toString().slice(-6);
const JUDUL = `Kerja Bakti Uji Otomatis ${TANDA}`;
const DESKRIPSI =
  "Kerja bakti membersihkan saluran air dan memangkas tanaman di sepanjang gang. Warga diminta membawa cangkul, sapu lidi, dan karung. Konsumsi disediakan panitia dari kas RW.";
const LOKASI_AWAL = `Balai RW 01 (uji ${TANDA})`;
const LOKASI_BARU = `Lapangan RT 02 RW 01 (uji ${TANDA})`;

const browser = await chromium.launch();

try {
  /* ------------------------------------------------------------------ */
  /* CREATE                                                              */
  /* ------------------------------------------------------------------ */
  const sek = await masuk(browser, "sekretaris.rw1@sanggrahan.id");
  cek("Sekretaris RW 01 dapat masuk ke panel", sek.page.url().includes("/admin"));

  await sek.page.goto(`${DASAR}/admin/kegiatan/baru`);
  cek(
    "Formulir mengunci kegiatan ke RW 01 (tanpa pilihan RW)",
    (await sek.page.locator("text=Tampil di").count()) > 0 &&
      (await sek.page.locator('select[name="rwId"]').count()) === 0,
  );

  // Validasi: waktu selesai tidak boleh mendahului waktu mulai.
  await sek.page.fill('input[name="judul"]', JUDUL);
  await sek.page.fill('input[name="mulai"]', waktuLokal(10, 7));
  await sek.page.fill('input[name="selesai"]', waktuLokal(10, 6));
  await sek.page.fill('input[name="lokasi"]', LOKASI_AWAL);
  await sek.page.fill('textarea[name="deskripsi"]', DESKRIPSI);
  await sek.page.click('button:has-text("Simpan kegiatan")');
  // Ditunggu teksnya, bukan elemennya: Next.js selalu menyisipkan satu
  // <p role="alert"> kosong sebagai pengumum perpindahan halaman, sehingga
  // menunggu selektor '[role="alert"]' saja langsung cocok sebelum pesan galat
  // sempat muncul.
  const pesanGalat = sek.page.locator('[role="alert"]', {
    hasText: "setelah waktu mulai",
  });
  await pesanGalat.waitFor({ timeout: 15000 }).catch(() => {});
  cek("Waktu selesai sebelum waktu mulai ditolak", (await pesanGalat.count()) > 0);

  await sek.page.fill('input[name="selesai"]', waktuLokal(10, 11));
  await sek.page.fill('input[name="penyelenggara"]', "Seksi Kebersihan RW 01");
  await sek.page.fill('input[name="kontak"]', "Sekretariat RW 01 0274-500101");
  await sek.page.selectOption('select[name="kategori"]', "Kerja Bakti");
  await sek.page.selectOption('select[name="status"]', "TERBIT");
  await potret(sek.page, "kegiatan-1-formulir");

  await sek.page.click('button:has-text("Simpan kegiatan")');
  await sek.page.waitForURL(/\/admin\/kegiatan\?/, { timeout: 20000 });
  cek("Kegiatan tersimpan dan kembali ke daftar", sek.page.url().includes("pesan="));
  cek("Kegiatan muncul di daftar panel", (await sek.page.locator(`text=${JUDUL}`).count()) > 0);
  cek(
    "Kegiatan berlabel RW 01 di panel",
    (await sek.page.locator("li", { hasText: JUDUL }).locator("text=RW 01").count()) > 0,
  );
  await potret(sek.page, "kegiatan-2-daftar-panel");

  /* ------------------------------------------------------------------ */
  /* READ — warga                                                        */
  /* ------------------------------------------------------------------ */
  const ctxWarga = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const warga = await ctxWarga.newPage();

  await warga.goto(`${DASAR}/rw/1/kegiatan`);
  cek("Kegiatan tampil di agenda RW 01", (await warga.locator(`text=${JUDUL}`).count()) > 0);
  await potret(warga, "kegiatan-3-agenda-rw1");

  await warga.goto(`${DASAR}/kegiatan`);
  cek(
    "Kegiatan ikut tampil di agenda se-kampung",
    (await warga.locator(`text=${JUDUL}`).count()) > 0,
  );

  await warga.goto(`${DASAR}/rw/2/kegiatan`);
  cek(
    "Kegiatan RW 01 TIDAK tampil di agenda RW 02",
    (await warga.locator(`text=${JUDUL}`).count()) === 0,
  );
  await warga.goto(`${DASAR}/rw/3/kegiatan`);
  cek(
    "Kegiatan RW 01 TIDAK tampil di agenda RW 03",
    (await warga.locator(`text=${JUDUL}`).count()) === 0,
  );

  // Beranda RW 01 memuat agenda mendatang; perubahan pengurus harus langsung
  // terlihat di sana, bukan menunggu cache halaman kedaluwarsa sendiri.
  await warga.goto(`${DASAR}/rw/1`);
  cek(
    "Kegiatan langsung tampil di beranda RW 01",
    (await warga.locator(`text=${JUDUL}`).count()) > 0,
    "menguji revalidasi laman RW",
  );

  await warga.goto(`${DASAR}/rw/1/kegiatan`);
  await warga.locator(`a:has-text("${JUDUL}")`).first().click();
  await warga.waitForURL(/\/kegiatan\/.+/, { timeout: 20000 });
  const alamatDetail = warga.url();
  const isiDetail = await warga.locator("body").innerText();
  cek("Halaman detail kegiatan terbuka", alamatDetail.includes("/kegiatan/"), alamatDetail);
  cek("Detail menyebut wilayah RW 01", isiDetail.includes("RW 01"));
  cek("Detail memuat lokasi yang diisi", isiDetail.includes(LOKASI_AWAL));
  await potret(warga, "kegiatan-4-detail");

  /* ------------------------------------------------------------------ */
  /* Batas kewenangan antar-RW                                           */
  /* ------------------------------------------------------------------ */
  const tautanSunting = await sek.page.evaluate((judul) => {
    const a = [...document.querySelectorAll('a[href^="/admin/kegiatan/"]')].find((el) =>
      el.closest("li")?.innerText.includes(judul),
    );
    return a ? a.getAttribute("href") : null;
  }, JUDUL);
  cek("Tautan sunting kegiatan ditemukan", Boolean(tautanSunting), String(tautanSunting));

  const sekLain = await masuk(browser, "sekretaris.rw2@sanggrahan.id");
  await sekLain.page.goto(`${DASAR}/admin/kegiatan`);
  cek(
    "Sekretaris RW 02 tidak melihat kegiatan RW 01 di panelnya",
    (await sekLain.page.locator(`text=${JUDUL}`).count()) === 0,
  );
  if (tautanSunting) {
    const resp = await sekLain.page.goto(`${DASAR}${tautanSunting}`);
    cek(
      "Sekretaris RW 02 ditolak saat menyunting kegiatan RW 01",
      resp.status() === 404 || sekLain.page.url().includes("galat=akses"),
      `status ${resp.status()}`,
    );
  }
  await sekLain.ctx.close();

  /* ------------------------------------------------------------------ */
  /* UPDATE                                                              */
  /* ------------------------------------------------------------------ */
  await sek.page.goto(`${DASAR}${tautanSunting}`);
  await sek.page.fill('input[name="lokasi"]', LOKASI_BARU);
  await sek.page.click('button:has-text("Simpan perubahan")');
  await sek.page.waitForURL(/\/admin\/kegiatan\?/, { timeout: 20000 });
  cek("Perubahan kegiatan tersimpan", sek.page.url().includes("pesan="));

  await warga.goto(alamatDetail);
  const setelahUbah = await warga.locator("body").innerText();
  cek("Lokasi baru langsung terlihat warga", setelahUbah.includes(LOKASI_BARU));
  cek("Lokasi lama sudah hilang", !setelahUbah.includes(LOKASI_AWAL));

  /* ------------------------------------------------------------------ */
  /* Status: draf menyembunyikan, terbit memunculkan lagi                */
  /* ------------------------------------------------------------------ */
  await sek.page.goto(`${DASAR}${tautanSunting}`);
  await sek.page.selectOption('select[name="status"]', "DRAFT");
  await sek.page.click('button:has-text("Simpan perubahan")');
  await sek.page.waitForURL(/\/admin\/kegiatan\?/, { timeout: 20000 });

  const respDraf = await warga.goto(alamatDetail);
  cek(
    "Kegiatan berstatus draf hilang dari halaman publik",
    respDraf.status() === 404,
    `status ${respDraf.status()}`,
  );
  await warga.goto(`${DASAR}/rw/1/kegiatan`);
  cek(
    "Kegiatan draf juga hilang dari agenda RW 01",
    (await warga.locator(`text=${JUDUL}`).count()) === 0,
  );

  await sek.page.goto(`${DASAR}${tautanSunting}`);
  await sek.page.selectOption('select[name="status"]', "SELESAI");
  await sek.page.fill('input[name="mulai"]', waktuLokal(-5, 7));
  await sek.page.fill('input[name="selesai"]', waktuLokal(-5, 11));
  await sek.page.click('button:has-text("Simpan perubahan")');
  await sek.page.waitForURL(/\/admin\/kegiatan\?/, { timeout: 20000 });

  await warga.goto(`${DASAR}/rw/1/kegiatan?tampil=lampau`);
  cek(
    "Kegiatan selesai masuk arsip RW 01",
    (await warga.locator(`text=${JUDUL}`).count()) > 0,
  );
  await warga.goto(`${DASAR}/rw/1/kegiatan`);
  cek(
    "Kegiatan lampau tidak lagi di tab akan datang",
    (await warga.locator(`text=${JUDUL}`).count()) === 0,
  );

  /* ------------------------------------------------------------------ */
  /* DELETE                                                              */
  /* ------------------------------------------------------------------ */
  await sek.page.goto(`${DASAR}${tautanSunting}`);
  sek.page.once("dialog", (d) => d.accept());
  await sek.page.click('button:has-text("Hapus kegiatan")');
  await sek.page.waitForURL(/\/admin\/kegiatan\?/, { timeout: 20000 });
  cek("Kegiatan terhapus dari panel", (await sek.page.locator(`text=${JUDUL}`).count()) === 0);

  const respHapus = await warga.goto(alamatDetail);
  cek(
    "Kegiatan yang dihapus tidak dapat diakses publik",
    respHapus.status() === 404,
    `status ${respHapus.status()}`,
  );

  await ctxWarga.close();
  await sek.ctx.close();
} finally {
  await browser.close();
}

console.log(
  gagal === 0
    ? `\nSEMUA ${nomor} UJI KEGIATAN LULUS`
    : `\n${gagal} dari ${nomor} UJI KEGIATAN GAGAL`,
);
process.exit(gagal === 0 ? 0 : 1);
