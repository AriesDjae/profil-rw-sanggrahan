// Uji alur persetujuan berjenjang: Bendahara -> Ketua RT -> Ketua RW -> publik
//
// Sejak situs melayani tiga RW, uji ini sekaligus menjaga batas antar-RW:
// laporan RW 03 dikerjakan pengurus RW 03, dan Ketua RW 01 harus ditolak saat
// mencoba menyentuhnya.
import { chromium } from "playwright";

const DASAR = process.env.DASAR ?? "http://localhost:3000";
const SANDI = "sanggrahan123";
const tembakan = process.env.SHOT_DIR;

let gagal = 0;
const cek = (nama, kondisi, catatan = "") => {
  console.log(`${kondisi ? "LULUS" : "GAGAL"}  ${nama}${catatan ? ` — ${catatan}` : ""}`);
  if (!kondisi) gagal++;
};

async function masuk(browser, email) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("  [galat halaman]", e.message));
  await page.goto(`${DASAR}/masuk`);
  await page.fill("#email", email);
  await page.fill("#kataSandi", SANDI);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin/, { timeout: 15000 });
  return { ctx, page };
}

const browser = await chromium.launch();

try {
  // ---------- 1. Bendahara RT 03 RW 03 membuat & mengajukan laporan ----------
  const b = await masuk(browser, "bendaharart03.rw3@sanggrahan.id");
  cek("Bendahara dapat masuk ke panel", b.page.url().includes("/admin"));

  // Laporan yang masih bisa disunting bendahara: draf, atau yang dikembalikan
  // untuk revisi. Menerima keduanya membuat uji ini dapat dijalankan berulang
  // tanpa harus mengisi ulang data contoh lebih dulu.
  let tautanDraf;
  for (const status of ["DRAFT", "DITOLAK"]) {
    await b.page.goto(`${DASAR}/admin/keuangan?status=${status}`);
    const kandidat = b.page.locator('a:has-text("Buka")').first();
    if ((await kandidat.count()) > 0) {
      tautanDraf = kandidat;
      break;
    }
  }
  cek("Bendahara punya laporan yang dapat disunting", Boolean(tautanDraf));
  if (!tautanDraf) throw new Error("tidak ada laporan draf/ditolak untuk RT 03 RW 03");
  await tautanDraf.click();
  await b.page.waitForURL(/\/admin\/keuangan\/\d+/);
  const urlLaporan = b.page.url();
  const idLaporan = urlLaporan.split("/").pop();
  console.log(`  laporan yang diuji: ${urlLaporan}`);

  // Bendahara hanya boleh menyunting saat draf
  cek(
    "Formulir transaksi tersedia pada laporan draf",
    await b.page.locator('form:has(input[name="laporanId"])').isVisible(),
  );

  // Tambah transaksi pemasukan
  await b.page.fill('input[name="jumlah"]', "450000");
  await b.page.fill('textarea[name="keterangan"]', "Uji otomatis: iuran warga September");
  await b.page.click('button:has-text("Tambahkan transaksi")');
  await b.page.waitForSelector("text=Transaksi ditambahkan", { timeout: 15000 });
  cek("Transaksi baru tersimpan", true);

  // Ajukan
  await b.page.click('button:has-text("Ajukan laporan")');
  await b.page.waitForURL(/pesan=/, { timeout: 15000 });
  cek(
    "Laporan berpindah ke tahap verifikasi RT",
    await b.page.locator("text=Menunggu Verifikasi RT").first().isVisible(),
  );

  // Setelah diajukan, bendahara tidak boleh menyunting lagi
  cek(
    "Laporan terkunci setelah diajukan",
    (await b.page.locator('button:has-text("Ajukan laporan")').count()) === 0,
  );

  // ---------- 2. Laporan belum boleh tampil ke publik ----------
  const anonim = await browser.newContext();
  const halamanAnonim = await anonim.newPage();
  const resp = await halamanAnonim.goto(`${DASAR}/keuangan/${idLaporan}`);
  cek(
    "Laporan belum disetujui tidak dapat diakses publik",
    resp.status() === 404,
    `status ${resp.status()}`,
  );

  // ---------- 3. Ketua RT lain tidak boleh ikut campur ----------
  const rtLain = await masuk(browser, "ketuart01.rw3@sanggrahan.id");
  const respLain = await rtLain.page.goto(`${DASAR}/admin/keuangan/${idLaporan}`);
  cek(
    "Ketua RT lain di RW yang sama tidak dapat membuka laporan ini",
    rtLain.page.url().includes("galat=akses") || respLain.status() === 404,
    rtLain.page.url(),
  );
  await rtLain.ctx.close();

  // ---------- 3b. Batas antar-RW ----------
  // Nomor RT berulang di ketiga RW, jadi Ketua RT 03 RW 01 punya peran dan
  // nomor RT yang sama persis dengan pemilik laporan ini. Yang membedakannya
  // hanya RW — dan itulah yang harus menahannya.
  const rtRwLain = await masuk(browser, "ketuart03.rw1@sanggrahan.id");
  const respRwLain = await rtRwLain.page.goto(`${DASAR}/admin/keuangan/${idLaporan}`);
  cek(
    "Ketua RT bernomor sama dari RW lain ditolak",
    rtRwLain.page.url().includes("galat=akses") || respRwLain.status() === 404,
    rtRwLain.page.url(),
  );
  await rtRwLain.ctx.close();

  const rwSalah = await masuk(browser, "ketuarw1@sanggrahan.id");
  const respRwSalah = await rwSalah.page.goto(`${DASAR}/admin/keuangan/${idLaporan}`);
  cek(
    "Ketua RW 01 tidak dapat membuka laporan kas RW 03",
    rwSalah.page.url().includes("galat=akses") || respRwSalah.status() === 404,
    rwSalah.page.url(),
  );
  await rwSalah.ctx.close();

  // ---------- 4. Ketua RT pemilik laporan memverifikasi ----------
  const rt = await masuk(browser, "ketuart03.rw3@sanggrahan.id");
  await rt.page.goto(`${DASAR}/admin/persetujuan`);
  cek(
    "Laporan muncul di antrean Ketua RT",
    (await rt.page.locator(`a[href="/admin/keuangan/${idLaporan}"]`).count()) > 0,
  );
  if (tembakan) {
    await rt.page.screenshot({ path: `${tembakan}/antrean-ketua-rt.png`, fullPage: true });
  }

  // Uji penolakan tanpa catatan wajib ditolak sistem
  await rt.page.goto(`${DASAR}/admin/keuangan/${idLaporan}`);
  await rt.page.click('button:has-text("Kembalikan untuk revisi")');
  await rt.page.waitForURL(/galat=/, { timeout: 15000 });
  cek(
    "Pengembalian tanpa catatan ditolak",
    decodeURIComponent(rt.page.url()).includes("Isi alasan"),
  );

  // Verifikasi dengan catatan
  await rt.page.fill("#catatan", "Uji otomatis: rincian sesuai buku kas.");
  await rt.page.click('button:has-text("Verifikasi & teruskan ke RW")');
  await rt.page.waitForURL(/pesan=/, { timeout: 15000 });
  cek(
    "Laporan diteruskan ke Ketua RW",
    await rt.page.locator("text=Menunggu Persetujuan RW").first().isVisible(),
  );

  // Ketua RT tidak boleh menyetujui tahap RW
  cek(
    "Ketua RT tidak memiliki tombol persetujuan akhir",
    (await rt.page.locator('button:has-text("Setujui & terbitkan")').count()) === 0,
  );
  await rt.ctx.close();

  // ---------- 5. Ketua RW menyetujui ----------
  const rw = await masuk(browser, "ketuarw3@sanggrahan.id");
  await rw.page.goto(`${DASAR}/admin/keuangan/${idLaporan}`);
  await rw.page.fill("#catatan", "Uji otomatis: disetujui untuk warga.");
  await rw.page.click('button:has-text("Setujui & terbitkan")');
  await rw.page.waitForURL(/pesan=/, { timeout: 15000 });
  cek(
    "Ketua RW menyetujui laporan",
    await rw.page.locator("text=Disetujui & Terbit").first().isVisible(),
  );

  // ---------- 6. Laporan kini tampil ke publik ----------
  const respPublik = await halamanAnonim.goto(`${DASAR}/keuangan/${idLaporan}`);
  cek("Laporan terbit ke halaman publik", respPublik.status() === 200);
  cek(
    "Jejak persetujuan tampil untuk warga",
    await halamanAnonim.locator("text=Disetujui Ketua RW").first().isVisible(),
  );
  cek(
    "Transaksi uji tampil pada rincian publik",
    await halamanAnonim.locator("text=Uji otomatis: iuran warga September").first().isVisible(),
  );
  if (tembakan) {
    await halamanAnonim.screenshot({ path: `${tembakan}/laporan-publik.png`, fullPage: true });
  }

  // ---------- 7. Buka kembali oleh Ketua RW ----------
  await rw.page.goto(`${DASAR}/admin/keuangan/${idLaporan}`);
  await rw.page.fill("#catatan", "Uji otomatis: dibuka kembali untuk koreksi.");
  await rw.page.click('button:has-text("Buka kembali laporan")');
  await rw.page.waitForURL(/pesan=/, { timeout: 15000 });
  const respTarik = await halamanAnonim.goto(`${DASAR}/keuangan/${idLaporan}`);
  cek(
    "Laporan yang dibuka kembali ditarik dari halaman publik",
    respTarik.status() === 404,
    `status ${respTarik.status()}`,
  );
  await rw.ctx.close();

  // ---------- 8. Batas akses peran ----------
  const bendahara2 = await masuk(browser, "bendaharart01.rw1@sanggrahan.id");
  await bendahara2.page.goto(`${DASAR}/admin/pengguna`);
  cek(
    "Bendahara tidak dapat membuka pengelolaan akun",
    bendahara2.page.url().includes("galat=akses"),
    bendahara2.page.url(),
  );
  await bendahara2.page.goto(`${DASAR}/admin/warga`);
  cek(
    "Bendahara tidak dapat membuka data warga",
    bendahara2.page.url().includes("galat=akses"),
    bendahara2.page.url(),
  );
  await bendahara2.ctx.close();

  const sekretaris = await masuk(browser, "sekretaris.rw1@sanggrahan.id");
  await sekretaris.page.goto(`${DASAR}/admin/berita/baru`);
  cek(
    "Sekretaris dapat menulis berita",
    await sekretaris.page.locator('input[name="judul"]').isVisible(),
  );
  await sekretaris.page.goto(`${DASAR}/admin/persetujuan`);
  cek(
    "Sekretaris tidak dapat membuka antrean persetujuan",
    sekretaris.page.url().includes("galat=akses"),
    sekretaris.page.url(),
  );
  await sekretaris.ctx.close();

  // ---------- 9. Halaman publik utama ----------
  for (const [nama, jalur] of [
    ["Beranda", "/"],
    ["Berita", "/berita"],
    ["Kegiatan", "/kegiatan"],
    ["Keuangan", "/keuangan"],
    ["Profil", "/profil"],
    ["Data warga", "/data-warga"],
    ["Galeri", "/galeri"],
  ]) {
    const r = await halamanAnonim.goto(DASAR + jalur);
    const adaGalat = await halamanAnonim.locator("text=Application error").count();
    cek(`Halaman ${nama} tampil`, r.status() === 200 && adaGalat === 0);
    if (tembakan) {
      await halamanAnonim.screenshot({
        path: `${tembakan}/publik-${nama.toLowerCase().replace(/\s/g, "-")}.png`,
        fullPage: jalur === "/",
      });
    }
  }

  await anonim.close();
  await b.ctx.close();
} finally {
  await browser.close();
}

console.log(gagal === 0 ? "\nSEMUA UJI LULUS" : `\n${gagal} UJI GAGAL`);
process.exit(gagal === 0 ? 0 : 1);
