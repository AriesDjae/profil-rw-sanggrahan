// Peramban bersama untuk seluruh uji Playwright.
//
// Halaman daftar memakai loading.tsx, jadi isinya menyusul lewat streaming dan bisa
// baru terlihat sesaat setelah event `load`. Pemeriksaan yang membaca teks tepat
// sesudah `goto` akan membaca kerangka muat. Daripada menambah jeda di tiap uji,
// `goto`, `reload`, dan `waitForURL` di sini baru selesai setelah kerangkanya hilang.
import { chromium } from "playwright";

const KERANGKA = "[data-kerangka-muat]";
const BATAS_TUNGGU = 15000;

async function tungguIsi(page) {
  await page
    .waitForFunction((pemilih) => !document.querySelector(pemilih), KERANGKA, {
      timeout: BATAS_TUNGGU,
    })
    // Halaman yang sudah ditutup atau sedang berpindah bukan kegagalan di sini;
    // pemeriksaan berikutnya yang akan melaporkan bila isinya memang tidak muncul.
    .catch(() => {});
}

function bungkusHalaman(page) {
  for (const nama of ["goto", "reload", "waitForURL"]) {
    const asli = page[nama].bind(page);
    page[nama] = async (...argumen) => {
      const hasil = await asli(...argumen);
      await tungguIsi(page);
      return hasil;
    };
  }
  return page;
}

export async function bukaPeramban() {
  const browser = await chromium.launch();
  const newContext = browser.newContext.bind(browser);

  browser.newContext = async (...argumen) => {
    const ctx = await newContext(...argumen);
    const newPage = ctx.newPage.bind(ctx);
    ctx.newPage = async () => bungkusHalaman(await newPage());
    return ctx;
  };

  return browser;
}
