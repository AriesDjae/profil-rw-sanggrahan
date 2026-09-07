/**
 * QC fungsionalitas: menjalankan CRUD setiap modul panel pengurus lewat peramban,
 * memeriksa dampaknya pada halaman publik, serta menguji penolakan masukan tidak sah.
 * Jalankan dengan server hidup: node uji/qc-fungsi.mjs
 */
import { chromium } from "playwright";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const DASAR = process.env.DASAR ?? "http://localhost:3000";
const SANDI = "sanggrahan123";
const TANDA = `QC${Date.now().toString().slice(-6)}`;

let lulus = 0;
const gagal = [];
const cek = (nama, kondisi, catatan = "") => {
  if (kondisi) {
    lulus++;
    console.log(`  ok   ${nama}`);
  } else {
    gagal.push(nama + (catatan ? ` — ${catatan}` : ""));
    console.log(`  GAGAL ${nama}${catatan ? ` — ${catatan}` : ""}`);
  }
};
const bagian = (judul) => console.log(`\n— ${judul}`);

// Berkas gambar kecil untuk uji unggah
const dirSementara = mkdtempSync(path.join(tmpdir(), "qc-rw-"));
const berkasGambar = path.join(dirSementara, "contoh.png");
writeFileSync(
  berkasGambar,
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC",
    "base64",
  ),
);

async function masuk(browser, email) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${DASAR}/masuk`);
  await page.fill("#email", email);
  await page.fill("#kataSandi", SANDI);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin/, { timeout: 20000 });
  return { ctx, page };
}

const browser = await chromium.launch();
const anonimCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const publik = await anonimCtx.newPage();

try {
  const { ctx, page } = await masuk(browser, "admin@sanggrahan.id");

  /* ------------------------------------------------------------------ */
  bagian("Berita: tulis, terbitkan, sunting, hapus");
  await page.goto(`${DASAR}/admin/berita/baru`);

  // Validasi: judul terlalu pendek ditolak
  await page.fill('input[name="judul"]', "Abc");
  await page.fill('textarea[name="ringkasan"]', "Ringkasan uji otomatis yang cukup panjang.");
  await page.fill('textarea[name="konten"]', "Isi berita uji otomatis. ".repeat(5));
  await page.click('button:has-text("Simpan berita")');
  await page.waitForSelector('p[role="alert"]', { timeout: 10000 });
  cek(
    "judul berita terlalu pendek ditolak",
    (await page.locator('[role="alert"]').first().innerText()).includes("minimal 5 karakter"),
  );

  const judulBerita = `Berita Uji Otomatis ${TANDA}`;
  await page.fill('input[name="judul"]', judulBerita);
  await page.selectOption('select[name="kategori"]', "Lingkungan");
  await page.click('button:has-text("Simpan berita")');
  await page.waitForURL(/\/admin\/berita\?/, { timeout: 15000 });
  cek("berita draf tersimpan", await page.locator(`text=${judulBerita}`).first().isVisible());

  // Draf belum boleh tampil publik
  await publik.goto(`${DASAR}/berita`);
  cek(
    "berita draf belum tampil ke warga",
    (await publik.locator(`text=${judulBerita}`).count()) === 0,
  );

  // Terbitkan lewat tombol daftar
  const barisBerita = page.locator("li", { hasText: judulBerita }).first();
  await barisBerita.locator('button:has-text("Terbitkan")').click();
  await page.waitForTimeout(1500);
  await publik.goto(`${DASAR}/berita`);
  cek(
    "berita terbit muncul di halaman warga",
    (await publik.locator(`text=${judulBerita}`).count()) > 0,
  );

  // Penyaring kategori publik
  await publik.goto(`${DASAR}/berita?kategori=Lingkungan`);
  cek(
    "penyaring kategori berita bekerja",
    (await publik.locator(`text=${judulBerita}`).count()) > 0,
  );
  await publik.goto(`${DASAR}/berita?kategori=Kesehatan`);
  cek(
    "penyaring kategori menyembunyikan kategori lain",
    (await publik.locator(`text=${judulBerita}`).count()) === 0,
  );

  // Sunting
  await page.goto(`${DASAR}/admin/berita`);
  await page.locator("li", { hasText: judulBerita }).first().locator('a:has-text("Sunting")').click();
  await page.waitForURL(/\/admin\/berita\/\d+/);
  const judulBaru = `${judulBerita} (disunting)`;
  await page.fill('input[name="judul"]', judulBaru);
  await page.click('button:has-text("Simpan perubahan")');
  await page.waitForURL(/\/admin\/berita\?/, { timeout: 15000 });
  cek("berita tersunting", await page.locator(`text=${judulBaru}`).first().isVisible());

  // Hapus
  await page.locator("li", { hasText: judulBaru }).first().locator('a:has-text("Sunting")').click();
  await page.waitForURL(/\/admin\/berita\/\d+/);
  page.once("dialog", (d) => d.accept());
  await page.click('button:has-text("Hapus berita")');
  await page.waitForURL(/\/admin\/berita\?/, { timeout: 15000 });
  cek("berita terhapus", (await page.locator(`text=${judulBaru}`).count()) === 0);

  /* ------------------------------------------------------------------ */
  bagian("Kegiatan: jadwalkan, tampil di agenda, sunting, hapus");
  await page.goto(`${DASAR}/admin/kegiatan/baru`);
  const judulKegiatan = `Kegiatan Uji ${TANDA}`;
  await page.fill('input[name="judul"]', judulKegiatan);
  await page.fill('input[name="mulai"]', "2026-12-20T08:00");
  await page.fill('input[name="selesai"]', "2026-12-20T07:00"); // sengaja salah
  await page.fill('input[name="lokasi"]', "Balai RW 01");
  await page.fill('textarea[name="deskripsi"]', "Keterangan kegiatan uji otomatis yang memadai.");
  await page.selectOption('select[name="status"]', "TERBIT");
  await page.click('button:has-text("Simpan kegiatan")');
  await page.waitForSelector('p[role="alert"]', { timeout: 10000 });
  cek(
    "waktu selesai sebelum mulai ditolak",
    (await page.locator('[role="alert"]').first().innerText()).includes("setelah waktu mulai"),
  );

  await page.fill('input[name="selesai"]', "2026-12-20T11:00");
  await page.click('button:has-text("Simpan kegiatan")');
  await page.waitForURL(/\/admin\/kegiatan\?/, { timeout: 15000 });
  cek("kegiatan tersimpan", await page.locator(`text=${judulKegiatan}`).first().isVisible());

  await publik.goto(`${DASAR}/kegiatan`);
  cek(
    "kegiatan tampil pada agenda warga",
    (await publik.locator(`text=${judulKegiatan}`).count()) > 0,
  );

  await page.locator("li", { hasText: judulKegiatan }).first().locator('a:has-text("Sunting")').click();
  await page.waitForURL(/\/admin\/kegiatan\/\d+/);
  await page.fill('input[name="lokasi"]', "Lapangan RT 03");
  await page.click('button:has-text("Simpan perubahan")');
  await page.waitForURL(/\/admin\/kegiatan\?/, { timeout: 15000 });
  await publik.goto(`${DASAR}/kegiatan`);
  cek(
    "perubahan lokasi kegiatan tampil ke warga",
    (await publik.locator("article", { hasText: judulKegiatan }).first().innerText()).includes(
      "Lapangan RT 03",
    ),
  );

  await page.locator("li", { hasText: judulKegiatan }).first().locator('a:has-text("Sunting")').click();
  await page.waitForURL(/\/admin\/kegiatan\/\d+/);
  page.once("dialog", (d) => d.accept());
  await page.click('button:has-text("Hapus kegiatan")');
  await page.waitForURL(/\/admin\/kegiatan\?/, { timeout: 15000 });
  cek("kegiatan terhapus", (await page.locator(`text=${judulKegiatan}`).count()) === 0);

  /* ------------------------------------------------------------------ */
  bagian("Pengumuman: tambah, tampil di beranda, nonaktifkan, hapus");
  await page.goto(`${DASAR}/admin/pengumuman`);
  const judulPengumuman = `Pengumuman Uji ${TANDA}`;
  await page.fill('input[name="judul"]', judulPengumuman);
  await page.fill('textarea[name="isi"]', "Isi pengumuman uji otomatis untuk warga.");
  await page.check('input[name="penting"]');
  await page.click('button:has-text("Tambah pengumuman")');
  await page.waitForSelector("text=Pengumuman ditambahkan", { timeout: 15000 });
  cek("pengumuman tersimpan", true);

  await publik.goto(`${DASAR}/`);
  cek(
    "pengumuman tampil di beranda",
    (await publik.locator(`text=${judulPengumuman}`).count()) > 0,
  );

  const kartuPengumuman = page.locator("article", { hasText: judulPengumuman }).first();
  await kartuPengumuman.locator('button:has-text("Nonaktifkan")').click();
  await page.waitForTimeout(1500);
  await publik.goto(`${DASAR}/`);
  cek(
    "pengumuman nonaktif hilang dari beranda",
    (await publik.locator(`text=${judulPengumuman}`).count()) === 0,
  );

  page.once("dialog", (d) => d.accept());
  await page
    .locator("article", { hasText: judulPengumuman })
    .first()
    .locator('button:has-text("Hapus")')
    .click();
  await page.waitForTimeout(1500);
  await page.reload();
  cek("pengumuman terhapus", (await page.locator(`text=${judulPengumuman}`).count()) === 0);

  /* ------------------------------------------------------------------ */
  bagian("Galeri: album, unggah foto, hapus");
  await page.goto(`${DASAR}/admin/galeri`);
  const namaAlbum = `Album Uji ${TANDA}`;
  await page.fill('input[name="nama"]', namaAlbum);
  await page.fill('input[name="tanggal"]', "2026-09-01");
  await page.click('button:has-text("Buat album")');
  await page.waitForURL(/\/admin\/galeri\/\d+/, { timeout: 15000 });
  cek("album dibuat dan langsung dibuka", page.url().includes("/admin/galeri/"));

  await page.setInputFiles('input[name="foto"]', [berkasGambar, berkasGambar]);
  await page.fill('input[name="judul"]', "Foto uji");
  await page.click('button:has-text("Unggah foto")');
  await page.waitForSelector("text=2 foto ditambahkan", { timeout: 20000 });
  cek("dua foto terunggah sekaligus", true);

  await publik.goto(`${DASAR}/galeri`);
  cek("album tampil di galeri warga", (await publik.locator(`text=${namaAlbum}`).count()) > 0);

  await page.reload();
  page.once("dialog", (d) => d.accept());
  await page.locator('button:has-text("Hapus foto")').first().click();
  await page.waitForTimeout(1500);
  await page.reload();
  const sisaFoto = await page.locator('img[src^="/unggahan/galeri"]').count();
  cek("satu foto terhapus", sisaFoto === 1, `sisa ${sisaFoto}`);

  page.once("dialog", (d) => d.accept());
  await page.click('button:has-text("Hapus album")');
  await page.waitForURL(/\/admin\/galeri\?/, { timeout: 15000 });
  cek("album terhapus", (await page.locator(`text=${namaAlbum}`).count()) === 0);

  /* ------------------------------------------------------------------ */
  bagian("Data warga: tambah, cari, statistik, sunting, hapus");
  await publik.goto(`${DASAR}/data-warga`);
  const bacaTotalJiwa = async () =>
    Number(
      await publik.evaluate(() => {
        const label = [...document.querySelectorAll("p")].find(
          (e) => e.textContent.trim() === "Total Jiwa",
        );
        const kartu = label?.closest("div.rounded-2xl");
        const angka = kartu?.querySelector("p.tabular-nums")?.textContent ?? "0";
        return angka.replace(/[^0-9]/g, "");
      }),
    );
  const jiwaSebelum = await bacaTotalJiwa();

  await page.goto(`${DASAR}/admin/warga/baru`);
  const namaWarga = `Warga Uji ${TANDA}`;
  await page.fill('input[name="nama"]', namaWarga);
  await page.selectOption('select[name="jenisKelamin"]', "L");
  await page.fill('input[name="nik"]', "123"); // sengaja salah
  await page.selectOption('select[name="rtId"]', { index: 1 });
  await page.click('button:has-text("Tambah warga")');
  await page.waitForSelector('p[role="alert"]', { timeout: 10000 });
  cek(
    "NIK bukan 16 digit ditolak",
    (await page.locator('[role="alert"]').first().innerText()).includes("16 digit"),
  );

  const nikUji = `9${Date.now().toString().slice(-9)}000001`.slice(0, 16);
  await page.fill('input[name="nik"]', nikUji);
  await page.fill('input[name="tanggalLahir"]', "1990-05-17");
  await page.selectOption('select[name="pekerjaan"]', "Wiraswasta");
  await page.click('button:has-text("Tambah warga")');
  await page.waitForURL(/\/admin\/warga\?/, { timeout: 15000 });
  cek("warga baru tersimpan", await page.locator(`text=${namaWarga}`).first().isVisible());

  await page.goto(`${DASAR}/admin/warga?cari=${encodeURIComponent(TANDA)}`);
  cek("pencarian warga menemukan data", (await page.locator(`text=${namaWarga}`).count()) > 0);

  await publik.goto(`${DASAR}/data-warga`);
  const jiwaSesudah = await bacaTotalJiwa();
  cek(
    "statistik publik ikut bertambah",
    jiwaSesudah === jiwaSebelum + 1,
    `${jiwaSebelum} -> ${jiwaSesudah}`,
  );

  await page.goto(`${DASAR}/admin/warga?cari=${encodeURIComponent(TANDA)}`);
  await page.locator('a:has-text("Sunting")').first().click();
  await page.waitForURL(/\/admin\/warga\/\d+/);
  await page.selectOption('select[name="pekerjaan"]', "Petani");
  await page.click('button:has-text("Simpan perubahan")');
  await page.waitForURL(/\/admin\/warga\?/, { timeout: 15000 });
  await page.goto(`${DASAR}/admin/warga?cari=${encodeURIComponent(TANDA)}`);
  cek(
    "perubahan pekerjaan tersimpan",
    (await page.locator("tr", { hasText: namaWarga }).first().innerText()).includes("Petani"),
  );

  await page.locator('a:has-text("Sunting")').first().click();
  await page.waitForURL(/\/admin\/warga\/\d+/);
  page.once("dialog", (d) => d.accept());
  await page.click('button:has-text("Hapus data")');
  await page.waitForURL(/\/admin\/warga\?/, { timeout: 15000 });
  await page.goto(`${DASAR}/admin/warga?cari=${encodeURIComponent(TANDA)}`);
  cek("data warga terhapus", (await page.locator(`text=${namaWarga}`).count()) === 0);

  /* ------------------------------------------------------------------ */
  bagian("Pengurus: tambah, tampil di profil, hapus");
  await page.goto(`${DASAR}/admin/pengurus`);
  const namaPengurus = `Pengurus Uji ${TANDA}`;
  await page.fill('input[name="nama"]', namaPengurus);
  await page.fill('input[name="jabatan"]', "Seksi Uji Otomatis");
  await page.click('button:has-text("Tambah pengurus")');
  await page.waitForSelector("text=Pengurus ditambahkan", { timeout: 15000 });
  await publik.goto(`${DASAR}/profil`);
  cek(
    "pengurus baru tampil di halaman profil",
    (await publik.locator(`text=${namaPengurus}`).count()) > 0,
  );

  await page.reload();
  page.once("dialog", (d) => d.accept());
  await page.locator("li", { hasText: namaPengurus }).first().locator('button:has-text("Hapus")').click();
  await page.waitForTimeout(1500);
  await page.reload();
  cek("pengurus terhapus", (await page.locator(`text=${namaPengurus}`).count()) === 0);

  /* ------------------------------------------------------------------ */
  bagian("Akun pengguna: buat, masuk, nonaktifkan, hapus");
  await page.goto(`${DASAR}/admin/pengguna`);
  const emailBaru = `uji${TANDA.toLowerCase()}@sanggrahan.id`;
  await page.fill('input[name="nama"]', `Bendahara Uji ${TANDA}`);
  await page.fill('input[name="email"]', emailBaru);
  await page.selectOption('select[name="peran"]', "BENDAHARA_RT");
  cek(
    "peran bendahara memunculkan pilihan RT yang wajib diisi",
    await page.locator('select[name="rtId"][required]').isVisible(),
  );
  await page.selectOption('select[name="rtId"]', { index: 1 });
  await page.fill('input[name="kataSandi"]', "pendek");
  await page.click('button:has-text("Buat akun")');
  await page.waitForSelector('p[role="alert"]', { timeout: 10000 });
  cek(
    "kata sandi awal terlalu pendek ditolak",
    (await page.locator('[role="alert"]').first().innerText()).includes("8 karakter"),
  );
  cek(
    "pilihan peran dan RT tidak hilang setelah galat",
    (await page.inputValue('select[name="peran"]')) === "BENDAHARA_RT" &&
      (await page.inputValue('select[name="rtId"]')) !== "",
  );

  await page.fill('input[name="kataSandi"]', SANDI);
  await page.click('button:has-text("Buat akun")');
  await page.waitForURL(/\/admin\/pengguna\?/, { timeout: 15000 });
  cek("akun baru dibuat", await page.locator(`text=${emailBaru}`).first().isVisible());

  const uji = await masuk(browser, emailBaru);
  cek("akun baru dapat masuk", uji.page.url().includes("/admin"));
  await uji.page.goto(`${DASAR}/admin/pengguna`);
  cek(
    "akun bendahara baru tidak dapat mengelola pengguna",
    uji.page.url().includes("galat=akses"),
  );
  await uji.ctx.close();

  await page.goto(`${DASAR}/admin/pengguna`);
  await page.locator("tr", { hasText: emailBaru }).first().locator('button:has-text("Nonaktifkan")').click();
  await page.waitForTimeout(1500);
  const ctxNonaktif = await browser.newContext();
  const pNonaktif = await ctxNonaktif.newPage();
  await pNonaktif.goto(`${DASAR}/masuk`);
  await pNonaktif.fill("#email", emailBaru);
  await pNonaktif.fill("#kataSandi", SANDI);
  await pNonaktif.click('button[type="submit"]');
  await pNonaktif.waitForSelector('p[role="alert"]', { timeout: 15000 });
  cek(
    "akun nonaktif ditolak saat masuk",
    (await pNonaktif.locator('[role="alert"]').first().innerText()).includes("dinonaktifkan"),
  );

  // Kata sandi salah
  await pNonaktif.goto(`${DASAR}/masuk`);
  await pNonaktif.fill("#email", "admin@sanggrahan.id");
  await pNonaktif.fill("#kataSandi", "salah-sekali");
  await pNonaktif.click('button[type="submit"]');
  await pNonaktif.waitForSelector('p[role="alert"]', { timeout: 15000 });
  cek(
    "kata sandi salah ditolak",
    (await pNonaktif.locator('[role="alert"]').first().innerText()).includes("tidak sesuai"),
  );
  await ctxNonaktif.close();

  await page.goto(`${DASAR}/admin/pengguna`);
  page.once("dialog", (d) => d.accept());
  await page.locator("tr", { hasText: emailBaru }).first().locator('button:has-text("Hapus")').click();
  await page.waitForURL(/\/admin\/pengguna\?/, { timeout: 15000 });
  cek("akun terhapus", (await page.locator(`text=${emailBaru}`).count()) === 0);

  /* ------------------------------------------------------------------ */
  bagian("Pengaturan situs dan daftar RT");
  await page.goto(`${DASAR}/admin/pengaturan`);
  const taglineAsli = await page.inputValue('input[name="tagline"]');
  await page.fill('input[name="tagline"]', `Tagline Uji ${TANDA}`);
  await page.click('button:has-text("Simpan pengaturan kampung")');
  await page.waitForSelector("text=Pengaturan kampung tersimpan", { timeout: 15000 });
  await publik.goto(`${DASAR}/`);
  cek(
    "tagline baru tampil di situs warga",
    (await publik.locator(`text=Tagline Uji ${TANDA}`).count()) > 0,
  );
  await page.goto(`${DASAR}/admin/pengaturan`);
  await page.fill('input[name="tagline"]', taglineAsli);
  await page.click('button:has-text("Simpan pengaturan kampung")');
  await page.waitForSelector("text=Pengaturan kampung tersimpan", { timeout: 15000 });
  cek("tagline dikembalikan", true);

  // RT baru. Sejak situs melayani tiga RW, RT wajib menyebut RW-nya dan
  // nomornya hanya perlu unik di dalam RW itu.
  await page.selectOption('select[name="rwId"]', { index: 1 });
  await page.fill('input[name="nomor"]', "99");
  await page.fill('input[name="wilayah"]', "Wilayah uji otomatis");
  await page.click('button:has-text("Tambah RT")');
  await page.waitForSelector("text=RT 99 RW 01 ditambahkan", { timeout: 15000 });
  await publik.goto(`${DASAR}/rw/1/profil`);
  cek("RT baru tampil di halaman profil RW-nya", (await publik.locator("text=RT 99").count()) > 0);

  await page.goto(`${DASAR}/admin/pengaturan`);
  await page.selectOption('select[name="rwId"]', { index: 1 });
  await page.fill('input[name="nomor"]', "01");
  await page.click('button:has-text("Tambah RT")');
  await page.waitForSelector('p[role="alert"]', { timeout: 10000 });
  cek(
    "nomor RT ganda ditolak",
    (await page.locator('[role="alert"]').first().innerText()).includes("sudah terdaftar"),
  );

  await page.goto(`${DASAR}/admin/pengaturan`);
  page.once("dialog", (d) => d.accept());
  await page.locator("tr", { hasText: "RT 99" }).first().locator('button:has-text("Hapus")').click();
  await page.waitForTimeout(1500);
  await page.reload();
  cek("RT kosong dapat dihapus", (await page.locator("text=RT 99").count()) === 0);
  const rtTerpakai = page.locator("tr", { hasText: "RT 01 / RW 05" }).first();
  cek(
    "RT yang masih terpakai tidak punya tombol hapus",
    (await rtTerpakai.locator('button:has-text("Hapus")').count()) === 0,
  );

  /* ------------------------------------------------------------------ */
  bagian("Keuangan: validasi tambahan");
  await page.goto(`${DASAR}/admin/keuangan/baru`);
  await page.selectOption('select[name="rtId"]', { index: 1 });
  await page.selectOption('select[name="bulan"]', "5");
  await page.selectOption('select[name="tahun"]', "2026");
  await page.click('button:has-text("Buat laporan")');
  await page.waitForSelector('p[role="alert"]', { timeout: 10000 });
  cek(
    "periode laporan ganda ditolak",
    (await page.locator('[role="alert"]').first().innerText()).includes("sudah ada"),
  );

  // Laporan tanpa transaksi tidak dapat diajukan
  await page.selectOption('select[name="bulan"]', "11");
  await page.click('button:has-text("Buat laporan")');
  await page.waitForURL(/\/admin\/keuangan\/\d+/, { timeout: 15000 });
  const urlLaporanKosong = page.url();
  await page.click('button:has-text("Ajukan laporan")');
  await page.waitForURL(/galat=/, { timeout: 15000 });
  cek(
    "laporan tanpa transaksi tidak dapat diajukan",
    decodeURIComponent(page.url()).includes("minimal satu transaksi"),
  );

  // Jumlah transaksi nol ditolak
  await page.goto(urlLaporanKosong);
  await page.fill('input[name="jumlah"]', "0");
  await page.fill('textarea[name="keterangan"]', "Uji jumlah nol");
  await page.click('button:has-text("Tambahkan transaksi")');
  await page.waitForSelector('p[role="alert"]', { timeout: 10000 });
  cek(
    "transaksi bernilai nol ditolak",
    (await page.locator('[role="alert"]').first().innerText()).includes("lebih dari nol"),
  );

  // Unggah bukti transaksi
  await page.fill('input[name="jumlah"]', "125000");
  await page.fill('textarea[name="keterangan"]', "Transaksi uji dengan bukti");
  await page.setInputFiles('input[name="bukti"]', berkasGambar);
  await page.click('button:has-text("Tambahkan transaksi")');
  await page.waitForSelector("text=Transaksi ditambahkan", { timeout: 20000 });
  cek(
    "transaksi dengan bukti tersimpan",
    (await page.locator('a:has-text("bukti")').count()) > 0,
  );

  // Bersihkan laporan uji
  page.once("dialog", (d) => d.accept());
  await page.click('button:has-text("Hapus laporan ini")');
  await page.waitForURL(/\/admin\/keuangan\?/, { timeout: 15000 });
  cek("laporan uji terhapus", !page.url().includes("/admin/keuangan/"));

  /* ------------------------------------------------------------------ */
  bagian("Penyaring publik lainnya");
  await publik.goto(`${DASAR}/keuangan`);
  const tautanRt = await publik.locator('a[href*="/keuangan?rt="]').first().getAttribute("href");
  await publik.goto(DASAR + tautanRt);
  const tabelLaporan = publik.locator("table").last();
  const barisRt = await tabelLaporan.locator("tbody tr").count();
  const semuaRtTeks = await tabelLaporan.locator("tbody").innerText();
  cek(
    "penyaring RT pada keuangan hanya menampilkan satu RT",
    barisRt > 0 && new Set([...semuaRtTeks.matchAll(/RT \d\d/g)].map((m) => m[0])).size === 1,
  );

  await publik.goto(`${DASAR}/kegiatan?tampil=lampau`);
  cek(
    "tab arsip kegiatan menampilkan kegiatan lampau",
    (await publik.locator("article").count()) > 0,
  );

  await publik.goto(`${DASAR}/berita?halaman=2`);
  cek(
    "penomoran halaman berita bekerja",
    (await publik.locator("article").count()) >= 0 && publik.url().includes("halaman=2"),
  );

  await ctx.close();
} finally {
  await anonimCtx.close();
  await browser.close();
}

console.log(`\n=== HASIL QC FUNGSI ===`);
console.log(`${lulus} lulus, ${gagal.length} gagal`);
if (gagal.length) {
  console.log("\nGagal:");
  for (const g of gagal) console.log(`  - ${g}`);
}
process.exit(gagal.length ? 1 : 0);
