# Website Profil RW Sanggrahan

Portal informasi warga sekaligus panel pengelolaan untuk pengurus RW. Berisi berita,
agenda kegiatan, data kependudukan, galeri, dan **laporan keuangan kas RT dengan alur
persetujuan berjenjang Bendahara RT → Ketua RT → Ketua RW**.

Dibangun dengan Next.js 16 (App Router + Server Actions), Prisma, SQLite, dan Tailwind CSS 4.

---

## Menjalankan

```bash
npm install
cp .env.example .env          # lalu ubah SESSION_SECRET dengan string acak
npx prisma migrate dev        # menyiapkan basis data SQLite
npm run db:seed               # mengisi data contoh (opsional, sangat disarankan)
npm run dev                   # http://localhost:3000
```

Untuk produksi:

```bash
npm run build && npm start
```

### Berkas lingkungan (`.env`)

| Nama             | Keterangan                                                        |
| ---------------- | ----------------------------------------------------------------- |
| `DATABASE_URL`   | Lokasi basis data SQLite, bawaan `file:./dev.db` di folder prisma. |
| `SESSION_SECRET` | Kunci penanda tangan sesi, **minimal 32 karakter**. Wajib diganti. |

---

## Akun demo

Seluruh akun contoh memakai kata sandi **`sanggrahan123`**. Ganti melalui
**Panel Pengurus → Akun Pengguna** sebelum dipakai sungguhan.

| Surel                             | Peran        | Kewenangan                                                     |
| --------------------------------- | ------------ | -------------------------------------------------------------- |
| `admin@rw05sanggrahan.id`         | Administrator| Akses penuh, termasuk akun pengguna dan pengaturan situs.       |
| `ketuarw@rw05sanggrahan.id`       | Ketua RW     | Persetujuan akhir laporan kas + seluruh konten.                 |
| `sekretaris@rw05sanggrahan.id`    | Sekretaris   | Berita, kegiatan, pengumuman, galeri, data warga, pengurus.     |
| `ketuart01@rw05sanggrahan.id`     | Ketua RT 01  | Verifikasi laporan kas RT-nya + data warga RT-nya.              |
| `bendaharart01@rw05sanggrahan.id` | Bendahara RT | Menyusun dan mengajukan laporan kas RT-nya.                     |

Pola surel berlaku sampai RT 08 (`ketuart08@…`, `bendaharart08@…`).

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

| Peran            | Kas & laporan                | Persetujuan       | Konten publik | Data warga | Akun & pengaturan |
| ---------------- | ---------------------------- | ----------------- | ------------- | ---------- | ----------------- |
| Administrator    | Semua RT                     | Semua tahap       | Ya            | Semua RT   | Ya                |
| Ketua RW         | Lihat semua                  | Tahap RW          | Ya            | Semua RT   | Ya                |
| Sekretaris RW    | Lihat semua                  | Tidak             | Ya            | Semua RT   | Tidak             |
| Ketua RT         | Lihat RT sendiri             | Tahap RT (RT-nya) | Tidak         | RT sendiri | Tidak             |
| Bendahara RT     | Susun & ajukan RT sendiri    | Tidak             | Tidak         | Tidak      | Tidak             |

---

## Halaman

**Publik**

| Jalur              | Isi                                                                   |
| ------------------ | --------------------------------------------------------------------- |
| `/`                | Beranda: pengumuman, berita, agenda, ringkasan kas, statistik warga.   |
| `/berita`          | Daftar berita dengan penyaring kategori dan penomoran halaman.         |
| `/kegiatan`        | Agenda mendatang dan arsip kegiatan, dikelompokkan per bulan.          |
| `/keuangan`        | Laporan kas yang telah disetujui, penyaring tahun & RT, grafik arus kas.|
| `/keuangan/[id]`   | Rincian transaksi, pengesahan, dan jejak persetujuan satu laporan.     |
| `/profil`          | Sejarah, visi misi, struktur pengurus, daftar RT, kontak sekretariat.  |
| `/data-warga`      | Statistik kependudukan agregat (piramida usia, pekerjaan, pendidikan). |
| `/galeri`          | Album dokumentasi kegiatan.                                            |

**Panel pengurus** (`/masuk` lalu `/admin`)

Dasbor · Antrean Persetujuan · Kas & Laporan · Berita · Kegiatan · Pengumuman ·
Galeri · Data Warga · Pengurus · Akun Pengguna · Pengaturan Situs.

---

## Struktur proyek

```
prisma/
  schema.prisma        Skema basis data
  seed.ts              Data contoh (8 RT, 793 jiwa, 32 laporan kas, berita, kegiatan)
  gambar.ts            Pembuat gambar SVG contoh, agar tanpa aset eksternal
src/
  app/
    (publik)/          Halaman untuk warga
    admin/             Panel pengurus (dilindungi sesi + peran)
      keuangan/aksi.ts Server action alur persetujuan
    masuk/             Halaman dan aksi otentikasi
  components/
    admin/             Sidebar, primitif formulir, tombol
    keuangan/          Stepper, jejak persetujuan, tabel transaksi
    grafik/            Grafik batang, batang ganda, piramida usia (SVG/CSS, tanpa pustaka)
    publik/            Header, footer, kartu berita, kartu kegiatan
    ui/                Komponen tampilan bersama
  lib/
    db.ts              Klien Prisma
    sesi.ts            Sesi JWT pada cookie httpOnly
    otorisasi.ts       Pemeriksaan peran dan lingkup RT
    keuangan.ts        Perhitungan kas dan tahapan persetujuan
    kueri.ts           Kueri bersama halaman publik
    unggah.ts          Penyimpanan berkas ke public/unggahan
uji/
  alur-persetujuan.mjs Uji ujung-ke-ujung alur ACC (Playwright)
  qc-tampilan.mjs      QC tata letak & aksesibilitas lintas ukuran layar
  qc-fungsi.mjs        QC fungsionalitas seluruh modul panel pengurus
```

---

## Pengujian

Tiga berkas uji berbasis Playwright menjalankan aplikasi sungguhan di peramban.
Nyalakan server lebih dulu (`npm run dev`), lalu di jendela lain:

| Perintah | Cakupan |
| --- | --- |
| `npm run uji:alur` | Alur ACC berjenjang: bendahara mengajukan, Ketua RT memverifikasi, Ketua RW menyetujui, laporan terbit, lalu ditarik saat dibuka kembali. Termasuk uji batas kewenangan antar-peran. |
| `npm run uji:tampilan` | Setiap halaman pada layar 390px, 768px, dan 1440px: galat konsol, permintaan gagal, gulir mendatar, gambar rusak, jumlah `h1`, label tombol, dan ukuran sasaran sentuh. |
| `npm run uji:fungsi` | CRUD seluruh modul panel (berita, kegiatan, pengumuman, galeri, warga, pengurus, akun, pengaturan), penolakan masukan tidak sah, dan dampaknya pada halaman publik. |
| `npm run uji` | Menjalankan ketiganya berurutan. |

Bila server berjalan di alamat lain, setel `DASAR`, misalnya
`DASAR=http://localhost:3100 npm run uji`.

> Uji fungsi dan uji alur mengubah data. Jalankan `npm run db:seed` setelahnya
> untuk mengembalikan data contoh ke keadaan semula.

---
## Catatan penerapan

- **Basis data.** SQLite cocok untuk satu server. Untuk pindah ke PostgreSQL, ubah
  `provider` pada `prisma/schema.prisma` dan `DATABASE_URL`, lalu jalankan migrasi ulang.
- **Unggahan.** Berkas disimpan di `public/unggahan/`. Sertakan folder ini dalam cadangan
  rutin bersama berkas `prisma/dev.db`.
- **Keamanan.** Ganti `SESSION_SECRET` dan seluruh kata sandi demo sebelum dipakai warga.
  Jalankan di belakang HTTPS agar cookie sesi dikirim dengan atribut `secure`.
- **Data pribadi.** Halaman publik hanya menampilkan angka agregat; nama, NIK, dan alamat
  warga hanya dapat diakses dari panel pengurus sesuai lingkup perannya.
