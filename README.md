<div align="center">

# Website Kampung Sanggrahan

**Portal informasi warga sekaligus panel pengelolaan untuk pengurus — tiga RW
dalam satu situs.** Berita, agenda kegiatan, data kependudukan, galeri, dan
laporan keuangan kas RT dengan alur persetujuan berjenjang
**Bendahara RT → Ketua RT → Ketua RW**.

[**Lihat situsnya →**](https://profil-rw-sanggrahan.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-8_berkas_uji-2EAD33?logo=playwright&logoColor=white)

RW 01, RW 02, dan RW 03 Kampung Sanggrahan, Kelurahan Semaki,
Kemantren Umbulharjo, Kota Yogyakarta.

</div>

---

## Daftar isi

1. [Tiga RW dalam satu situs](#tiga-rw-dalam-satu-situs)
2. [Mulai cepat](#mulai-cepat)
3. [Akun demo](#akun-demo)
4. [Alur persetujuan laporan keuangan](#alur-persetujuan-laporan-keuangan)
5. [Peran dan hak akses](#peran-dan-hak-akses)
6. [Halaman](#halaman)
7. [Struktur proyek](#struktur-proyek)
8. [Basis data](#basis-data)
9. [Pengujian](#pengujian)
10. [Penerapan](#penerapan)
11. [Situs warga yang bersebelahan](#situs-warga-yang-bersebelahan)

---

## Tiga RW dalam satu situs

Kampung Sanggrahan terdiri atas RW 01, RW 02, dan RW 03. Ketiganya berbagi satu
kode program dan satu basis data, tetapi **tidak berbagi kewenangan**.

- **Beranda `/` adalah pintu masuk kampung**: tiga kartu RW, pengumuman yang
  berlaku lintas RW, dan tautan ke halaman gabungan. Isi sesungguhnya ada di
  laman tiap RW.
- **Tiap RW punya lamannya sendiri** di `/rw/1`, `/rw/2`, `/rw/3`, lengkap dengan
  profil, berita, kegiatan, galeri, data warga, dan laporan kasnya.
- **Halaman tingkat kampung** (`/berita`, `/kegiatan`, `/keuangan`, `/data-warga`,
  `/galeri`, `/profil`) menggabungkan ketiga RW dan mencantumkan asal RW pada
  tiap baris.
- **Konten boleh bertingkat kampung.** Berita, kegiatan, pengumuman, galeri, dan
  pengurus dengan `rwId` kosong dianggap milik kampung dan tampil di ketiga laman
  RW. Hanya administrator kampung yang boleh membuatnya.
- **Nomor RT hanya unik di dalam RW-nya.** RT 01 ada di RW 01, RW 02, dan RW 03
  sekaligus; kunci uniknya `(RW, nomor RT)`.

Batas kewenangan dijaga di sisi server, di `src/lib/otorisasi.ts`. Peran saja tidak
pernah cukup: Ketua RW 02 punya peran yang sama persis dengan Ketua RW 01, jadi
setiap pemeriksaan menanyakan dua hal — perannya tepat, **dan** barisnya berada di
RW yang sama dengan penggunanya.

> **Catatan data.** Yang terverifikasi dari sumber publik hanyalah bahwa Kampung
> Sanggrahan terdiri atas RW 01, 02, dan 03, dan bahwa **RW 01 membawahi RT 01,
> RT 02, dan RT 03**. Jumlah RT di RW 02 dan RW 03 tidak dipublikasikan di mana
> pun, sehingga seed memberi keduanya tiga RT mengikuti pola RW 01 — itu **dugaan
> yang perlu dicocokkan ke pengurus**, bukan data resmi. Perbaiki dari
> `/admin/pengaturan`; tidak perlu mengubah kode.

---

## Mulai cepat

Butuh Node.js 20+ dan basis data PostgreSQL. Untuk pengembangan bisa memakai
Postgres lokal atau basis data gratis dari [Neon](https://neon.tech).

```bash
git clone https://github.com/AriesDjae/profil-rw-sanggrahan.git
cd profil-rw-sanggrahan
npm install

cp .env.example .env          # isi DATABASE_URL dan SESSION_SECRET
npx prisma migrate deploy     # menyiapkan tabel
npm run db:seed               # mengisi data contoh (sangat disarankan)

npm run dev                   # http://localhost:3000
```

Untuk produksi:

```bash
npm run build && npm start
```

Seed mengisi data contoh yang cukup untuk menilai seluruh alur: **3 RW, 9 RT,
±825 jiwa, 36 laporan kas** beserta transaksi dan jejak persetujuannya, ditambah
berita, kegiatan, pengumuman, dan album galeri.

### Berkas lingkungan (`.env`)

| Nama | Wajib | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | ya | Alamat PostgreSQL, mis. `postgresql://…?sslmode=require`. Di Neon, pakai connection string **pooled** untuk aplikasi. |
| `SESSION_SECRET` | ya | Kunci penanda tangan sesi, **minimal 32 karakter**. |
| `BLOB_READ_WRITE_TOKEN` | tidak | Bila diisi, unggahan disimpan ke Vercel Blob. Bila kosong, unggahan ditulis ke `public/unggahan` (dipakai saat lokal dan saat dipasang di VPS sendiri). |
| `NEXT_PUBLIC_URL_UMKM` | tidak | Alamat situs Registri Usaha Warga, ditautkan dari kop dan kaki halaman. Kosong = memakai bawaan di `src/lib/tautanLuar.ts`. |

---

## Akun demo

Seluruh akun contoh memakai kata sandi **`sanggrahan123`**. Ganti melalui
**Panel Pengurus → Akun Pengguna** sebelum dipakai sungguhan.

| Surel                              | Peran         | Kewenangan                                                        |
| ---------------------------------- | ------------- | ----------------------------------------------------------------- |
| `admin@sanggrahan.id`              | Administrator | **Satu-satunya akun lintas RW.** Akses penuh ketiga RW, akun, dan pengaturan kampung. |
| `ketuarw1@sanggrahan.id`           | Ketua RW      | Persetujuan akhir kas **RW 01 saja** + seluruh konten RW 01 + akun RW 01. |
| `sekretaris.rw1@sanggrahan.id`     | Sekretaris    | Berita, kegiatan, pengumuman, galeri, data warga, pengurus — **RW 01 saja**. |
| `ketuart01.rw1@sanggrahan.id`      | Ketua RT 01   | Verifikasi kas RT-nya + data warga RT-nya.                        |
| `bendaharart01.rw1@sanggrahan.id`  | Bendahara RT  | Menyusun dan mengajukan kas RT-nya.                               |

Ganti angka RW pada polanya untuk RW lain (`ketuarw2@…`, `sekretaris.rw3@…`), dan
nomor RT sampai RT 03 di tiap RW (`ketuart03.rw2@…`, `bendaharart02.rw3@…`).

Administrator kampung sengaja disimpan **tanpa RW** — kolom kosong itulah tanda
kewenangan lintas RW-nya.

---

## Alur persetujuan laporan keuangan

```
DRAFT ──ajukan──▶ DIAJUKAN ──verifikasi RT──▶ DIVERIFIKASI_RT ──setujui RW──▶ DISETUJUI
  ▲                   │                              │                            │
  └──────── DITOLAK ◀──┴──── kembalikan RT ───────────┴──── kembalikan RW ─────────┘
                                                      (Ketua RW juga dapat membuka
                                                       kembali laporan yang terbit)
```

Aturan yang ditegakkan di sisi server:

- Hanya **bendahara RT bersangkutan** (atau administrator) yang boleh membuat, mengubah,
  dan mengajukan laporan. Setelah diajukan, laporan terkunci dari penyuntingan.
- Laporan tanpa transaksi tidak dapat diajukan.
- Hanya **Ketua RT dari RT tersebut** yang dapat memverifikasi atau mengembalikan.
- Hanya **Ketua RW** yang memberi persetujuan akhir; tahap RW tidak dapat dilompati.
- Pengembalian **wajib disertai catatan** agar bendahara tahu bagian yang perlu direvisi.
- Hanya laporan berstatus `DISETUJUI` yang tampil di halaman publik `/keuangan`. Laporan
  yang dibuka kembali otomatis ditarik dari halaman publik.
- Setiap tindakan tercatat pada **jejak persetujuan** (siapa, kapan, catatan apa) dan
  ditampilkan terbuka kepada warga.

---

## Peran dan hak akses

Kolom **Lingkup** adalah yang membedakan situs ini dari situs satu RW: apa pun
perannya, seorang pengurus hanya berkuasa di dalam RW-nya.

| Peran         | Lingkup        | Kas & laporan             | Persetujuan       | Konten publik  | Data warga     | Akun & pengaturan            |
| ------------- | -------------- | ------------------------- | ----------------- | -------------- | -------------- | ---------------------------- |
| Administrator | Seluruh kampung| Semua RT ketiga RW        | Semua tahap       | Ya, + tingkat kampung | Semua RT | Ya, termasuk identitas kampung |
| Ketua RW      | Satu RW        | Lihat RW-nya              | Tahap RW, RW-nya  | RW-nya         | RW-nya         | Akun RW-nya, profil RW-nya   |
| Sekretaris RW | Satu RW        | Lihat RW-nya              | Tidak             | RW-nya         | RW-nya         | Tidak                        |
| Ketua RT      | Satu RT        | Lihat RT sendiri          | Tahap RT (RT-nya) | Tidak          | RT sendiri     | Tidak                        |
| Bendahara RT  | Satu RT        | Susun & ajukan RT sendiri | Tidak             | Tidak          | Tidak          | Tidak                        |

Yang **tidak** boleh dilakukan Ketua RW, dan diuji otomatis:

- membuka, menyetujui, atau menolak laporan kas RT milik RW lain;
- menyunting berita, kegiatan, pengumuman, galeri, atau pengurus RW lain;
- menyunting konten bertingkat kampung (yang tampil di ketiga RW);
- membuat atau mengubah akun di RW lain, atau mengangkat administrator kampung.

---

## Halaman

**Publik**

| Jalur                  | Isi                                                                     |
| ---------------------- | ----------------------------------------------------------------------- |
| `/`                    | **Pintu masuk kampung**: tiga kartu RW beserta angka pokoknya, pengumuman lintas RW, tautan ke halaman gabungan. |
| `/rw/[n]`              | **Beranda satu RW**: sambutan, pengumuman, kabar, agenda, ringkasan kas, tabel RT. |
| `/rw/[n]/profil`       | Sejarah, visi misi, pengurus, dan daftar RT milik RW itu.                |
| `/rw/[n]/berita`       | Berita RW itu, ditambah berita tingkat kampung.                          |
| `/rw/[n]/kegiatan`     | Agenda dan arsip kegiatan RW itu.                                        |
| `/rw/[n]/keuangan`     | Kas RT di RW itu saja.                                                   |
| `/rw/[n]/data-warga`   | Statistik kependudukan RW itu.                                           |
| `/rw/[n]/galeri`       | Album dokumentasi RW itu.                                                |
| `/berita`              | Berita ketiga RW, tiap kartu menyebut asal RW-nya.                       |
| `/kegiatan`            | Agenda gabungan ketiga RW.                                               |
| `/keuangan`            | Kas seluruh RT ketiga RW, penyaring tahun & RT, grafik arus kas.         |
| `/keuangan/[id]`       | Rincian transaksi, pengesahan, dan jejak persetujuan satu laporan.       |
| `/profil`              | Profil kampung dan pengurus tingkat kampung.                             |
| `/data-warga`          | Statistik kependudukan se-kampung.                                       |
| `/galeri`              | Album dari ketiga RW.                                                    |

Halaman detail (`/berita/[slug]`, `/kegiatan/[slug]`, `/galeri/[slug]`,
`/keuangan/[id]`) sengaja tidak digandakan per RW: satu tulisan punya satu alamat
agar tautan yang beredar di grup warga tidak bercabang. Asal RW-nya ditandai di
dalam halaman.

**Panel pengurus** (`/masuk` lalu `/admin`)

Dasbor · Antrean Persetujuan · Kas & Laporan · Berita · Kegiatan · Pengumuman ·
Galeri · Data Warga · Pengurus · Akun Pengguna · Pengaturan Situs.

---

## Struktur proyek

```
prisma/
  schema.prisma        Skema basis data
  seed.ts              Data contoh: 3 RW, 9 RT, ±825 jiwa, 36 laporan kas, berita, kegiatan
  gambar.ts            Pembuat gambar SVG contoh (ditulis ke public/contoh)
  migrations/          20260903100000_init, 20260907090000_kampung_tiga_rw
src/
  app/
    unggahan/[...jalur]/ Penyaji berkas unggahan pengurus (lihat catatan di bawah)
    (publik)/          Halaman untuk warga
      page.tsx           Pintu masuk kampung
      rw/[rw]/           Laman tiap RW (memakai komponen isi yang sama)
    admin/             Panel pengurus (dilindungi sesi + peran)
      keuangan/aksi.ts Server action alur persetujuan
    masuk/             Halaman dan aksi otentikasi
  components/
    admin/             Sidebar, primitif formulir, tombol
    keuangan/          Stepper, jejak persetujuan, tabel transaksi
    grafik/            Grafik batang, batang ganda, piramida usia (SVG/CSS, tanpa pustaka)
    publik/            Header (dengan pemilih RW), footer, kartu berita, kartu kegiatan
      halaman/           Badan halaman yang dipakai bersama laman kampung dan laman RW
    ui/                Komponen tampilan bersama
  lib/
    db.ts              Klien Prisma
    sesi.ts            Sesi JWT pada cookie httpOnly
    otorisasi.ts       Pemeriksaan peran dan lingkup RW/RT — inti pemisahan antar-RW
    rw.ts              Pembacaan daftar RW, penerjemah alamat /rw/<n>, penyegar laman RW
    keuangan.ts        Perhitungan kas dan tahapan persetujuan
    kueri.ts           Kueri bersama halaman publik
    unggah.ts          Penyimpanan berkas: Vercel Blob atau folder lokal
    gambar.ts          Pengecil foto: maks 1600px, WEBP, EXIF (termasuk GPS) dibuang
    tautanLuar.ts      Alamat situs Registri Usaha Warga
uji/
  alur-persetujuan.mjs Uji ujung-ke-ujung alur ACC (Playwright)
  qc-tampilan.mjs      QC tata letak & aksesibilitas lintas ukuran layar
  qc-fungsi.mjs        QC fungsionalitas seluruh modul panel pengurus
  crud-berita.mjs      Satu berita ditempuh dari tulis sampai hapus, termasuk batas antar-RW
  crud-kegiatan.mjs    Satu kegiatan dari dijadwalkan sampai masuk arsip lalu dihapus
  crud-pengumuman.mjs  Pengumuman tingkat RW dan tingkat kampung, beserta pemisahannya
  crud-galeri.mjs      Album dan foto, termasuk unggahan sungguhan yang benar-benar termuat
  crud-warga.mjs       Data warga: kerahasiaan identitas dan batas wilayah antar-RW
```

### Basis data

Tiga belas model di `prisma/schema.prisma`, dengan tiga aturan lingkup yang
dipegang seluruh skema:

- **`Rt` wajib milik satu `Rw`.** Nomor RT hanya unik di dalam RW-nya
  (`@@unique([rwId, nomor])`).
- **`User.rwId` kosong hanya untuk peran `ADMIN`** — administrator tingkat
  kampung. Peran lain wajib terikat satu RW; Ketua RT dan Bendahara RT
  dipersempit lagi ke satu RT.
- **`Warga` dan `LaporanKeuangan` tidak menyimpan `rwId`** — RW-nya dibaca lewat
  `Rt`, supaya tidak ada dua sumber kebenaran yang bisa berselisih.

| Kelompok | Model |
| --- | --- |
| Wilayah | `Rw`, `Rt` |
| Akun | `User` |
| Konten publik | `Berita`, `Kegiatan`, `Pengumuman`, `Album`, `Foto`, `Pengurus` |
| Kependudukan | `Warga` |
| Keuangan | `LaporanKeuangan`, `Transaksi`, `RiwayatPersetujuan` |
| Identitas situs | `Pengaturan` (baris tunggal, `id = 1`) |

Kolom `status` dan `peran` memakai `String`, bukan enum, agar nilainya terkunci
di satu tempat (`src/lib/konstanta.ts`) dan penambahan nilai baru tidak
memerlukan migrasi tipe.

---

## Pengujian

Delapan berkas uji berbasis Playwright menjalankan aplikasi sungguhan di peramban.
Nyalakan server lebih dulu (`npm run dev`), lalu di jendela lain:

| Perintah | Cakupan |
| --- | --- |
| `npm run uji:alur` | Alur ACC berjenjang: bendahara mengajukan, Ketua RT memverifikasi, Ketua RW menyetujui, laporan terbit, lalu ditarik saat dibuka kembali. Termasuk uji batas kewenangan antar-peran. |
| `npm run uji:tampilan` | Setiap halaman pada layar 390px, 768px, dan 1440px: galat konsol, permintaan gagal, gulir mendatar, gambar rusak, jumlah `h1`, label tombol, dan ukuran sasaran sentuh. |
| `npm run uji:fungsi` | CRUD seluruh modul panel (berita, kegiatan, pengumuman, galeri, warga, pengurus, akun, pengaturan), penolakan masukan tidak sah, dan dampaknya pada halaman publik. |
| `npm run uji:crud:berita` | Satu berita ditempuh utuh: ditulis pengurus RW 01, terbit di `/rw/1/berita` dan `/berita`, **tidak** muncul di `/rw/2` dan `/rw/3`, ditolak saat disunting pengurus RW 02, disunting pemiliknya, dijadikan draf lalu diterbitkan lagi, akhirnya dihapus. |
| `npm run uji:crud:kegiatan` | Satu kegiatan dijadwalkan sampai dihapus: penolakan waktu selesai yang mendahului waktu mulai, tampil di agenda RW 01 dan agenda kampung tetapi tidak di RW 02/03, langsung terlihat di beranda RW-nya, disunting, dijadikan draf, dipindah ke arsip, lalu dihapus. |
| `npm run uji:crud:pengumuman` | Dua tingkat pengumuman sekaligus: milik RW 01 (hanya tampil di `/rw/1`, **tidak** di beranda kampung) dan milik kampung (tampil di `/` sekaligus ketiga laman RW), ditambah nonaktifkan/aktifkan, tanggal berakhir yang menyembunyikan, dan batas kewenangan RW 02. |
| `npm run uji:crud:galeri` | Album dibuat, diisi dua foto sungguhan, tampil di galeri RW 01 tetapi tidak di RW 02/03, fotonya benar-benar termuat (bukan sekadar ada elemennya), diganti nama sehingga alamatnya berpindah — alamat lama harus berhenti menyajikan salinan usang — lalu foto dan albumnya dihapus. |
| `npm run uji:crud:warga` | Validasi NIK 16 digit dan NIK ganda, statistik publik RW 01 dan kampung ikut bertambah sementara RW 02 tidak, **identitas pribadi tidak muncul di enam halaman publik**, pengurus RW 02 ditolak melihat maupun menyunting warga RW 01 termasuk saat menyisipkan `rtId` milik RW 01 ke formulirnya. |
| `npm run uji:crud` | Menjalankan kelima uji CRUD di atas. |
| `npm run uji` | Menjalankan kedelapannya berurutan. |

Uji alur dan uji CRUD sekaligus menjaga pemisahan antar-RW: Ketua RT bernomor
sama dari RW lain, dan Ketua RW dari RW lain, harus sama-sama ditolak saat
membuka laporan yang bukan wilayahnya.

Bila server berjalan di alamat lain, setel `DASAR`, misalnya
`DASAR=http://localhost:3100 npm run uji`.

> Uji fungsi dan uji alur mengubah data. Jalankan `npm run db:seed` setelahnya
> untuk mengembalikan data contoh ke keadaan semula.

---

## Penerapan

### Demo di Vercel

Vercel dipakai sebagai etalase MVP, region **Singapura** (`sin1`, disetel di
`vercel.json`). Dua penyesuaian sudah dilakukan agar berjalan di sana, karena
sistem berkas Vercel bersifat hanya-baca dan sementara:

- **Basis data** memakai PostgreSQL (Neon), bukan berkas SQLite.
- **Unggahan berkas** otomatis dialihkan ke Vercel Blob bila
  `BLOB_READ_WRITE_TOKEN` tersedia; bila tidak, tetap ditulis ke folder lokal
  (`public/unggahan`) dan disajikan lewat rute `src/app/unggahan/[...jalur]`.
  Rute itu diperlukan karena Next.js mendaftar isi `public/` **saat build**,
  sehingga foto yang diunggah pengurus sesudahnya akan dijawab 404 oleh
  `next start` — terasa saat dipasang di VPS sendiri, tidak terasa di Vercel.
- **Gambar contoh** disimpan sebagai berkas statis di `public/contoh` dan ikut
  di-commit, sehingga tetap tampil tanpa perlu menulis berkas saat dijalankan.

Langkah deploy:

1. Buat basis data di Neon, salin connection string.
2. Jalankan `npx prisma migrate deploy` dari komputer, diarahkan ke basis data itu.
   Migrasi `20260907090000_kampung_tiga_rw` membuat ketiga RW sekaligus, jadi
   basis data yang tidak pernah di-seed pun langsung punya `/rw/1`, `/rw/2`, dan
   `/rw/3`.
3. Isi data contoh dengan `npm run db:seed`.
4. Di Vercel, impor repositori ini lalu isi environment variable `DATABASE_URL`,
   `SESSION_SECRET`, dan `BLOB_READ_WRITE_TOKEN`.

Migrasi skema **tidak** dijalankan saat build Vercel. Setelah mengubah
`schema.prisma`, jalankan `npm run db:deploy` dari komputer sambil diarahkan ke
basis data produksi.

### Pemasangan sendiri (VPS)

Kode yang sama berjalan di server sendiri tanpa perubahan: cukup sediakan
PostgreSQL, kosongkan `BLOB_READ_WRITE_TOKEN` agar unggahan memakai folder
`public/unggahan`, lalu jalankan `npm run build && npm start` di belakang Nginx.

### Catatan lain

- **Cadangan.** Sertakan basis data dan folder `public/unggahan` dalam pencadangan rutin.
- **Keamanan.** Ganti `SESSION_SECRET` dan seluruh kata sandi demo sebelum dipakai warga.
  Jalankan di belakang HTTPS agar cookie sesi dikirim dengan atribut `secure`.
- **Data pribadi.** Halaman publik hanya menampilkan angka agregat; nama, NIK, dan
  alamat warga hanya dapat diakses dari panel pengurus sesuai lingkup perannya.
  Foto yang diunggah dikecilkan dan dibuang metadata EXIF-nya, termasuk titik GPS,
  sehingga alamat rumah warga tidak ikut terbawa.
- **Batas unggahan.** `next.config.ts` menyetel `serverActions.bodySizeLimit`
  ke 14 MB — sengaja di atas batas 12 MB di `src/lib/unggah.ts`, sebab pembungkus
  multipart menambah sedikit dari ukuran berkas aslinya.

---

## Situs warga yang bersebelahan

Urusan usaha warga punya situsnya sendiri:
**[Usaha Warga Sanggrahan](https://umkm-sanggrahan.vercel.app)** — registri UMKM
dan jasa warga RW 1 dan RW 3, dengan basis data dan panel pengurusnya sendiri
([repositori](https://github.com/AriesDjae/umkm-sanggrahan)).

Kedua situs berdiri terpisah tetapi melayani warga yang sama, jadi kop dan kaki
halaman keduanya saling menautkan. Alamat tujuannya ada di
`src/lib/tautanLuar.ts`, dan bisa ditimpa lewat env `NEXT_PUBLIC_URL_UMKM` tanpa
mengubah kode.

---

<div align="center">
<sub>Dibangun swadaya untuk warga Kampung Sanggrahan, Semaki, Umbulharjo, Yogyakarta.</sub>
</div>
