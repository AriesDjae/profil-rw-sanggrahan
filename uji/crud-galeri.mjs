// Uji CRUD galeri lewat panel pengurus, di peramban sungguhan.
//
// Album ditempuh dari dibuat, diisi foto, tampil ke warga, sampai dihapus —
// sekaligus memastikan album satu RW tidak bocor ke galeri RW lain, dan foto
// yang diunggah benar-benar termuat (bukan sekadar tersimpan barisnya).
//
// Jalankan dengan server hidup:  DASAR=http://localhost:3311 node uji/crud-galeri.mjs
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

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

// Dua berkas PNG kecil untuk diunggah.
const dirSementara = mkdtempSync(path.join(tmpdir(), "uji-galeri-"));
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC",
  "base64",
);
const foto1 = path.join(dirSementara, "foto-satu.png");
const foto2 = path.join(dirSementara, "foto-dua.png");
writeFileSync(foto1, PNG);
writeFileSync(foto2, PNG);

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

/** Menunggu teks pesan (sukses/galat) muncul, bukan sekadar elemennya. */
async function tungguTeks(page, penggal, detik = 15) {
  const l = page.locator(`text=${penggal}`);
  await l.first().waitFor({ timeout: detik * 1000 }).catch(() => {});
  return (await l.count()) > 0;
}

const TANDA = Date.now().toString().slice(-6);
const NAMA_ALBUM = `Kerja Bakti Uji Galeri ${TANDA}`;
const NAMA_BARU = `Kerja Bakti Uji Galeri ${TANDA} (revisi)`;
const DESKRIPSI = "Dokumentasi kerja bakti membersihkan saluran air bersama warga tiga RT.";

const browser = await chromium.launch();

try {
  const ctxWarga = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const warga = await ctxWarga.newPage();
  const adaDiHalaman = async (jalur, teks) => {
    await warga.goto(`${DASAR}${jalur}`, { waitUntil: "load" });
    return (await warga.locator(`text=${teks}`).count()) > 0;
  };

  /* ------------------------------------------------------------------ */
  /* CREATE album                                                        */
  /* ------------------------------------------------------------------ */
  const sek = await masuk(browser, "sekretaris.rw1@sanggrahan.id");
  cek("Sekretaris RW 01 dapat masuk ke panel", sek.page.url().includes("/admin"));

  await sek.page.goto(`${DASAR}/admin/galeri`);
  cek(
    "Formulir album mengunci ke RW 01 (tanpa pilihan RW)",
    (await sek.page.locator("text=Tampil di").count()) > 0 &&
      (await sek.page.locator('select[name="rwId"]').count()) === 0,
  );

  // Validasi: nama album terlalu pendek.
  await sek.page.fill('input[name="nama"]', "Ab");
  await sek.page.click('button:has-text("Buat album")');
  const galatPendek = sek.page.locator('[role="alert"]', { hasText: "minimal 3 karakter" });
  await galatPendek.waitFor({ timeout: 15000 }).catch(() => {});
  cek("Nama album terlalu pendek ditolak", (await galatPendek.count()) > 0);

  await sek.page.fill('input[name="nama"]', NAMA_ALBUM);
  await sek.page.fill('textarea[name="deskripsi"]', DESKRIPSI);
  await sek.page.click('button:has-text("Buat album")');
  await sek.page.waitForURL(/\/admin\/galeri\/\d+/, { timeout: 20000 });
  const alamatAlbumAdmin = sek.page.url();
  cek("Album dibuat dan langsung dibuka", alamatAlbumAdmin.includes("/admin/galeri/"));
  cek(
    "Halaman album menyebut RW 01",
    (await sek.page.locator("body").innerText()).includes("RW 01"),
  );

  /* ------------------------------------------------------------------ */
  /* UPLOAD foto                                                         */
  /* ------------------------------------------------------------------ */
  await sek.page.setInputFiles('input[name="foto"]', [foto1, foto2]);
  await sek.page.fill('input[name="judul"]', `Dokumentasi uji ${TANDA}`);
  await sek.page.click('button:has-text("Unggah foto")');
  cek("Dua foto terunggah sekaligus", await tungguTeks(sek.page, "2 foto ditambahkan"));
  await potret(sek.page, "galeri-1-album-admin");

  await sek.page.reload();
  const jumlahFoto = await sek.page.locator('img[src^="/unggahan/galeri"]').count();
  cek("Dua foto tercatat di album", jumlahFoto === 2, `terhitung ${jumlahFoto}`);

  /* ------------------------------------------------------------------ */
  /* READ — warga                                                        */
  /* ------------------------------------------------------------------ */
  cek("Album tampil di galeri RW 01", await adaDiHalaman("/rw/1/galeri", NAMA_ALBUM));
  await potret(warga, "galeri-2-galeri-rw01");

  cek("Album ikut tampil di galeri se-kampung", await adaDiHalaman("/galeri", NAMA_ALBUM));
  cek(
    "Album RW 01 TIDAK tampil di galeri RW 02",
    !(await adaDiHalaman("/rw/2/galeri", NAMA_ALBUM)),
  );
  cek(
    "Album RW 01 TIDAK tampil di galeri RW 03",
    !(await adaDiHalaman("/rw/3/galeri", NAMA_ALBUM)),
  );

  // Beranda RW memuat petikan foto terbaru; ini menguji revalidasi laman RW.
  await warga.goto(`${DASAR}/rw/1`, { waitUntil: "load" });
  const fotoBeranda = await warga.locator('img[src^="/unggahan/galeri"]').count();
  cek(
    "Foto baru langsung muncul di petikan galeri beranda RW 01",
    fotoBeranda > 0,
    `terhitung ${fotoBeranda}`,
  );

  // Halaman album publik
  await warga.goto(`${DASAR}/rw/1/galeri`, { waitUntil: "load" });
  await warga.locator(`a:has-text("${NAMA_ALBUM}")`).first().click();
  await warga.waitForURL(/\/galeri\/.+/, { timeout: 20000 });
  const alamatAlbumPublik = warga.url();
  cek("Halaman album publik terbuka", alamatAlbumPublik.includes("/galeri/"), alamatAlbumPublik);

  const isiAlbum = await warga.locator("body").innerText();
  cek("Album publik menyebut RW 01", isiAlbum.includes("RW 01"));
  cek("Deskripsi album tampil", isiAlbum.includes("kerja bakti membersihkan saluran air"));

  // Gambar benar-benar termuat, bukan sekadar ada elemennya.
  await warga.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
  });
  await warga.waitForTimeout(800);
  const gambarRusak = await warga.evaluate(
    () => [...document.images].filter((g) => g.complete && g.naturalWidth === 0).length,
  );
  cek("Tidak ada gambar rusak di halaman album", gambarRusak === 0, `rusak ${gambarRusak}`);
  await potret(warga, "galeri-3-album-publik");

  /* ------------------------------------------------------------------ */
  /* Batas kewenangan antar-RW                                           */
  /* ------------------------------------------------------------------ */
  const sekLain = await masuk(browser, "sekretaris.rw2@sanggrahan.id");
  await sekLain.page.goto(`${DASAR}/admin/galeri`);
  cek(
    "Sekretaris RW 02 tidak melihat album RW 01 di panelnya",
    (await sekLain.page.locator(`text=${NAMA_ALBUM}`).count()) === 0,
  );

  const resp = await sekLain.page.goto(alamatAlbumAdmin);
  cek(
    "Sekretaris RW 02 ditolak saat membuka album RW 01",
    resp.status() === 404 || sekLain.page.url().includes("galat=akses"),
    `status ${resp.status()}`,
  );
  await sekLain.ctx.close();

  /* ------------------------------------------------------------------ */
  /* UPDATE album                                                        */
  /* ------------------------------------------------------------------ */
  await sek.page.goto(alamatAlbumAdmin);
  await sek.page.fill('input[name="nama"]', NAMA_BARU);
  await sek.page.click('button:has-text("Simpan album")');
  cek("Perubahan album tersimpan", await tungguTeks(sek.page, "Album diperbarui"));

  cek("Nama album baru terlihat warga", await adaDiHalaman("/rw/1/galeri", NAMA_BARU));

  // Mengganti nama album mengganti slug-nya, jadi alamat publiknya berpindah.
  // Alamat lama tidak boleh terus menyajikan salinan usang dari cache.
  const respAlamatLama = await warga.goto(alamatAlbumPublik);
  cek(
    "Alamat album yang lama tidak lagi menyajikan salinan usang",
    respAlamatLama.status() === 404,
    `status ${respAlamatLama.status()}`,
  );

  // Alamat yang berlaku sekarang, diambil sebagaimana warga menemukannya.
  await warga.goto(`${DASAR}/rw/1/galeri`, { waitUntil: "load" });
  await warga.locator(`a:has-text("${NAMA_BARU}")`).first().click();
  await warga.waitForURL(/\/galeri\/.+/, { timeout: 20000 });
  const alamatAlbumKini = warga.url();
  cek(
    "Album terbuka di alamat barunya",
    alamatAlbumKini !== alamatAlbumPublik,
    alamatAlbumKini,
  );

  /* ------------------------------------------------------------------ */
  /* DELETE satu foto                                                    */
  /* ------------------------------------------------------------------ */
  await sek.page.goto(alamatAlbumAdmin);
  sek.page.once("dialog", (d) => d.accept());
  await sek.page.locator('button:has-text("Hapus")').last().click();
  await sek.page.waitForTimeout(2000);
  await sek.page.reload();
  const sisaFoto = await sek.page.locator('img[src^="/unggahan/galeri"]').count();
  cek("Satu foto terhapus, satu tersisa", sisaFoto === 1, `tersisa ${sisaFoto}`);

  /* ------------------------------------------------------------------ */
  /* DELETE album                                                        */
  /* ------------------------------------------------------------------ */
  await sek.page.goto(alamatAlbumAdmin);
  sek.page.once("dialog", (d) => d.accept());
  await sek.page.click('button:has-text("Hapus album")');
  await sek.page.waitForURL(/\/admin\/galeri\?/, { timeout: 20000 });
  cek(
    "Album terhapus dari panel",
    (await sek.page.locator(`text=${NAMA_BARU}`).count()) === 0,
  );

  const respHapus = await warga.goto(alamatAlbumKini);
  cek(
    "Album yang dihapus tidak dapat diakses publik",
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
    ? `\nSEMUA ${nomor} UJI GALERI LULUS`
    : `\n${gagal} dari ${nomor} UJI GALERI GAGAL`,
);
process.exit(gagal === 0 ? 0 : 1);
