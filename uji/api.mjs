// Uji REST API publik /api/v1. Hanya membaca, tidak mengubah data.
// Jalankan dengan server hidup:  DASAR=http://localhost:3311 node uji/api.mjs
const DASAR = process.env.DASAR ?? "http://localhost:3000";

let gagal = 0;
const cek = (nama, kondisi, catatan = "") => {
  console.log(`${kondisi ? "LULUS" : "GAGAL"}  ${nama}${catatan ? ` — ${catatan}` : ""}`);
  if (!kondisi) gagal++;
};

async function ambil(jalur) {
  const r = await fetch(`${DASAR}/api/v1${jalur}`);
  return { status: r.status, header: r.headers, isi: await r.json() };
}

// ---------- RW ----------
const rw = await ambil("/rw");
cek("GET /rw menjawab 200", rw.status === 200);
cek("Ada tiga RW", rw.isi.data?.length === 3);
cek("Tiap RW memuat RT", rw.isi.data?.every((x) => x.rt.length > 0));
cek("Header CORS terpasang", rw.header.get("access-control-allow-origin") === "*");

// ---------- Berita ----------
const berita = await ambil("/berita?per_halaman=2");
cek("GET /berita menjawab 200", berita.status === 200);
cek("Ukuran halaman dipatuhi", berita.isi.data?.length === 2);
cek("Meta halaman lengkap", berita.isi.meta?.total >= 2 && berita.isi.meta?.halaman === 1);
cek(
  "Daftar berita tidak memuat isi lengkap",
  berita.isi.data?.every((b) => !("konten" in b)),
);

const halaman2 = await ambil("/berita?per_halaman=2&halaman=2");
cek(
  "Halaman 2 berbeda dari halaman 1",
  halaman2.isi.data?.[0]?.slug !== berita.isi.data?.[0]?.slug,
);

const satuBerita = await ambil(`/berita/${berita.isi.data?.[0]?.slug}`);
cek("Rincian berita memuat isi", typeof satuBerita.isi.data?.konten === "string");

const tanpaBerita = await ambil("/berita/tidak-ada-sama-sekali");
cek("Berita tak dikenal menjawab 404", tanpaBerita.status === 404);
cek("Bentuk galat seragam", tanpaBerita.isi.galat?.kode === "BERITA_TIDAK_DITEMUKAN");

// ---------- Validasi kueri ----------
const terlaluBesar = await ambil("/berita?per_halaman=1000");
cek("per_halaman di atas batas menjawab 400", terlaluBesar.status === 400);
cek("Galat 400 menyebut bidangnya", terlaluBesar.isi.galat?.rincian?.[0]?.bidang === "per_halaman");
cek("Galat tidak disimpan di cache", terlaluBesar.header.get("cache-control") === "no-store");

cek("RW bukan angka menjawab 400", (await ambil("/berita?rw=abc")).status === 400);
cek("RW tak dikenal menjawab 404", (await ambil("/berita?rw=99")).status === 404);
cek("waktu tak dikenal menjawab 400", (await ambil("/kegiatan?waktu=kemarin")).status === 400);

// ---------- Kegiatan ----------
const kegiatan = await ambil("/kegiatan?rw=1&waktu=semua");
cek("GET /kegiatan menjawab 200", kegiatan.status === 200);
cek(
  "Kegiatan hanya yang tampil publik",
  kegiatan.isi.data?.every((k) => ["TERBIT", "SELESAI"].includes(k.status)),
);

// ---------- Keuangan ----------
const keuangan = await ambil("/keuangan?per_halaman=5");
cek("GET /keuangan menjawab 200", keuangan.status === 200);
cek("Ukuran halaman keuangan dipatuhi", keuangan.isi.data?.length === 5);

const lapor = keuangan.isi.data?.[0];
cek(
  "Saldo akhir konsisten",
  lapor?.saldoAkhir === lapor?.saldoAwal + lapor?.pemasukan - lapor?.pengeluaran,
);

const seRw = await ambil("/keuangan?rw=2");
cek(
  "Saringan RW keuangan bekerja",
  seRw.isi.data?.length > 0 && seRw.isi.data.every((l) => l.rw.nomor === 2),
);
cek("Total tersaring lebih kecil", seRw.isi.meta?.total < keuangan.isi.meta?.total);

const rinci = await ambil(`/keuangan/${lapor?.id}`);
cek("Rincian laporan menjawab 200", rinci.status === 200);
cek("Rincian memuat transaksi", rinci.isi.data?.transaksi?.length > 0);
cek(
  "Saldo rincian sama dengan ringkasan",
  rinci.isi.data?.saldoAkhir === lapor?.saldoAkhir,
);
cek(
  "Berkas bukti tidak ikut terbuka",
  rinci.isi.data?.transaksi?.every((t) => !("bukti" in t)),
);

cek("Id bukan angka menjawab 400", (await ambil("/keuangan/abc")).status === 400);
cek("Id tak dikenal menjawab 404", (await ambil("/keuangan/999999")).status === 404);

// ---------- Metode dan spesifikasi ----------
const tulis = await fetch(`${DASAR}/api/v1/keuangan`, { method: "POST" });
cek("API hanya-baca menolak POST", tulis.status === 405);

const spek = await ambil("/openapi.json");
cek("Spesifikasi OpenAPI tersedia", spek.isi.openapi?.startsWith("3."));

console.log(gagal === 0 ? "\nSemua uji API lulus." : `\n${gagal} uji gagal.`);
process.exitCode = gagal === 0 ? 0 : 1;
