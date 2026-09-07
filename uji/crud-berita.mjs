// Uji CRUD sungguhan lewat panel pengurus, dijalankan di peramban asli.
//
// Bedanya dengan uji/qc-fungsi.mjs: berkas ini menempuh satu tulisan dari nol
// sampai terbit dan mengikutinya ke laman publik, sekaligus membuktikan batas
// antar-RW pada tulisan yang sama — pengurus RW lain tidak boleh menyuntingnya.
//
// Jalankan dengan server hidup:  DASAR=http://localhost:3311 node uji/crud-berita.mjs
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

const TANDA = Date.now().toString().slice(-6);
const JUDUL = `Situs Informasi Warga Sanggrahan Dibangun Mahasiswa Informatika UII ${TANDA}`;
const RINGKASAN =
  "Situs ini dibangun oleh Muhammad Aries Djaenuri, mahasiswa Informatika Universitas Islam Indonesia, sebagai sistem informasi warga untuk RW 01, RW 02, dan RW 03 Kampung Sanggrahan.";
const KONTEN = [
  "Kampung Sanggrahan kini memiliki satu sistem informasi warga yang mencakup RW 01, RW 02, dan RW 03. Situs ini dibangun oleh Muhammad Aries Djaenuri, mahasiswa program studi Informatika Universitas Islam Indonesia (UII), sebagai sarana penyaluran informasi dari pengurus kepada warga.",
  "Melalui laman ini warga dapat membaca kabar lingkungan, melihat agenda kegiatan, menelusuri data kependudukan dalam bentuk agregat, serta memeriksa laporan kas RT yang telah diverifikasi Ketua RT dan disahkan Ketua RW.",
  "Setiap RW memiliki lamannya sendiri dan pengurusnya sendiri. Pengurus RW 01 hanya dapat menyunting isi laman RW 01, begitu pula RW 02 dan RW 03, sehingga kewenangan tiap wilayah tetap terjaga meskipun ketiganya berbagi satu situs.",
  "Warga yang ingin menyampaikan kabar, usulan, atau keluhan dapat menghubungi Ketua RT masing-masing untuk diteruskan kepada pengurus RW.",
].join("\n\n");

const KONTEN_REVISI = `${KONTEN}\n\nPembaruan: seluruh isi situs dikelola langsung oleh pengurus melalui panel, tanpa perlu mengubah kode program.`;

const browser = await chromium.launch();

try {
  /* ------------------------------------------------------------------ */
  /* CREATE — Sekretaris RW 01 menulis berita                            */
  /* ------------------------------------------------------------------ */
  const sek = await masuk(browser, "sekretaris.rw1@sanggrahan.id");
  cek("Sekretaris RW 01 dapat masuk ke panel", sek.page.url().includes("/admin"));

  await sek.page.goto(`${DASAR}/admin/berita/baru`);
  const terkunciKeRw =
    (await sek.page.locator('text=Tampil di').count()) > 0 &&
    (await sek.page.locator('input[name="rwId"]').count()) === 0 &&
    (await sek.page.locator('select[name="rwId"]').count()) === 0;
  cek(
    "Formulir mengunci tulisan ke RW 01 (tanpa pilihan RW)",
    terkunciKeRw,
    "pengurus RW tidak boleh memilih RW lain",
  );

  await sek.page.fill('input[name="judul"]', JUDUL);
  await sek.page.fill('textarea[name="ringkasan"]', RINGKASAN);
  await sek.page.fill('textarea[name="konten"]', KONTEN);
  await sek.page.selectOption('select[name="kategori"]', "Pendidikan");
  await sek.page.selectOption('select[name="status"]', "TERBIT");
  await potret(sek.page, "crud-1-formulir-terisi");

  // Bukan button[type="submit"] begitu saja: tombol semacam itu yang pertama
  // ada di kop panel, dan itu tombol Keluar.
  await sek.page.click('button:has-text("Simpan berita")');
  await sek.page.waitForURL(/\/admin\/berita\?/, { timeout: 20000 });
  cek("Berita tersimpan dan kembali ke daftar", sek.page.url().includes("pesan="));

  const adaDiDaftar = (await sek.page.locator(`text=${JUDUL}`).count()) > 0;
  cek("Berita muncul di daftar panel", adaDiDaftar);

  const berlabelRw01 =
    (await sek.page
      .locator("li", { hasText: JUDUL })
      .locator("text=RW 01")
      .count()) > 0;
  cek("Berita berlabel RW 01 di panel", berlabelRw01);
  await potret(sek.page, "crud-2-daftar-panel");

  /* ------------------------------------------------------------------ */
  /* READ — warga membaca tanpa masuk                                    */
  /* ------------------------------------------------------------------ */
  const ctxWarga = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const warga = await ctxWarga.newPage();

  await warga.goto(`${DASAR}/rw/1/berita`);
  const tampilDiRw1 = (await warga.locator(`text=${JUDUL}`).count()) > 0;
  cek("Berita tampil di laman berita RW 01", tampilDiRw1);
  await potret(warga, "crud-3-berita-rw1");

  await warga.goto(`${DASAR}/berita`);
  cek(
    "Berita ikut tampil di daftar berita se-kampung",
    (await warga.locator(`text=${JUDUL}`).count()) > 0,
  );

  await warga.goto(`${DASAR}/rw/2/berita`);
  cek(
    "Berita RW 01 TIDAK tampil di laman berita RW 02",
    (await warga.locator(`text=${JUDUL}`).count()) === 0,
    "inilah pemisahan porsi antar-RW",
  );

  await warga.goto(`${DASAR}/rw/3/berita`);
  cek(
    "Berita RW 01 TIDAK tampil di laman berita RW 03",
    (await warga.locator(`text=${JUDUL}`).count()) === 0,
  );

  // Halaman detail
  await warga.goto(`${DASAR}/rw/1/berita`);
  await warga.locator(`a:has-text("${JUDUL}")`).first().click();
  await warga.waitForURL(/\/berita\/.+/, { timeout: 20000 });
  const alamatDetail = warga.url();
  const isiDetail = await warga.locator("body").innerText();
  cek("Halaman detail berita terbuka", alamatDetail.includes("/berita/"), alamatDetail);
  cek(
    "Nama penyusun tertulis pada isi berita",
    isiDetail.includes("Muhammad Aries Djaenuri"),
  );
  cek(
    "Asal kampus tertulis pada isi berita",
    isiDetail.includes("Universitas Islam Indonesia"),
  );
  cek("Detail berita menandai asal RW 01", isiDetail.includes("RW 01"));
  await potret(warga, "crud-4-detail-berita");

  /* ------------------------------------------------------------------ */
  /* Batas kewenangan — pengurus RW lain tidak boleh menyunting          */
  /* ------------------------------------------------------------------ */
  const idBerita = await sek.page.evaluate(async (judul) => {
    const a = [...document.querySelectorAll('a[href^="/admin/berita/"]')].find((el) =>
      el.closest("li")?.innerText.includes(judul),
    );
    return a ? a.getAttribute("href") : null;
  }, JUDUL);
  cek("Tautan sunting berita ditemukan di panel", Boolean(idBerita), String(idBerita));

  const sekLain = await masuk(browser, "sekretaris.rw2@sanggrahan.id");
  const daftarRw2 = await sekLain.page.goto(`${DASAR}/admin/berita`);
  cek(
    "Sekretaris RW 02 tidak melihat berita RW 01 di panelnya",
    (await sekLain.page.locator(`text=${JUDUL}`).count()) === 0,
    `status ${daftarRw2.status()}`,
  );
  await potret(sekLain.page, "crud-5-panel-rw02");

  if (idBerita) {
    const resp = await sekLain.page.goto(`${DASAR}${idBerita}`);
    cek(
      "Sekretaris RW 02 ditolak saat membuka sunting berita RW 01",
      resp.status() === 404 || sekLain.page.url().includes("galat=akses"),
      `status ${resp.status()}`,
    );
  }
  await sekLain.ctx.close();

  /* ------------------------------------------------------------------ */
  /* UPDATE — sekretaris pemilik menyunting                              */
  /* ------------------------------------------------------------------ */
  await sek.page.goto(`${DASAR}${idBerita}`);
  cek("Pemilik berita dapat membuka halaman sunting", sek.page.url().includes("/admin/berita/"));

  await sek.page.fill('textarea[name="konten"]', KONTEN_REVISI);
  await sek.page.click('button:has-text("Simpan perubahan")');
  await sek.page.waitForURL(/\/admin\/berita\?/, { timeout: 20000 });
  cek("Perubahan berita tersimpan", sek.page.url().includes("pesan="));

  await warga.goto(alamatDetail, { waitUntil: "load" });
  await warga.reload();
  cek(
    "Perubahan langsung terlihat warga tanpa menunggu cache",
    (await warga.locator("body").innerText()).includes("tanpa perlu mengubah kode program"),
  );
  await potret(warga, "crud-6-berita-setelah-disunting");

  /* ------------------------------------------------------------------ */
  /* UPDATE status — jadikan draf, lalu terbitkan lagi                   */
  /* ------------------------------------------------------------------ */
  await sek.page.goto(`${DASAR}/admin/berita`);
  const baris = sek.page.locator("li", { hasText: JUDUL });
  await baris.locator('button:has-text("Jadikan draf")').click();
  await sek.page.waitForTimeout(1500);

  const respDraf = await warga.goto(alamatDetail);
  cek(
    "Berita berstatus draf hilang dari halaman publik",
    respDraf.status() === 404,
    `status ${respDraf.status()}`,
  );

  await sek.page.goto(`${DASAR}/admin/berita`);
  await sek.page
    .locator("li", { hasText: JUDUL })
    .locator('button:has-text("Terbitkan")')
    .click();
  await sek.page.waitForTimeout(1500);
  const respTerbit = await warga.goto(alamatDetail);
  cek(
    "Berita terbit kembali dan dapat dibaca warga",
    respTerbit.status() === 200,
    `status ${respTerbit.status()}`,
  );

  /* ------------------------------------------------------------------ */
  /* DELETE                                                              */
  /* ------------------------------------------------------------------ */
  await sek.page.goto(`${DASAR}${idBerita}`);
  sek.page.once("dialog", (d) => d.accept());
  await sek.page.click('button:has-text("Hapus berita")');
  await sek.page.waitForURL(/\/admin\/berita\?/, { timeout: 20000 });
  cek(
    "Berita terhapus dari panel",
    (await sek.page.locator(`text=${JUDUL}`).count()) === 0,
  );

  const respHapus = await warga.goto(alamatDetail);
  cek(
    "Berita yang dihapus tidak dapat diakses publik",
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
    ? `\nSEMUA ${nomor} UJI CRUD LULUS`
    : `\n${gagal} dari ${nomor} UJI CRUD GAGAL`,
);
process.exit(gagal === 0 ? 0 : 1);
