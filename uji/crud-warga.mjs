// Uji CRUD data warga lewat panel pengurus, di peramban sungguhan.
//
// Dua hal yang dijaga uji ini, di luar CRUD biasa:
//
//  1. **Kerahasiaan.** Nama, NIK, nomor KK, dan alamat warga tidak boleh pernah
//     sampai ke halaman publik mana pun. Yang tampil hanya angka agregat.
//  2. **Batas wilayah.** Pengurus RW 02 tidak boleh melihat, menyunting, atau
//     memindahkan warga RW 01 — termasuk lewat angka rtId yang diketik tangan
//     ke dalam formulir.
//
// Jalankan dengan server hidup:  DASAR=http://localhost:3311 node uji/crud-warga.mjs
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
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
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

/**
 * Menghitung baris tabel yang memuat nama tersebut.
 *
 * Sengaja tidak memakai `text=` pada seluruh halaman: ketika pencarian tidak
 * menemukan apa pun, halaman justru mencetak `Tidak ada hasil untuk "<nama>"` —
 * sehingga memeriksa teks halaman akan menyimpulkan yang sebaliknya.
 */
const barisWarga = (page, nama) =>
  page.locator("tbody tr").filter({ hasText: nama }).count();

const TANDA = Date.now().toString().slice(-6);
const NAMA = `Warga Uji Otomatis ${TANDA}`;
const NIK = `34710101${TANDA}01`.slice(0, 16).padEnd(16, "0");
const NO_KK = `34710102${TANDA}02`.slice(0, 16).padEnd(16, "0");
const ALAMAT = `Gang Uji Nomor ${TANDA}`;

const browser = await chromium.launch();

try {
  const ctxWarga = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const publik = await ctxWarga.newPage();

  /** Membaca angka "Total Jiwa" dari halaman data warga. */
  const totalJiwa = async (jalur) => {
    await publik.goto(`${DASAR}${jalur}`, { waitUntil: "load" });
    return publik.evaluate(() => {
      const label = [...document.querySelectorAll("p")].find(
        (e) => e.textContent.trim() === "Total Jiwa",
      );
      const kartu = label?.closest("div.rounded-2xl");
      const angka = kartu?.querySelector("p.tabular-nums")?.textContent ?? "0";
      return Number(angka.replace(/[^0-9]/g, ""));
    });
  };

  const jiwaRw1Sebelum = await totalJiwa("/rw/1/data-warga");
  const jiwaRw2Sebelum = await totalJiwa("/rw/2/data-warga");
  const jiwaKampungSebelum = await totalJiwa("/data-warga");

  /* ------------------------------------------------------------------ */
  /* CREATE                                                              */
  /* ------------------------------------------------------------------ */
  const sek = await masuk(browser, "sekretaris.rw1@sanggrahan.id");
  cek("Sekretaris RW 01 dapat masuk ke panel", sek.page.url().includes("/admin"));

  await sek.page.goto(`${DASAR}/admin/warga/baru`);
  const opsiRt = await sek.page.$$eval('select[name="rtId"] option', (o) =>
    o.map((x) => x.textContent.trim()).filter((t) => t && !t.startsWith("Pilih")),
  );
  cek(
    "Pilihan RT hanya memuat RT milik RW 01",
    opsiRt.length > 0 && opsiRt.every((t) => !t.includes("RW 02") && !t.includes("RW 03")),
    opsiRt.join(", "),
  );
  cek(
    "Pilihan RT terurut menaik",
    JSON.stringify(opsiRt) === JSON.stringify([...opsiRt].sort()),
    opsiRt.join(", "),
  );

  // Validasi NIK.
  await sek.page.fill('input[name="nama"]', NAMA);
  await sek.page.selectOption('select[name="jenisKelamin"]', "L");
  await sek.page.selectOption('select[name="rtId"]', { index: 1 });
  await sek.page.fill('input[name="nik"]', "12345");
  await sek.page.click('button:has-text("Tambah warga")');
  const galatNik = sek.page.locator('[role="alert"]', { hasText: "16 digit" });
  await galatNik.waitFor({ timeout: 15000 }).catch(() => {});
  cek("NIK bukan 16 digit ditolak", (await galatNik.count()) > 0);

  await sek.page.fill('input[name="nik"]', NIK);
  await sek.page.fill('input[name="noKk"]', NO_KK);
  await sek.page.fill('input[name="tanggalLahir"]', "1990-05-17");
  await sek.page.fill('input[name="alamat"]', ALAMAT);
  await sek.page.selectOption('select[name="pekerjaan"]', "Wiraswasta");
  await sek.page.selectOption('select[name="agama"]', "Islam");
  await potret(sek.page, "warga-1-formulir");
  await sek.page.click('button:has-text("Tambah warga")');
  await sek.page.waitForURL(/\/admin\/warga\?/, { timeout: 20000 });
  cek("Warga baru tersimpan", (await barisWarga(sek.page, NAMA)) > 0);
  cek(
    "Daftar langsung disaring ke RT tujuan",
    sek.page.url().includes("rt="),
    sek.page.url(),
  );
  await potret(sek.page, "warga-2-daftar-panel");

  // NIK ganda ditolak.
  await sek.page.goto(`${DASAR}/admin/warga/baru`);
  await sek.page.fill('input[name="nama"]', `${NAMA} kembar`);
  await sek.page.selectOption('select[name="jenisKelamin"]', "P");
  await sek.page.selectOption('select[name="rtId"]', { index: 1 });
  await sek.page.fill('input[name="nik"]', NIK);
  await sek.page.click('button:has-text("Tambah warga")');
  const galatKembar = sek.page.locator('[role="alert"]', { hasText: "sudah terdaftar" });
  await galatKembar.waitFor({ timeout: 15000 }).catch(() => {});
  cek("NIK yang sudah terpakai ditolak", (await galatKembar.count()) > 0);

  /* ------------------------------------------------------------------ */
  /* READ — statistik publik ikut bertambah, identitas tidak bocor        */
  /* ------------------------------------------------------------------ */
  cek(
    "Total jiwa RW 01 bertambah satu",
    (await totalJiwa("/rw/1/data-warga")) === jiwaRw1Sebelum + 1,
  );
  cek(
    "Total jiwa se-kampung bertambah satu",
    (await totalJiwa("/data-warga")) === jiwaKampungSebelum + 1,
  );
  cek(
    "Total jiwa RW 02 tidak ikut berubah",
    (await totalJiwa("/rw/2/data-warga")) === jiwaRw2Sebelum,
  );
  await potret(publik, "warga-3-statistik-rw1");

  const halamanPublik = [
    "/",
    "/rw/1",
    "/rw/1/data-warga",
    "/data-warga",
    "/rw/1/profil",
    "/profil",
  ];
  let bocor = [];
  for (const jalur of halamanPublik) {
    await publik.goto(`${DASAR}${jalur}`, { waitUntil: "load" });
    const isi = await publik.locator("body").innerText();
    for (const [apa, nilai] of [
      ["nama", NAMA],
      ["NIK", NIK],
      ["nomor KK", NO_KK],
      ["alamat", ALAMAT],
    ]) {
      if (isi.includes(nilai)) bocor.push(`${apa} di ${jalur}`);
    }
  }
  cek(
    "Identitas pribadi warga tidak muncul di halaman publik mana pun",
    bocor.length === 0,
    bocor.length ? bocor.join("; ") : `${halamanPublik.length} halaman diperiksa`,
  );

  /* ------------------------------------------------------------------ */
  /* Batas wilayah                                                       */
  /* ------------------------------------------------------------------ */
  const idWarga = await sek.page.evaluate((nama) => {
    const a = [...document.querySelectorAll('a[href^="/admin/warga/"]')].find((el) =>
      el.closest("tr, li")?.innerText.includes(nama),
    );
    return a ? a.getAttribute("href") : null;
  }, NAMA);

  await sek.page.goto(`${DASAR}/admin/warga?cari=${encodeURIComponent(NAMA)}`);
  const tautanSunting = await sek.page.evaluate((nama) => {
    const a = [...document.querySelectorAll('a[href^="/admin/warga/"]')].find((el) =>
      el.closest("tr, li")?.innerText.includes(nama),
    );
    return a ? a.getAttribute("href") : null;
  }, NAMA);
  cek(
    "Pencarian menemukan warga dan tautan suntingnya",
    Boolean(tautanSunting || idWarga),
    String(tautanSunting ?? idWarga),
  );
  const alamatSunting = tautanSunting ?? idWarga;

  const sekLain = await masuk(browser, "sekretaris.rw2@sanggrahan.id");
  await sekLain.page.goto(`${DASAR}/admin/warga?cari=${encodeURIComponent(NAMA)}`);
  cek(
    "Sekretaris RW 02 tidak menemukan warga RW 01",
    (await barisWarga(sekLain.page, NAMA)) === 0,
  );

  if (alamatSunting) {
    const resp = await sekLain.page.goto(`${DASAR}${alamatSunting}`);
    // Pengalihan berakhir di halaman lain yang sehat, jadi status akhirnya 200.
    // Yang menentukan lulus adalah ke mana ia mendarat, bukan angka statusnya.
    const mendarat = sekLain.page.url();
    cek(
      "Sekretaris RW 02 ditolak saat membuka data warga RW 01",
      resp.status() === 404 || mendarat.includes("galat=akses"),
      mendarat.replace(DASAR, ""),
    );
  }

  // Pilihan RT pada panel RW 02 tidak boleh menawarkan RT milik RW 01.
  await sekLain.page.goto(`${DASAR}/admin/warga/baru`);
  const opsiRt2 = await sekLain.page.$$eval('select[name="rtId"] option', (o) =>
    o.map((x) => x.textContent.trim()).filter((t) => t && !t.startsWith("Pilih")),
  );
  cek(
    "Pilihan RT pada panel RW 02 tidak memuat RT RW 01",
    opsiRt2.length > 0 && opsiRt2.every((t) => !t.includes("RW 01") && !t.includes("RW 03")),
    opsiRt2.join(", "),
  );

  // Menyuntikkan rtId milik RW 01 lewat formulir RW 02 harus ditolak server.
  const rtIdRw1 = await sek.page.$eval(
    'select[name="rtId"] option:not([value=""])',
    (o) => o.value,
    { strict: false },
  ).catch(async () => {
    await sek.page.goto(`${DASAR}/admin/warga/baru`);
    return sek.page.$eval('select[name="rtId"] option:not([value=""])', (o) => o.value);
  });

  await sekLain.page.fill('input[name="nama"]', `Selundupan ${TANDA}`);
  await sekLain.page.selectOption('select[name="jenisKelamin"]', "L");
  await sekLain.page.evaluate((nilai) => {
    const s = document.querySelector('select[name="rtId"]');
    const o = document.createElement("option");
    o.value = nilai;
    o.textContent = "RT sisipan";
    s.appendChild(o);
    s.value = nilai;
  }, String(rtIdRw1));
  await sekLain.page.click('button:has-text("Tambah warga")');
  const galatLuar = sekLain.page.locator('[role="alert"]', { hasText: "di luar RW Anda" });
  await galatLuar.waitFor({ timeout: 15000 }).catch(() => {});
  cek(
    "rtId milik RW 01 yang disisipkan ke formulir RW 02 ditolak server",
    (await galatLuar.count()) > 0,
    "pertahanan terakhir ada di server, bukan di formulir",
  );
  await sekLain.ctx.close();

  /* ------------------------------------------------------------------ */
  /* UPDATE                                                              */
  /* ------------------------------------------------------------------ */
  await sek.page.goto(`${DASAR}${alamatSunting}`);
  await sek.page.selectOption('select[name="pekerjaan"]', "Guru/Dosen");
  await sek.page.click('button:has-text("Simpan perubahan")');
  await sek.page.waitForURL(/\/admin\/warga\?/, { timeout: 20000 });
  await sek.page.goto(`${DASAR}${alamatSunting}`);
  cek(
    "Perubahan pekerjaan tersimpan",
    (await sek.page.inputValue('select[name="pekerjaan"]')) === "Guru/Dosen",
  );

  /* ------------------------------------------------------------------ */
  /* DELETE                                                              */
  /* ------------------------------------------------------------------ */
  await sek.page.goto(`${DASAR}${alamatSunting}`);
  sek.page.once("dialog", (d) => d.accept());
  await sek.page.click('button:has-text("Hapus")');
  await sek.page.waitForURL(/\/admin\/warga\?/, { timeout: 20000 });

  await sek.page.goto(`${DASAR}/admin/warga?cari=${encodeURIComponent(NAMA)}`);
  cek("Warga terhapus dari panel", (await barisWarga(sek.page, NAMA)) === 0);
  cek(
    "Total jiwa RW 01 kembali seperti semula",
    (await totalJiwa("/rw/1/data-warga")) === jiwaRw1Sebelum,
  );

  await ctxWarga.close();
  await sek.ctx.close();
} finally {
  await browser.close();
}

console.log(
  gagal === 0
    ? `\nSEMUA ${nomor} UJI DATA WARGA LULUS`
    : `\n${gagal} dari ${nomor} UJI DATA WARGA GAGAL`,
);
process.exit(gagal === 0 ? 0 : 1);
