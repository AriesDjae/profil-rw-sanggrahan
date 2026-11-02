// Uji hal yang dilihat mesin pencari, aplikasi pesan, dan pengguna papan ketik.
// Jalankan dengan server hidup:  DASAR=http://localhost:3311 node uji/seo-aksesibilitas.mjs
// Pada `npm run dev`, setel UJI_DEV=1: mode pengembangan memang memakai unsafe-eval.
import { bukaPeramban } from "./peramban.mjs";

const DASAR = process.env.DASAR ?? "http://localhost:3000";
const SANDI = "sanggrahan123";
const UA_WHATSAPP = "WhatsApp/2.23.20.0";

let gagal = 0;
const cek = (nama, kondisi, catatan = "") => {
  console.log(`${kondisi ? "LULUS" : "GAGAL"}  ${nama}${catatan ? ` — ${catatan}` : ""}`);
  if (!kondisi) gagal++;
};

const ambil = (jalur, kepala = {}) =>
  fetch(`${DASAR}${jalur}`, { redirect: "manual", headers: kepala });

/** Isi <head> seperti yang dibaca WhatsApp: tanpa menjalankan JavaScript. */
async function metaBagikan(jalur) {
  const html = await (await ambil(jalur, { "User-Agent": UA_WHATSAPP })).text();
  const kepala = html.split("</head>")[0];
  const nilai = (kunci) =>
    new RegExp(`<meta[^>]+(?:property|name)="${kunci}"[^>]+content="([^"]*)"`).exec(kepala)?.[1];
  return {
    judul: nilai("og:title"),
    gambar: nilai("og:image"),
    situs: nilai("og:site_name"),
    bahasa: nilai("og:locale"),
    kartu: nilai("twitter:card"),
  };
}

const browser = await bukaPeramban();

try {
  // ---------- robots.txt dan sitemap.xml ----------
  const robots = await ambil("/robots.txt");
  const isiRobots = await robots.text();
  cek("robots.txt tersedia", robots.status === 200);
  cek("robots.txt melarang panel pengurus", isiRobots.includes("Disallow: /admin"));
  cek("robots.txt menunjuk sitemap", /Sitemap: https?:\/\/\S+\/sitemap\.xml/.test(isiRobots));

  const peta = await ambil("/sitemap.xml");
  const isiPeta = await peta.text();
  const alamat = [...isiPeta.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  cek("sitemap.xml tersedia", peta.status === 200, `${alamat.length} alamat`);
  cek("Sitemap memuat beranda dan laman RW", alamat.includes("/") && alamat.includes("/rw/1/berita"));
  cek("Sitemap tidak memuat panel pengurus", !alamat.some((a) => /^\/(admin|masuk)(\/|$)/.test(a)));

  const contoh = ["/berita/", "/kegiatan/", "/galeri/", "/keuangan/"].map((awalan) =>
    alamat.find((a) => a.startsWith(awalan)),
  );
  cek("Sitemap memuat rincian tiap jenis isi", contoh.every(Boolean), contoh.join(" "));
  for (const jalur of contoh.filter(Boolean)) {
    cek(`Alamat di sitemap benar-benar hidup: ${jalur}`, (await ambil(jalur)).status === 200);
  }

  // ---------- Pratinjau tautan ----------
  const beranda = await metaBagikan("/");
  cek("Open Graph beranda punya nama situs", beranda.situs === "Kampung Sanggrahan");
  cek("Open Graph berbahasa Indonesia", beranda.bahasa === "id_ID");
  cek("Kartu Twitter memakai gambar besar", beranda.kartu === "summary_large_image");
  cek("og:image berupa alamat penuh", /^https?:\/\/.+opengraph-image/.test(beranda.gambar ?? ""));

  const urlGambar = new URL(beranda.gambar);
  const gambar = await ambil(urlGambar.pathname + urlGambar.search);
  const ukuranGambar = (await gambar.arrayBuffer()).byteLength;
  cek(
    "Gambar pratinjau benar-benar PNG yang termuat",
    gambar.status === 200 &&
      gambar.headers.get("content-type") === "image/png" &&
      ukuranGambar > 5000,
    `${ukuranGambar} bita`,
  );

  const daftarBerita = await metaBagikan("/berita");
  cek("Halaman daftar memakai judulnya sendiri", daftarBerita.judul?.includes("Berita"), daftarBerita.judul);

  const satuBerita = await metaBagikan(alamat.find((a) => a.startsWith("/berita/")));
  cek("Berita memakai judulnya sendiri", satuBerita.judul && satuBerita.judul !== beranda.judul);
  cek(
    "Gambar contoh SVG diganti gambar bawaan",
    !satuBerita.gambar?.includes(".svg") && satuBerita.gambar?.includes("opengraph-image"),
    satuBerita.gambar,
  );

  // ---------- Status 404 ----------
  for (const jalur of [
    "/halaman-ngawur",
    "/berita/tidak-ada",
    "/kegiatan/tidak-ada",
    "/galeri/tidak-ada",
    "/keuangan/999999",
    "/rw/9",
    "/rw/9/berita",
    "/rw/9/keuangan",
    "/rw/abc/galeri",
  ]) {
    const r = await ambil(jalur);
    const isi = await r.text();
    cek(
      `${jalur} dijawab 404 dengan halaman buatan sendiri`,
      r.status === 404 && isi.includes("Halaman tidak ditemukan"),
      `status ${r.status}`,
    );
  }

  // ---------- Kebijakan konten ----------
  const kepala = await ambil("/");
  const csp = kepala.headers.get("content-security-policy") ?? "";
  cek("Header CSP terpasang", csp.includes("default-src 'self'"));
  cek("CSP melarang situs ini dibingkai", csp.includes("frame-ancestors 'none'"));
  cek("CSP melarang plugin dan penggantian base", csp.includes("object-src 'none'") && csp.includes("base-uri 'self'"));
  cek(
    "CSP produksi tanpa unsafe-eval",
    process.env.UJI_DEV === "1" || !csp.includes("unsafe-eval"),
  );

  // ---------- Di peramban ----------
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const galatKonsol = [];
  page.on("console", (m) => {
    if (m.type() === "error") galatKonsol.push(m.text());
  });

  await page.goto(`${DASAR}/rw/1`, { waitUntil: "load" });

  const asalDitolak = await page.evaluate(
    () =>
      new Promise((selesai) => {
        document.addEventListener("securitypolicyviolation", (e) => selesai(e.effectiveDirective), {
          once: true,
        });
        const skrip = document.createElement("script");
        skrip.src = "https://contoh.invalid/jahat.js";
        document.head.append(skrip);
        setTimeout(() => selesai(null), 3000);
      }),
  );
  cek("Skrip dari situs luar ditolak CSP", asalDitolak?.startsWith("script-src"), asalDitolak);
  galatKonsol.length = 0; // Penolakan barusan memang sengaja dipancing.

  const gambarHalaman = await page.evaluate(() => ({
    semua: document.images.length,
    bukanNext: [...document.images].filter((g) => !g.hasAttribute("data-nimg")).length,
  }));
  cek(
    "Seluruh gambar memakai next/image",
    gambarHalaman.semua > 0 && gambarHalaman.bukanNext === 0,
    `${gambarHalaman.semua} gambar`,
  );

  // Berkas font yang terunduh belum tentu terpakai: variabel CSS yang salah tempat
  // membuat peramban diam-diam jatuh ke font sistem tanpa galat apa pun.
  const font = await page.evaluate(async () => {
    await document.fonts.ready;
    return {
      teks: getComputedStyle(document.querySelector("main p")).fontFamily,
      judul: getComputedStyle(document.querySelector(".judul")).fontFamily,
      termuat: [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family),
    };
  });
  cek("Isi halaman memakai font teks", font.teks.startsWith("teks"), font.teks.slice(0, 40));
  cek("Judul memakai font judul", font.judul.startsWith("judul"), font.judul.slice(0, 40));
  cek(
    "Kedua font benar-benar termuat",
    font.termuat.includes("teks") && font.termuat.includes("judul"),
    font.termuat.join(", "),
  );

  const ikon = await page.locator('link[rel="icon"]').first().getAttribute("href");
  const adaIkon = await ambil(ikon);
  cek("Ikon situs tersedia", adaIkon.status === 200, ikon);

  // Papan ketik: Tab pertama harus mendarat di tautan lewati, lalu Enter
  // memindahkan fokus melewati kop.
  await page.goto(`${DASAR}/`, { waitUntil: "load" });
  await page.keyboard.press("Tab");
  const fokusPertama = await page.evaluate(() => {
    const el = document.activeElement;
    const kotak = el.getBoundingClientRect();
    const gaya = getComputedStyle(el);
    return {
      teks: el.textContent?.trim(),
      tampak: kotak.top >= 0 && kotak.bottom <= window.innerHeight,
      garis: gaya.outlineStyle,
    };
  });
  cek("Tab pertama mendarat di tautan lewati", fokusPertama.teks === "Lewati ke konten utama");
  cek("Tautan lewati tampak saat difokus", fokusPertama.tampak);
  cek("Penanda fokus terlihat", fokusPertama.garis === "solid", fokusPertama.garis);

  await page.keyboard.press("Enter");
  await page.waitForFunction(() => location.hash === "#konten");
  await page.keyboard.press("Tab");
  const fokusBerikut = await page.evaluate(() =>
    Boolean(document.activeElement.closest("#konten")),
  );
  cek("Tab berikutnya sudah berada di dalam konten", fokusBerikut);

  // Kolom isian memakai outline-none; penanda fokusnya tetap harus ada.
  await page.goto(`${DASAR}/masuk`, { waitUntil: "load" });
  await page.locator("#email").focus();
  const garisKolom = await page.locator("#email").evaluate((el) => getComputedStyle(el).outlineStyle);
  cek("Kolom isian punya penanda fokus", garisKolom === "solid", garisKolom);

  // Kerangka muat: permintaan isi halaman ditahan supaya kerangkanya sempat tampak.
  // Tautan di-prefetch lebih dulu dan kerangkanya ikut dalam prefetch itu, jadi
  // penahanan baru dipasang setelah prefetch sempat selesai.
  await page.goto(`${DASAR}/`, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  const tahan = (url) => url.pathname.startsWith("/berita") && url.search.includes("_rsc=");
  await page.route(tahan, async (rute) => {
    await new Promise((r) => setTimeout(r, 1500));
    await rute.continue().catch(() => {});
  });
  await page.locator('header nav a:has-text("Berita")').first().click();
  const kerangka = await page
    .waitForSelector("[data-kerangka-muat]", { timeout: 4000 })
    .then(() => true)
    .catch(() => false);
  cek("Kerangka muat tampil saat isi belum sampai", kerangka);
  await page.waitForURL(/\/berita/, { timeout: 15000 });
  await page.waitForSelector("h1", { timeout: 15000 });
  cek("Isi halaman menggantikan kerangka muat", (await page.locator("[data-kerangka-muat]").count()) === 0);
  await page.unroute(tahan);

  // Peta: pustakanya baru dimuat saat terlihat, dan titik usaha tampil sesuai lingkupnya.
  const pustakaPeta = [];
  page.on("response", (r) => {
    if (/leaflet/i.test(r.url())) pustakaPeta.push(r.url());
  });
  await page.goto(`${DASAR}/`, { waitUntil: "load" });
  await page.waitForTimeout(600);
  cek("Peta beranda belum dimuat sebelum digulir", (await page.locator(".leaflet-container").count()) === 0);
  await page.locator('main .isolate').first().scrollIntoViewIfNeeded();
  await page.waitForSelector(".pin-usaha", { state: "attached", timeout: 15000 });
  cek("Peta beranda muncul setelah digulir", (await page.locator(".leaflet-marker-pane .pin-usaha").count()) === 26);

  await page.goto(`${DASAR}/rw/3/peta`, { waitUntil: "load" });
  await page.waitForSelector(".leaflet-marker-pane .pin-usaha", { state: "attached", timeout: 15000 });
  cek("Peta RW 03 hanya memuat titik RW 03", (await page.locator(".leaflet-marker-pane .pin-rw-1").count()) === 0);

  await page.goto(`${DASAR}/rw/2/peta`, { waitUntil: "load" });
  cek("RW tanpa data usaha tetap punya halaman peta", (await page.locator("text=Belum ada usaha RW 02 di peta").count()) === 1);

  const kebijakan = kepala.headers.get("content-security-policy") ?? "";
  cek("CSP mengizinkan kepingan OpenStreetMap", kebijakan.includes("https://tile.openstreetmap.org"));

  cek(
    "Tidak ada galat konsol di halaman yang diuji",
    galatKonsol.filter((g) => !g.includes("tile.openstreetmap")).length === 0,
    galatKonsol[0],
  );
  await ctx.close();

  // Sasaran #konten harus ada di setiap kerangka halaman, termasuk panel.
  const ctxPanel = await browser.newContext();
  const panel = await ctxPanel.newPage();
  await panel.goto(`${DASAR}/masuk`);
  cek("Halaman masuk punya sasaran lewati", (await panel.locator("main#konten").count()) === 1);
  await panel.fill("#email", "admin@sanggrahan.id");
  await panel.fill("#kataSandi", SANDI);
  await panel.click('form:has(#kataSandi) button[type="submit"]');
  await panel.waitForURL(/\/admin/, { timeout: 20000 });
  cek("Panel punya sasaran lewati", (await panel.locator("main#konten").count()) === 1);
  await panel.goto(`${DASAR}/halaman-ngawur`);
  cek("Halaman 404 punya sasaran lewati", (await panel.locator("main#konten").count()) === 1);
  await ctxPanel.close();
} finally {
  await browser.close();
}

console.log(gagal === 0 ? "\nSemua uji SEO dan aksesibilitas lulus." : `\n${gagal} uji gagal.`);
process.exitCode = gagal === 0 ? 0 : 1;
