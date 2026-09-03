/**
 * QC tampilan: membuka setiap halaman pada tiga ukuran layar, lalu memeriksa
 * galat konsol, permintaan gagal, gulir mendatar, gambar rusak, dan hierarki judul.
 * Jalankan dengan server hidup: node uji/qc-tampilan.mjs
 */
import { chromium } from "playwright";

const DASAR = process.env.DASAR ?? "http://localhost:3000";
const SANDI = "sanggrahan123";
const TEMBAKAN = process.env.SHOT_DIR;

const UKURAN = [
  { nama: "seluler", width: 390, height: 844 },
  { nama: "tablet", width: 768, height: 1024 },
  { nama: "desktop", width: 1440, height: 900 },
];

const HALAMAN_PUBLIK = [
  ["beranda", "/"],
  ["berita", "/berita"],
  ["berita-detail", "/berita/kerja-bakti-serentak-bersihkan-saluran-air-jelang-musim-hujan"],
  ["kegiatan", "/kegiatan"],
  ["kegiatan-arsip", "/kegiatan?tampil=lampau"],
  ["keuangan", "/keuangan"],
  ["keuangan-rt", "/keuangan?rt=1&tahun=2026"],
  ["profil", "/profil"],
  ["data-warga", "/data-warga"],
  ["data-warga-rt", "/data-warga?rt=3"],
  ["galeri", "/galeri"],
  ["galeri-album", "/galeri/kerja-bakti-saluran-air"],
  ["masuk", "/masuk"],
];

const HALAMAN_ADMIN = [
  ["admin-dasbor", "/admin"],
  ["admin-persetujuan", "/admin/persetujuan"],
  ["admin-keuangan", "/admin/keuangan"],
  ["admin-berita", "/admin/berita"],
  ["admin-berita-baru", "/admin/berita/baru"],
  ["admin-kegiatan", "/admin/kegiatan"],
  ["admin-pengumuman", "/admin/pengumuman"],
  ["admin-galeri", "/admin/galeri"],
  ["admin-warga", "/admin/warga"],
  ["admin-pengurus", "/admin/pengurus"],
  ["admin-pengguna", "/admin/pengguna"],
  ["admin-pengaturan", "/admin/pengaturan"],
];

const temuan = [];
const lapor = (tingkat, halaman, ukuran, pesan) =>
  temuan.push({ tingkat, halaman, ukuran, pesan });

async function periksa(page, nama, ukuran, jalur) {
  const galatKonsol = [];
  const gagalMuat = [];

  const onConsole = (m) => {
    if (m.type() === "error") galatKonsol.push(m.text());
  };
  const onFailed = (r) => gagalMuat.push(`${r.url()} (${r.failure()?.errorText})`);
  const onResponse = (r) => {
    if (r.status() >= 400 && !r.url().includes("/_next/")) {
      gagalMuat.push(`${r.status()} ${r.url()}`);
    }
  };

  page.on("console", onConsole);
  page.on("requestfailed", onFailed);
  page.on("response", onResponse);

  const resp = await page.goto(DASAR + jalur, { waitUntil: "networkidle" });

  if (!resp || resp.status() >= 400) {
    lapor("GALAT", nama, ukuran.nama, `status HTTP ${resp?.status()}`);
  }

  // Gulir mendatar: badan halaman tidak boleh lebih lebar dari layar
  const lebar = await page.evaluate(() => ({
    dokumen: document.documentElement.scrollWidth,
    layar: window.innerWidth,
  }));
  if (lebar.dokumen > lebar.layar + 1) {
    lapor(
      "GALAT",
      nama,
      ukuran.nama,
      `halaman melebar ${lebar.dokumen}px pada layar ${lebar.layar}px`,
    );
  }

  // Gambar rusak atau tanpa alt
  const gambar = await page.evaluate(() =>
    [...document.images].map((g) => ({
      src: g.currentSrc || g.src,
      rusak: g.complete && g.naturalWidth === 0,
      tanpaAlt: g.getAttribute("alt") === null,
    })),
  );
  for (const g of gambar) {
    if (g.rusak) lapor("GALAT", nama, ukuran.nama, `gambar gagal dimuat: ${g.src}`);
    if (g.tanpaAlt) lapor("PERINGATAN", nama, ukuran.nama, `gambar tanpa atribut alt: ${g.src}`);
  }

  // Struktur judul: tepat satu h1
  const jumlahH1 = await page.locator("h1").count();
  if (jumlahH1 !== 1) {
    lapor(
      jumlahH1 === 0 ? "GALAT" : "PERINGATAN",
      nama,
      ukuran.nama,
      `jumlah <h1> = ${jumlahH1} (seharusnya 1)`,
    );
  }

  // Tombol/tautan tanpa nama yang bisa dibaca pembaca layar
  const tanpaNama = await page.evaluate(() => {
    const teks = (el) =>
      (el.innerText || "").trim() ||
      el.getAttribute("aria-label") ||
      el.getAttribute("title") ||
      "";
    return [...document.querySelectorAll("button, a")].filter((el) => !teks(el)).length;
  });
  if (tanpaNama > 0) {
    lapor("PERINGATAN", nama, ukuran.nama, `${tanpaNama} tombol/tautan tanpa label teks`);
  }

  // Sasaran sentuh terlalu kecil pada seluler
  if (ukuran.width < 500) {
    const kecil = await page.evaluate(() => {
      return [...document.querySelectorAll("button, a, input, select")]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && r.height < 32;
        })
        .map((el) => (el.innerText || el.tagName).trim().slice(0, 30));
    });
    if (kecil.length > 0) {
      lapor(
        "CATATAN",
        nama,
        ukuran.nama,
        `${kecil.length} elemen interaktif < 32px tinggi: ${[...new Set(kecil)].slice(0, 4).join(", ")}`,
      );
    }
  }

  for (const g of galatKonsol) lapor("GALAT", nama, ukuran.nama, `konsol: ${g.slice(0, 160)}`);
  for (const g of gagalMuat) lapor("GALAT", nama, ukuran.nama, `permintaan: ${g.slice(0, 160)}`);

  if (TEMBAKAN && ukuran.nama === "desktop") {
    await page.screenshot({ path: `${TEMBAKAN}/${nama}.png`, fullPage: true });
  }
  if (TEMBAKAN && ukuran.nama === "seluler") {
    await page.screenshot({ path: `${TEMBAKAN}/seluler-${nama}.png`, fullPage: false });
  }

  page.off("console", onConsole);
  page.off("requestfailed", onFailed);
  page.off("response", onResponse);
}

const browser = await chromium.launch();

try {
  for (const ukuran of UKURAN) {
    // --- publik ---
    const ctx = await browser.newContext({
      viewport: { width: ukuran.width, height: ukuran.height },
    });
    const page = await ctx.newPage();
    for (const [nama, jalur] of HALAMAN_PUBLIK) {
      await periksa(page, nama, ukuran, jalur);
    }
    await ctx.close();

    // --- admin (sebagai administrator agar seluruh menu terlihat) ---
    const ctxAdmin = await browser.newContext({
      viewport: { width: ukuran.width, height: ukuran.height },
    });
    const admin = await ctxAdmin.newPage();
    await admin.goto(`${DASAR}/masuk`);
    await admin.fill("#email", "admin@rw05sanggrahan.id");
    await admin.fill("#kataSandi", SANDI);
    await admin.click('button[type="submit"]');
    await admin.waitForURL(/\/admin/, { timeout: 20000 });
    for (const [nama, jalur] of HALAMAN_ADMIN) {
      await periksa(admin, nama, ukuran, jalur);
    }
    await ctxAdmin.close();

    console.log(`selesai memeriksa ukuran ${ukuran.nama}`);
  }

  // --- Menu seluler benar-benar dapat dibuka ---
  const ctxMobil = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobil = await ctxMobil.newPage();
  await mobil.goto(`${DASAR}/`);
  await mobil.click('button[aria-label="Buka menu navigasi"]');
  const menuTampak = await mobil.locator('nav a:has-text("Keuangan")').last().isVisible();
  if (!menuTampak) lapor("GALAT", "beranda", "seluler", "menu navigasi tidak terbuka");
  await mobil.locator('nav a:has-text("Keuangan")').last().click();
  await mobil.waitForURL(/\/keuangan/, { timeout: 15000 });
  const menuTertutup =
    (await mobil.locator('nav a:has-text("Data Warga")').last().isVisible()) === false;
  if (!menuTertutup) {
    lapor("PERINGATAN", "keuangan", "seluler", "menu tidak menutup setelah berpindah halaman");
  }
  if (TEMBAKAN) await mobil.screenshot({ path: `${TEMBAKAN}/seluler-menu.png` });
  await ctxMobil.close();

  // --- Halaman tidak ditemukan ---
  const ctx404 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p404 = await ctx404.newPage();
  for (const jalur of ["/berita/tidak-ada", "/keuangan/999999", "/halaman-ngawur"]) {
    const r = await p404.goto(DASAR + jalur);
    if (r.status() !== 404) {
      lapor("GALAT", jalur, "desktop", `seharusnya 404, dapat ${r.status()}`);
    }
  }
  await ctx404.close();
} finally {
  await browser.close();
}

const galat = temuan.filter((t) => t.tingkat === "GALAT");
const peringatan = temuan.filter((t) => t.tingkat === "PERINGATAN");
const catatan = temuan.filter((t) => t.tingkat === "CATATAN");

const cetak = (daftar, judul) => {
  if (daftar.length === 0) return;
  console.log(`\n${judul} (${daftar.length})`);
  const unik = new Map();
  for (const t of daftar) {
    const kunci = `${t.pesan}`;
    if (!unik.has(kunci)) unik.set(kunci, []);
    unik.get(kunci).push(`${t.halaman}/${t.ukuran}`);
  }
  for (const [pesan, tempat] of unik) {
    console.log(`  - ${pesan}`);
    console.log(`      pada: ${tempat.slice(0, 6).join(", ")}${tempat.length > 6 ? ` (+${tempat.length - 6})` : ""}`);
  }
};

console.log(`\n=== HASIL QC TAMPILAN ===`);
cetak(galat, "GALAT");
cetak(peringatan, "PERINGATAN");
cetak(catatan, "CATATAN");
if (temuan.length === 0) console.log("Tidak ada temuan.");
console.log(
  `\nRingkasan: ${galat.length} galat, ${peringatan.length} peringatan, ${catatan.length} catatan.`,
);
process.exit(galat.length > 0 ? 1 : 0);
