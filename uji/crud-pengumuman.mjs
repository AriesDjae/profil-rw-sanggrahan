// Uji CRUD pengumuman lewat panel pengurus, di peramban sungguhan.
//
// Pengumuman adalah satu-satunya isi yang punya dua tingkat sekaligus: milik
// satu RW, atau milik kampung. Uji ini menempuh keduanya dan memastikan tidak
// tertukar — pengumuman RW 01 tidak boleh muncul di beranda kampung, dan
// pengumuman kampung harus muncul di ketiga laman RW.
//
// Jalankan dengan server hidup:  DASAR=http://localhost:3311 node uji/crud-pengumuman.mjs
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

/** "2026-09-20" — bentuk yang diminta input date. */
function tanggalLokal(selisihHari) {
  const d = new Date();
  d.setDate(d.getDate() + selisihHari);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Satu pengumuman ditampilkan sebagai satu <article> di panel. Menyaring
 * "article, li, div" akan menangkap <div> terdalam yang memuat judulnya —
 * dan div itu tidak memuat tombolnya.
 */
const kartu = (page, judul) => page.locator("article").filter({ hasText: judul });

/** Menunggu pesan sukses server action muncul di formulir. */
async function tungguSukses(page, penggal) {
  const p = page.locator("p", { hasText: penggal });
  await p.first().waitFor({ timeout: 15000 }).catch(() => {});
  return (await p.count()) > 0;
}

const TANDA = Date.now().toString().slice(-6);
const JUDUL_RW = `Iuran keamanan RW 01 uji ${TANDA}`;
const ISI_RW =
  "Iuran keamanan bulan ini disetorkan kepada bendahara RT masing-masing paling lambat tanggal 20.";
const JUDUL_KAMPUNG = `Pemadaman listrik se-Sanggrahan uji ${TANDA}`;
const ISI_KAMPUNG =
  "PLN memberitahukan pemadaman terjadwal Sabtu pukul 08.00 sampai 12.00 di seluruh wilayah Kampung Sanggrahan.";

const browser = await chromium.launch();

try {
  const ctxWarga = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const warga = await ctxWarga.newPage();
  const adaDiHalaman = async (jalur, teks) => {
    await warga.goto(`${DASAR}${jalur}`, { waitUntil: "load" });
    return (await warga.locator(`text=${teks}`).count()) > 0;
  };

  /* ------------------------------------------------------------------ */
  /* CREATE — pengumuman milik satu RW                                   */
  /* ------------------------------------------------------------------ */
  const sek = await masuk(browser, "sekretaris.rw1@sanggrahan.id");
  cek("Sekretaris RW 01 dapat masuk ke panel", sek.page.url().includes("/admin"));

  await sek.page.goto(`${DASAR}/admin/pengumuman`);
  cek(
    "Formulir mengunci pengumuman ke RW 01 (tanpa pilihan RW)",
    (await sek.page.locator("text=Tampil di").count()) > 0 &&
      (await sek.page.locator('select[name="rwId"]').count()) === 0,
  );

  // Validasi: judul terlalu pendek ditolak.
  await sek.page.fill('input[name="judul"]', "Iur");
  await sek.page.fill('textarea[name="isi"]', ISI_RW);
  await sek.page.click('button:has-text("Tambah pengumuman")');
  const galatPendek = sek.page.locator('[role="alert"]', { hasText: "minimal 5 karakter" });
  await galatPendek.waitFor({ timeout: 15000 }).catch(() => {});
  cek("Judul pengumuman terlalu pendek ditolak", (await galatPendek.count()) > 0);

  await sek.page.fill('input[name="judul"]', JUDUL_RW);
  await sek.page.fill('textarea[name="isi"]', ISI_RW);
  await sek.page.fill('input[name="berakhir"]', tanggalLokal(14));
  await sek.page.check('input[name="penting"]');
  await sek.page.click('button:has-text("Tambah pengumuman")');
  cek("Pengumuman RW 01 tersimpan", await tungguSukses(sek.page, "ditambahkan"));
  await potret(sek.page, "pengumuman-1-panel-rw01");

  /* ------------------------------------------------------------------ */
  /* READ — tampil di RW-nya saja                                        */
  /* ------------------------------------------------------------------ */
  cek("Pengumuman RW 01 tampil di beranda RW 01", await adaDiHalaman("/rw/1", JUDUL_RW));
  await potret(warga, "pengumuman-2-beranda-rw01");

  cek(
    "Pengumuman RW 01 TIDAK tampil di beranda RW 02",
    !(await adaDiHalaman("/rw/2", JUDUL_RW)),
  );
  cek(
    "Pengumuman RW 01 TIDAK tampil di beranda RW 03",
    !(await adaDiHalaman("/rw/3", JUDUL_RW)),
  );
  cek(
    "Pengumuman RW 01 TIDAK tampil di beranda kampung",
    !(await adaDiHalaman("/", JUDUL_RW)),
    "beranda kampung hanya untuk pengumuman lintas RW",
  );

  /* ------------------------------------------------------------------ */
  /* CREATE — pengumuman tingkat kampung oleh administrator              */
  /* ------------------------------------------------------------------ */
  const adm = await masuk(browser, "admin@sanggrahan.id");
  await adm.page.goto(`${DASAR}/admin/pengumuman`);
  cek(
    "Administrator kampung mendapat pilihan RW",
    (await adm.page.locator('select[name="rwId"]').count()) === 1,
  );
  cek(
    "Pilihan 'seluruh kampung' tersedia bagi administrator",
    (await adm.page.locator('select[name="rwId"] option[value=""]').count()) === 1,
  );

  await adm.page.selectOption('select[name="rwId"]', "");
  await adm.page.fill('input[name="judul"]', JUDUL_KAMPUNG);
  await adm.page.fill('textarea[name="isi"]', ISI_KAMPUNG);
  await adm.page.fill('input[name="berakhir"]', tanggalLokal(10));
  // Beranda RW hanya memuat tiga pengumuman teratas — yang ditandai penting
  // lebih dulu, lalu yang terbaru. Pemadaman listrik memang tergolong penting,
  // dan menandainya membuat uji ini tidak bergantung pada berapa banyak
  // pengumuman lain kebetulan sedang aktif di RW 01.
  await adm.page.check('input[name="penting"]');
  await adm.page.click('button:has-text("Tambah pengumuman")');
  cek("Pengumuman kampung tersimpan", await tungguSukses(adm.page, "ditambahkan"));

  cek(
    "Pengumuman kampung tampil di beranda kampung",
    await adaDiHalaman("/", JUDUL_KAMPUNG),
  );
  cek(
    "Pengumuman kampung tampil di beranda RW 01",
    await adaDiHalaman("/rw/1", JUDUL_KAMPUNG),
  );
  cek(
    "Pengumuman kampung tampil di beranda RW 02",
    await adaDiHalaman("/rw/2", JUDUL_KAMPUNG),
  );
  cek(
    "Pengumuman kampung tampil di beranda RW 03",
    await adaDiHalaman("/rw/3", JUDUL_KAMPUNG),
  );
  await potret(warga, "pengumuman-3-beranda-rw03");

  /* ------------------------------------------------------------------ */
  /* Batas kewenangan antar-RW                                           */
  /* ------------------------------------------------------------------ */
  const hrefSunting = await kartu(adm.page, JUDUL_RW)
    .locator('a[href*="sunting="]')
    .first()
    .getAttribute("href");
  const idRw01 = hrefSunting
    ? new URL(hrefSunting, DASAR).searchParams.get("sunting")
    : null;
  cek("Id pengumuman RW 01 ditemukan dari panel administrator", Boolean(idRw01), String(idRw01));

  const sekLain = await masuk(browser, "sekretaris.rw2@sanggrahan.id");
  await sekLain.page.goto(`${DASAR}/admin/pengumuman`);
  cek(
    "Sekretaris RW 02 tidak melihat pengumuman RW 01",
    (await sekLain.page.locator(`text=${JUDUL_RW}`).count()) === 0,
  );
  cek(
    "Sekretaris RW 02 tetap melihat pengumuman kampung",
    (await sekLain.page.locator(`text=${JUDUL_KAMPUNG}`).count()) > 0,
    "tampil di lamannya, jadi wajar terlihat",
  );

  if (idRw01) {
    await sekLain.page.goto(`${DASAR}/admin/pengumuman?sunting=${idRw01}`);
    const judulForm = await sekLain.page
      .locator("h2", { hasText: "pengumuman" })
      .first()
      .innerText();
    cek(
      "Tautan sunting pengumuman RW 01 tidak membuka apa pun bagi RW 02",
      judulForm.toLowerCase().includes("tambah"),
      judulForm,
    );
  }
  await sekLain.ctx.close();

  /* ------------------------------------------------------------------ */
  /* UPDATE — nonaktifkan lalu aktifkan lagi                             */
  /* ------------------------------------------------------------------ */
  await sek.page.goto(`${DASAR}/admin/pengumuman`);
  await kartu(sek.page, JUDUL_RW).locator('button:has-text("Nonaktifkan")').click();
  await sek.page.waitForTimeout(2000);
  cek(
    "Pengumuman nonaktif hilang dari beranda RW 01",
    !(await adaDiHalaman("/rw/1", JUDUL_RW)),
  );

  await sek.page.goto(`${DASAR}/admin/pengumuman`);
  await kartu(sek.page, JUDUL_RW).locator('button:has-text("Aktifkan")').click();
  await sek.page.waitForTimeout(2000);
  cek(
    "Pengumuman aktif kembali tampil di beranda RW 01",
    await adaDiHalaman("/rw/1", JUDUL_RW),
  );

  /* ------------------------------------------------------------------ */
  /* UPDATE — tanggal berakhir yang sudah lewat menyembunyikan           */
  /* ------------------------------------------------------------------ */
  await sek.page.goto(`${DASAR}/admin/pengumuman?sunting=${idRw01}`);
  await sek.page.fill('input[name="berakhir"]', tanggalLokal(-2));
  await sek.page.click('button:has-text("Simpan perubahan")');
  cek("Perubahan tanggal berakhir tersimpan", await tungguSukses(sek.page, "diperbarui"));
  cek(
    "Pengumuman kedaluwarsa tidak lagi tampil di beranda RW 01",
    !(await adaDiHalaman("/rw/1", JUDUL_RW)),
  );

  /* ------------------------------------------------------------------ */
  /* DELETE                                                              */
  /* ------------------------------------------------------------------ */
  await sek.page.goto(`${DASAR}/admin/pengumuman`);
  sek.page.once("dialog", (d) => d.accept());
  await kartu(sek.page, JUDUL_RW).locator('button:has-text("Hapus")').click();
  await sek.page.waitForTimeout(2000);
  await sek.page.goto(`${DASAR}/admin/pengumuman`);
  cek(
    "Pengumuman RW 01 terhapus dari panel",
    (await sek.page.locator(`text=${JUDUL_RW}`).count()) === 0,
  );

  await adm.page.goto(`${DASAR}/admin/pengumuman`);
  adm.page.once("dialog", (d) => d.accept());
  await kartu(adm.page, JUDUL_KAMPUNG).locator('button:has-text("Hapus")').click();
  await adm.page.waitForTimeout(2000);
  cek(
    "Pengumuman kampung terhapus dari beranda kampung",
    !(await adaDiHalaman("/", JUDUL_KAMPUNG)),
  );

  await ctxWarga.close();
  await adm.ctx.close();
  await sek.ctx.close();
} finally {
  await browser.close();
}

console.log(
  gagal === 0
    ? `\nSEMUA ${nomor} UJI PENGUMUMAN LULUS`
    : `\n${gagal} dari ${nomor} UJI PENGUMUMAN GAGAL`,
);
process.exit(gagal === 0 ? 0 : 1);
