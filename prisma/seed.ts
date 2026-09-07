import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { tulisGambar } from "./gambar";

/**
 * Isi contoh Kampung Sanggrahan — RW 01, RW 02, dan RW 03.
 *
 * PERINGATAN SOAL DATA: yang benar-benar terverifikasi hanyalah bahwa Kampung
 * Sanggrahan (Kelurahan Semaki, Kemantren Umbulharjo, Kota Yogyakarta) terdiri
 * atas RW 01, 02, dan 03, dan bahwa RW 01 membawahi RT 01, RT 02, dan RT 03.
 * Jumlah RT di RW 02 dan RW 03 tidak dipublikasikan di mana pun, jadi di sini
 * keduanya diberi tiga RT mengikuti pola RW 01 — itu **dugaan yang harus
 * dicocokkan ke pengurus**, bukan data resmi. Nama orang, angka warga, isi
 * berita, dan seluruh nominal kas adalah karangan untuk keperluan peragaan.
 *
 * Ubah daftar RT lewat panel: /admin/pengaturan. Nomor RT hanya perlu unik di
 * dalam RW-nya, jadi RT 01 boleh ada di ketiga RW.
 */

const db = new PrismaClient();

const KATA_SANDI_DEMO = "sanggrahan123";
const DOMAIN = "sanggrahan.id";

/** RNG deterministik supaya hasil seed selalu sama. */
function pembangkitAcak(seed: number) {
  let s = seed;
  return function next(): number {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
const rng = pembangkitAcak(20260907);
const pilih = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
const antara = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));

const NAMA_DEPAN_L = [
  "Agus", "Bambang", "Cahyo", "Dedi", "Eko", "Fajar", "Gunawan", "Hadi", "Imam",
  "Joko", "Kurnia", "Lukman", "Marno", "Nur", "Oki", "Purwanto", "Rudi", "Slamet",
  "Tri", "Untung", "Wahyu", "Yanto", "Zaenal", "Bagas", "Dimas", "Rangga", "Aditya",
];
const NAMA_DEPAN_P = [
  "Ani", "Bunga", "Citra", "Dewi", "Endang", "Fitri", "Galuh", "Hesti", "Indah",
  "Jumiati", "Kartini", "Lestari", "Murni", "Novi", "Puji", "Rina", "Sri", "Tuti",
  "Umi", "Wulan", "Yuni", "Zahra", "Anisa", "Salma", "Nabila", "Ayu",
];
const NAMA_BELAKANG = [
  "Santoso", "Wijaya", "Prasetyo", "Nugroho", "Saputra", "Hidayat", "Rahmawati",
  "Kusuma", "Setiawan", "Handayani", "Suryadi", "Maulana", "Pratama", "Utami",
  "Firmansyah", "Ramadhan", "Susilo", "Widodo", "Anggraini", "Permana",
];

const AGAMA_ACAK = ["Islam", "Islam", "Islam", "Islam", "Kristen", "Katolik", "Hindu", "Buddha"];
const PENDIDIKAN_DEWASA = ["SD", "SMP", "SMA/SMK", "SMA/SMK", "SMA/SMK", "D1-D3", "S1", "S1", "S2"];
const PEKERJAAN_L = [
  "Karyawan Swasta", "Karyawan Swasta", "Wiraswasta", "Buruh", "Petani",
  "PNS/TNI/Polri", "Guru/Dosen", "Pensiunan", "Lainnya",
];
const PEKERJAAN_P = [
  "Ibu Rumah Tangga", "Ibu Rumah Tangga", "Karyawan Swasta", "Wiraswasta",
  "Guru/Dosen", "PNS/TNI/Polri", "Buruh", "Lainnya",
];
const KOTA_LAHIR = [
  "Yogyakarta", "Yogyakarta", "Sleman", "Bantul", "Kulon Progo", "Gunungkidul",
  "Klaten", "Magelang", "Purworejo", "Surakarta",
];

const NAMA_BULAN_SEED = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const hariIni = new Date(2026, 8, 7);

function tanggalRelatif(hari: number, jam = 0) {
  const d = new Date(hariIni);
  d.setDate(d.getDate() + hari);
  d.setHours(jam, 0, 0, 0);
  return d;
}

function keSlug(teks: string, panjang = 70) {
  return teks
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, panjang);
}

/* -------------------------------------------------------------------------- */
/* Bahan tiap RW                                                              */
/* -------------------------------------------------------------------------- */

type BahanRw = {
  nomor: number;
  tagline: string;
  deskripsi: string;
  sejarah: string;
  visi: string;
  misi: string;
  alamat: string;
  telepon: string;
  ketua: string;
  sekretaris: string;
  rt: { nomor: string; wilayah: string }[];
};

const BAHAN_RW: BahanRw[] = [
  {
    nomor: 1,
    tagline: "Guyub Rukun, Warga Maju, Lingkungan Asri",
    deskripsi:
      "RW 01 Kampung Sanggrahan menaungi tiga RT di sisi utara kampung, mulai dari Jalan Sanggrahan hingga batas Kelurahan Semaki Gede. Wilayahnya padat, sebagian besar rumah tinggal dengan usaha rumahan di beberapa titik.",
    sejarah:
      "Nama Sanggrahan berasal dari kata \"sanggrah\" yang berarti tempat singgah, merujuk pada pesanggrahan lama yang dahulu menjadi tempat beristirahat orang yang melintasi jalur ini menuju timur kota.\n\nRW 01 adalah bagian kampung yang lebih dulu ramai. Ketika lahan di sisi selatan masih berupa pekarangan luas, deretan rumah di sisi utara sudah tersusun rapat mengikuti gang-gang sempit yang bertahan sampai sekarang. Balai RW yang berdiri di tengah wilayah dibangun bergotong royong dan sampai hari ini dipakai untuk posyandu, rapat bulanan, dan pertemuan karang taruna.\n\nKerja bakti rutin, ronda malam bergilir, dan arisan RT masih berjalan sebagai perekat kehidupan bertetangga.",
    visi:
      "Mewujudkan RW 01 Kampung Sanggrahan sebagai lingkungan yang guyub, aman, sehat, dan mandiri dengan tata kelola yang terbuka serta partisipasi aktif seluruh warga.",
    misi:
      "Menjaga kerukunan dan semangat gotong royong antarwarga\nMeningkatkan keamanan lingkungan melalui ronda terjadwal\nMengelola kas RT dan RW secara transparan dan akuntabel\nMendorong lingkungan bersih, hijau, dan bebas sampah liar\nMemberdayakan UMKM, PKK, dan karang taruna\nMenyediakan layanan administrasi kependudukan yang cepat dan ramah",
    alamat: "Balai RW 01, Jl. Sanggrahan UH I, Semaki, Umbulharjo, Yogyakarta 55166",
    telepon: "0274-500101",
    ketua: "H. Suryanto Wibowo",
    sekretaris: "Dwi Astuti Rahmawati",
    rt: [
      { nomor: "01", wilayah: "Gang Melati dan Jl. Sanggrahan sisi utara" },
      { nomor: "02", wilayah: "Gang Mawar sampai perempatan balai RW" },
      { nomor: "03", wilayah: "Gang Kenanga hingga batas Semaki Gede" },
    ],
  },
  {
    nomor: 2,
    tagline: "Tertib, Bersih, dan Saling Menjaga",
    deskripsi:
      "RW 02 Kampung Sanggrahan berada di bagian tengah kampung. Wilayahnya diapit dua jalan kampung dan menjadi jalur lintasan warga menuju pasar dan sekolah, sehingga urusan ketertiban lalu lintas gang menjadi perhatian utama pengurus.",
    sejarah:
      "RW 02 tumbuh sebagai bagian tengah Kampung Sanggrahan, di antara permukiman lama di utara dan pengembangan yang lebih baru di selatan. Karena berada di jalur lintasan warga, wilayah ini lebih dulu memiliki lampu penerangan gang dan pos ronda permanen.\n\nCatatan sejarah rinci RW 02 belum dikumpulkan pengurus. Bagian ini menunggu masukan sesepuh kampung dan dapat dilengkapi kapan saja lewat panel pengurus.",
    visi:
      "Menjadikan RW 02 Kampung Sanggrahan lingkungan yang tertib, bersih, aman dilalui segala usia, dan terbuka dalam pengelolaan keuangannya.",
    misi:
      "Menjaga ketertiban dan keselamatan gang yang menjadi jalur lintasan warga\nMerawat penerangan jalan dan saluran air secara berkala\nMelaporkan kas RT secara terbuka setiap bulan\nMengaktifkan posyandu balita dan lansia\nMendampingi usaha rumahan warga\nMerawat kerukunan antarwarga lama dan pendatang",
    alamat: "Balai RW 02, Jl. Sanggrahan UH I, Semaki, Umbulharjo, Yogyakarta 55166",
    telepon: "0274-500102",
    ketua: "Bambang Nugroho",
    sekretaris: "Retno Palupi",
    rt: [
      { nomor: "01", wilayah: "Gang Dahlia dan sekitar pos ronda tengah" },
      { nomor: "02", wilayah: "Jl. Sanggrahan sisi barat sampai lapangan" },
      { nomor: "03", wilayah: "Gang Anggrek dan bantaran saluran" },
    ],
  },
  {
    nomor: 3,
    tagline: "Sehat, Hijau, dan Berdaya",
    deskripsi:
      "RW 03 Kampung Sanggrahan menempati sisi selatan kampung, berbatasan dengan wilayah Semaki Kulon. Warganya banyak menjalankan usaha rumahan — katering, laundry, dan warung — yang sebagian sudah tercatat pada registri usaha warga.",
    sejarah:
      "RW 03 adalah bagian Kampung Sanggrahan yang paling belakangan tumbuh padat. Pekarangan luas di sisi selatan berangsur berubah menjadi rumah tinggal, menyisakan beberapa ruang terbuka yang kini dipakai untuk kegiatan warga dan taman kampung.\n\nCatatan sejarah rinci RW 03 belum dikumpulkan pengurus dan dapat dilengkapi kapan saja lewat panel pengurus.",
    visi:
      "Mewujudkan RW 03 Kampung Sanggrahan sebagai lingkungan sehat, hijau, dan berdaya secara ekonomi melalui penguatan usaha warga.",
    misi:
      "Merawat ruang terbuka dan taman kampung sebagai tempat berkegiatan\nMenjaga kesehatan warga lewat posyandu balita dan lansia\nMendukung tumbuhnya usaha rumahan warga\nMengelola sampah rumah tangga melalui bank sampah\nMenyusun laporan kas RT secara tertib dan terbuka\nMelibatkan pemuda dalam kegiatan kampung",
    alamat: "Balai RW 03, Jl. Sanggrahan UH I, Semaki, Umbulharjo, Yogyakarta 55166",
    telepon: "0274-500103",
    ketua: "Slamet Riyanto",
    sekretaris: "Nurul Hidayah",
    rt: [
      { nomor: "01", wilayah: "Gang Cempaka dan taman kampung" },
      { nomor: "02", wilayah: "Jl. Sanggrahan sisi selatan" },
      { nomor: "03", wilayah: "Gang Flamboyan sampai batas Semaki Kulon" },
    ],
  },
];

const NAMA_KETUA_RT: Record<number, string[]> = {
  1: ["Sugeng Riyadi", "Marno Hartono", "Bambang Sutrisno"],
  2: ["Agus Prasetyo", "Heri Kurniawan", "Widodo Saputro"],
  3: ["Tri Handoko", "Joko Susilo", "Purwanto"],
};
const NAMA_BENDAHARA_RT: Record<number, string[]> = {
  1: ["Sri Lestari", "Endang Wahyuni", "Tuti Handayani"],
  2: ["Siti Aminah", "Yuli Setyaningsih", "Dewi Kurniasari"],
  3: ["Umi Salamah", "Novi Andriani", "Puji Rahayu"],
};

/* -------------------------------------------------------------------------- */

async function bersihkan() {
  await db.riwayatPersetujuan.deleteMany();
  await db.transaksi.deleteMany();
  await db.laporanKeuangan.deleteMany();
  await db.foto.deleteMany();
  await db.album.deleteMany();
  await db.berita.deleteMany();
  await db.kegiatan.deleteMany();
  await db.pengumuman.deleteMany();
  await db.warga.deleteMany();
  await db.pengurus.deleteMany();
  await db.user.deleteMany();
  await db.rt.deleteMany();
  await db.pengaturan.deleteMany();
  // Baris Rw sengaja tidak dihapus: dibuat oleh migrasi dan dirujuk alamat
  // halaman. Di bawah nanti hanya diperbarui isinya.
}

async function main() {
  console.log("Membersihkan data lama...");
  await bersihkan();

  const hash = await bcrypt.hash(KATA_SANDI_DEMO, 10);

  console.log("Menyiapkan pengaturan kampung...");
  await db.pengaturan.create({
    data: {
      id: 1,
      namaKampung: "Kampung Sanggrahan",
      kelurahan: "Semaki",
      kemantren: "Umbulharjo",
      kota: "Kota Yogyakarta",
      tagline: "Tiga RW, Satu Kampung",
      deskripsi:
        "Kampung Sanggrahan adalah satu dari tiga kampung di Kelurahan Semaki, terdiri atas RW 01, RW 02, dan RW 03. Situs ini menjadi papan informasi bersama: tiap RW mengelola lamannya sendiri — berita, agenda, data warga, dan laporan kas RT-nya.",
      sejarah:
        "Nama Sanggrahan berasal dari kata \"sanggrah\", tempat singgah. Kampung ini menempati sisi timur Kelurahan Semaki, berbatasan dengan Semaki Gede di utara dan Semaki Kulon di barat.\n\nTiga rukun warga di dalamnya — RW 01, RW 02, dan RW 03 — tumbuh berurutan dari utara ke selatan seiring berubahnya pekarangan menjadi rumah tinggal. Ketiganya berbagi masjid, pasar, dan lapangan, tetapi masing-masing punya pengurus, kas, dan agenda kegiatannya sendiri.",
      visi:
        "Kampung Sanggrahan yang guyub lintas RW, terbuka dalam pengelolaan, dan nyaman ditinggali segala usia.",
      misi:
        "Menjaga kerukunan antarwarga ketiga RW\nMenyelenggarakan kegiatan bersama tingkat kampung\nMembuka laporan kas RT kepada warga\nMerawat lingkungan, saluran air, dan penerangan jalan\nMendukung usaha warga lewat registri usaha kampung\nMenyediakan informasi kampung yang mudah dijangkau dari telepon genggam",
      alamat: "Jl. Sanggrahan UH I, Semaki, Umbulharjo, Kota Yogyakarta 55166",
      telepon: "0274-549455",
      email: `sekretariat@${DOMAIN}`,
      heroFoto: tulisGambar("hero-kampung", "Kampung Sanggrahan", 0),
    },
  });

  console.log("Menyiapkan tiga RW...");
  const rwTersimpan = new Map<number, { id: number; nama: string }>();
  for (const b of BAHAN_RW) {
    const nama = `RW ${String(b.nomor).padStart(2, "0")}`;
    const rw = await db.rw.upsert({
      where: { nomor: b.nomor },
      update: {
        nama,
        slug: `rw-${String(b.nomor).padStart(2, "0")}`,
        tagline: b.tagline,
        deskripsi: b.deskripsi,
        sejarah: b.sejarah,
        visi: b.visi,
        misi: b.misi,
        alamat: b.alamat,
        telepon: b.telepon,
        email: `rw${b.nomor}@${DOMAIN}`,
        aktif: true,
        heroFoto: tulisGambar(`hero-rw-${b.nomor}`, `${nama} Sanggrahan`, b.nomor),
      },
      create: {
        nomor: b.nomor,
        nama,
        slug: `rw-${String(b.nomor).padStart(2, "0")}`,
        tagline: b.tagline,
        deskripsi: b.deskripsi,
        sejarah: b.sejarah,
        visi: b.visi,
        misi: b.misi,
        alamat: b.alamat,
        telepon: b.telepon,
        email: `rw${b.nomor}@${DOMAIN}`,
        heroFoto: tulisGambar(`hero-rw-${b.nomor}`, `${nama} Sanggrahan`, b.nomor),
      },
    });
    rwTersimpan.set(b.nomor, { id: rw.id, nama: rw.nama });
  }

  console.log("Membuat akun administrator kampung...");
  const admin = await db.user.create({
    data: {
      nama: "Administrator Kampung",
      email: `admin@${DOMAIN}`,
      passwordHash: hash,
      peran: "ADMIN",
      jabatan: "Pengelola Sistem",
      // Tanpa rwId: inilah satu-satunya akun yang berwenang lintas RW.
      rwId: null,
    },
  });

  console.log("Membuat RT, akun pengurus, dan struktur tiap RW...");

  type RtSimpan = {
    id: number;
    nomor: string;
    nama: string;
    rwNomor: number;
    rwId: number;
    wilayah: string;
    ketuaId: number;
    bendaharaId: number;
    jumlahKk: number;
  };

  const semuaRt: RtSimpan[] = [];
  const ketuaRwPerRw = new Map<number, number>();
  const sekretarisPerRw = new Map<number, number>();

  for (const b of BAHAN_RW) {
    const rw = rwTersimpan.get(b.nomor)!;

    const ketuaRw = await db.user.create({
      data: {
        nama: b.ketua,
        email: `ketuarw${b.nomor}@${DOMAIN}`,
        passwordHash: hash,
        peran: "KETUA_RW",
        jabatan: `Ketua ${rw.nama}`,
        telepon: `0812-1111-${String(b.nomor).padStart(2, "0")}00`,
        rwId: rw.id,
      },
    });
    ketuaRwPerRw.set(b.nomor, ketuaRw.id);

    const sekretaris = await db.user.create({
      data: {
        nama: b.sekretaris,
        email: `sekretaris.rw${b.nomor}@${DOMAIN}`,
        passwordHash: hash,
        peran: "SEKRETARIS",
        jabatan: `Sekretaris ${rw.nama}`,
        telepon: `0813-2222-${String(b.nomor).padStart(2, "0")}00`,
        rwId: rw.id,
      },
    });
    sekretarisPerRw.set(b.nomor, sekretaris.id);

    for (let i = 0; i < b.rt.length; i++) {
      const r = b.rt[i];
      const namaRt = `RT ${r.nomor} / ${rw.nama}`;
      const rt = await db.rt.create({
        data: { nomor: r.nomor, nama: namaRt, wilayah: r.wilayah, rwId: rw.id },
      });

      const ketua = await db.user.create({
        data: {
          nama: NAMA_KETUA_RT[b.nomor][i],
          email: `ketuart${r.nomor}.rw${b.nomor}@${DOMAIN}`,
          passwordHash: hash,
          peran: "KETUA_RT",
          jabatan: `Ketua ${namaRt}`,
          rwId: rw.id,
          rtId: rt.id,
          telepon: `0856-${1000 + b.nomor * 10 + i}-${2000 + i}`,
        },
      });
      const bendahara = await db.user.create({
        data: {
          nama: NAMA_BENDAHARA_RT[b.nomor][i],
          email: `bendaharart${r.nomor}.rw${b.nomor}@${DOMAIN}`,
          passwordHash: hash,
          peran: "BENDAHARA_RT",
          jabatan: `Bendahara ${namaRt}`,
          rwId: rw.id,
          rtId: rt.id,
          telepon: `0857-${3000 + b.nomor * 10 + i}-${4000 + i}`,
        },
      });

      semuaRt.push({
        id: rt.id,
        nomor: r.nomor,
        nama: namaRt,
        rwNomor: b.nomor,
        rwId: rw.id,
        wilayah: r.wilayah,
        ketuaId: ketua.id,
        bendaharaId: bendahara.id,
        jumlahKk: 0,
      });
    }

    // Struktur pengurus RW
    const pengurusRw = [
      { nama: b.ketua, jabatan: "Ketua RW" },
      { nama: pilih(NAMA_DEPAN_L) + " " + pilih(NAMA_BELAKANG), jabatan: "Wakil Ketua RW" },
      { nama: b.sekretaris, jabatan: "Sekretaris" },
      { nama: pilih(NAMA_DEPAN_P) + " " + pilih(NAMA_BELAKANG), jabatan: "Bendahara RW" },
      { nama: pilih(NAMA_DEPAN_L) + " " + pilih(NAMA_BELAKANG), jabatan: "Seksi Keamanan & Ketertiban" },
      { nama: pilih(NAMA_DEPAN_L) + " " + pilih(NAMA_BELAKANG), jabatan: "Seksi Kebersihan & Lingkungan" },
      { nama: pilih(NAMA_DEPAN_L) + " " + pilih(NAMA_BELAKANG), jabatan: "Seksi Pemuda & Karang Taruna" },
      { nama: pilih(NAMA_DEPAN_P) + " " + pilih(NAMA_BELAKANG), jabatan: "Ketua TP PKK RW" },
    ];
    for (let i = 0; i < pengurusRw.length; i++) {
      await db.pengurus.create({
        data: {
          nama: pengurusRw[i].nama,
          jabatan: pengurusRw[i].jabatan,
          level: "RW",
          rwId: rw.id,
          urutan: i,
          periode: "2024 - 2027",
          foto:
            i < 4
              ? tulisGambar(`pengurus-rw${b.nomor}-${i + 1}`, pengurusRw[i].nama, b.nomor + i, "kotak")
              : null,
        },
      });
    }
    for (let i = 0; i < b.rt.length; i++) {
      await db.pengurus.create({
        data: {
          nama: NAMA_KETUA_RT[b.nomor][i],
          jabatan: `Ketua RT ${b.rt[i].nomor}`,
          level: "RT",
          rwId: rw.id,
          rtId: semuaRt.find((r) => r.rwNomor === b.nomor && r.nomor === b.rt[i].nomor)!.id,
          urutan: i,
          periode: "2024 - 2027",
        },
      });
    }
  }

  // Kepengurusan tingkat kampung: menaungi ketiga RW, disimpan tanpa rwId.
  const pengurusKampung = [
    { nama: BAHAN_RW[0].ketua, jabatan: "Koordinator Paguyuban Tiga RW" },
    { nama: "Hj. Siti Fatimah", jabatan: "Ketua TP PKK Kampung" },
    { nama: "dr. Indah Permatasari", jabatan: "Koordinator Posyandu Kampung" },
  ];
  for (let i = 0; i < pengurusKampung.length; i++) {
    await db.pengurus.create({
      data: {
        nama: pengurusKampung[i].nama,
        jabatan: pengurusKampung[i].jabatan,
        level: "KAMPUNG",
        rwId: null,
        urutan: i,
        periode: "2024 - 2027",
      },
    });
  }

  console.log("Membuat data warga...");
  let nikBerjalan = 3471010101800001;
  let noKkBerjalan = 3471011201800001;
  const wargaBaru: {
    nama: string; nik: string; noKk: string; jenisKelamin: string;
    tempatLahir: string; tanggalLahir: Date; agama: string; pendidikan: string;
    pekerjaan: string; statusPerkawinan: string; hubungan: string; alamat: string; rtId: number;
  }[] = [];

  for (const rt of semuaRt) {
    const jumlahKk = antara(22, 32);
    rt.jumlahKk = jumlahKk;

    for (let k = 0; k < jumlahKk; k++) {
      const noKk = String(noKkBerjalan++);
      const belakang = pilih(NAMA_BELAKANG);
      const alamat = `${rt.wilayah.split(" ").slice(0, 2).join(" ")} No. ${k + 1}`;
      const agama = pilih(AGAMA_ACAK);
      const usiaKepala = antara(28, 68);

      wargaBaru.push({
        nama: `${pilih(NAMA_DEPAN_L)} ${belakang}`,
        nik: String(nikBerjalan++),
        noKk,
        jenisKelamin: "L",
        tempatLahir: pilih(KOTA_LAHIR),
        tanggalLahir: new Date(2026 - usiaKepala, antara(0, 11), antara(1, 28)),
        agama,
        pendidikan: pilih(PENDIDIKAN_DEWASA),
        pekerjaan: pilih(PEKERJAAN_L),
        statusPerkawinan: "Kawin",
        hubungan: "KEPALA_KELUARGA",
        alamat,
        rtId: rt.id,
      });

      if (rng() > 0.12) {
        wargaBaru.push({
          nama: `${pilih(NAMA_DEPAN_P)} ${belakang}`,
          nik: String(nikBerjalan++),
          noKk,
          jenisKelamin: "P",
          tempatLahir: pilih(KOTA_LAHIR),
          tanggalLahir: new Date(2026 - usiaKepala + antara(-2, 5), antara(0, 11), antara(1, 28)),
          agama,
          pendidikan: pilih(PENDIDIKAN_DEWASA),
          pekerjaan: pilih(PEKERJAAN_P),
          statusPerkawinan: "Kawin",
          hubungan: "ISTRI",
          alamat,
          rtId: rt.id,
        });
      }

      const jumlahAnak = antara(0, 3);
      for (let a = 0; a < jumlahAnak; a++) {
        const laki = rng() > 0.5;
        const usiaAnak = antara(1, Math.max(2, usiaKepala - 24));
        wargaBaru.push({
          nama: `${laki ? pilih(NAMA_DEPAN_L) : pilih(NAMA_DEPAN_P)} ${belakang}`,
          nik: String(nikBerjalan++),
          noKk,
          jenisKelamin: laki ? "L" : "P",
          tempatLahir: pilih(KOTA_LAHIR),
          tanggalLahir: new Date(2026 - usiaAnak, antara(0, 11), antara(1, 28)),
          agama,
          pendidikan:
            usiaAnak < 6 ? "Belum Sekolah" : usiaAnak < 12 ? "SD" : usiaAnak < 15 ? "SMP" : usiaAnak < 19 ? "SMA/SMK" : pilih(["SMA/SMK", "D1-D3", "S1"]),
          pekerjaan: usiaAnak < 6 ? "Belum/Tidak Bekerja" : usiaAnak < 23 ? "Pelajar/Mahasiswa" : pilih(PEKERJAAN_L),
          statusPerkawinan: "Belum Kawin",
          hubungan: "ANAK",
          alamat,
          rtId: rt.id,
        });
      }
    }
    await db.rt.update({ where: { id: rt.id }, data: { jumlahKk } });
  }

  await db.warga.createMany({ data: wargaBaru });
  console.log(`  ${wargaBaru.length} jiwa dibuat di ${semuaRt.length} RT.`);

  console.log("Membuat berita...");
  // rw: null berarti berita tingkat kampung — tampil di ketiga laman RW.
  const beritaData: {
    rw: number | null;
    judul: string;
    kategori: string;
    hari: number;
    ringkasan: string;
    konten: string;
  }[] = [
    {
      rw: null,
      judul: "Tiga RW Sanggrahan Kini Berbagi Satu Situs Warga",
      kategori: "Umum",
      hari: -2,
      ringkasan:
        "RW 01, RW 02, dan RW 03 menyatukan papan informasinya dalam satu situs. Tiap RW tetap mengelola lamannya sendiri, termasuk laporan kasnya.",
      konten:
        "Mulai pekan ini, warga Kampung Sanggrahan dapat mengakses informasi ketiga RW melalui satu alamat situs. RW 01, RW 02, dan RW 03 masing-masing memiliki lamannya sendiri yang berisi berita, agenda kegiatan, data kependudukan, dan laporan kas RT di wilayahnya.\n\nPenyatuan ini tidak menghilangkan kemandirian tiap RW. Pengurus RW 01 hanya dapat menyunting isi laman RW 01, begitu pula RW 02 dan RW 03. Ketua RW hanya mengesahkan laporan kas RT yang berada di bawah RW-nya sendiri.\n\nKabar yang menyangkut ketiga RW sekaligus — seperti tulisan ini — ditandai sebagai kabar tingkat kampung dan tampil di ketiga laman.\n\nWarga yang ingin menyampaikan usulan, keluhan, atau kabar dapat menghubungi Ketua RT masing-masing.",
    },
    {
      rw: null,
      judul: "Jadwal Posyandu Balita dan Lansia Kampung Sanggrahan Bulan Ini",
      kategori: "Kesehatan",
      hari: -9,
      ringkasan:
        "Pelayanan posyandu digelar bergiliran di balai ketiga RW sepanjang bulan ini, terbuka untuk seluruh warga Kampung Sanggrahan.",
      konten:
        "Kader posyandu Kampung Sanggrahan menetapkan jadwal pelayanan bulan ini yang digelar bergiliran di balai RW 01, RW 02, dan RW 03. Warga boleh datang ke balai mana pun yang jadwalnya paling sesuai, tidak harus di RW tempat tinggalnya.\n\nPelayanan mencakup penimbangan berat badan, pengukuran tinggi badan dan lingkar kepala balita, pemberian vitamin A, imunisasi lanjutan, serta pemeriksaan tekanan darah dan gula darah untuk warga lanjut usia.\n\nMohon membawa buku KIA atau kartu lansia. Seluruh layanan tidak dipungut biaya.\n\nKoordinator posyandu kampung mengimbau orang tua balita yang dua bulan berturut-turut tidak hadir untuk menghubungi kader di RT masing-masing agar dapat dijadwalkan kunjungan ke rumah.",
    },
    {
      rw: 1,
      judul: "Kerja Bakti Bersihkan Saluran Air Jelang Musim Hujan",
      kategori: "Lingkungan",
      hari: -6,
      ringkasan:
        "Warga tiga RT di RW 01 turun membersihkan gorong-gorong dan saluran air sepanjang gang utama.",
      konten:
        "Minggu pagi lalu, warga RW 01 Kampung Sanggrahan menggelar kerja bakti membersihkan saluran air menjelang musim hujan. Kegiatan dimulai pukul 06.30 dan berlangsung hingga menjelang siang.\n\nKetua RW 01 menyampaikan bahwa endapan lumpur di gorong-gorong sepanjang gang utama menjadi penyebab utama genangan pada musim hujan tahun lalu. \"Kalau salurannya lancar, air tidak lagi meluap ke halaman warga. Ini pekerjaan yang harus kita lakukan bersama, tidak bisa diserahkan ke satu dua orang saja,\" ujarnya di sela kegiatan.\n\nTiap RT mengerahkan warganya untuk membersihkan segmen saluran di wilayah masing-masing. Ibu-ibu PKK menyiapkan konsumsi berupa teh hangat dan jajanan pasar, sementara karang taruna membantu mengangkut sampah dan sedimen ke titik kumpul.\n\nPengurus RW 01 berencana menjadikan kerja bakti saluran air ini agenda rutin setiap tiga bulan.",
    },
    {
      rw: 1,
      judul: "Laporan Kas RT RW 01 Kini Dapat Dibaca Warga Kapan Saja",
      kategori: "Umum",
      hari: -20,
      ringkasan:
        "Setiap laporan kas yang telah diverifikasi Ketua RT dan disetujui Ketua RW 01 otomatis tampil di laman keuangan RW 01.",
      konten:
        "Seluruh laporan kas RT di lingkungan RW 01 kini dipublikasikan melalui laman RW 01 pada situs kampung. Warga dapat melihat rincian pemasukan dan pengeluaran kas RT masing-masing tanpa harus menunggu rapat bulanan.\n\nAlur pelaporan disusun berjenjang. Bendahara RT menyusun laporan beserta rincian transaksi, kemudian mengajukannya untuk diverifikasi oleh Ketua RT. Setelah diverifikasi, laporan diteruskan kepada Ketua RW 01 untuk mendapat persetujuan akhir. Hanya laporan yang telah melewati kedua tahap tersebut yang tampil di halaman publik.\n\n\"Kalau ada angka yang menurut Ketua RT belum sesuai, laporan bisa dikembalikan ke bendahara dengan catatan. Semua langkah itu tercatat, siapa yang memverifikasi dan kapan,\" jelas Sekretaris RW 01.\n\nKetua RW 01 hanya berwenang mengesahkan laporan RT di bawah RW 01; kas RW 02 dan RW 03 disahkan ketua RW-nya masing-masing.",
    },
    {
      rw: 1,
      judul: "Ronda Malam RW 01 Kembali Diaktifkan dengan Jadwal Baru",
      kategori: "Keamanan",
      hari: -27,
      ringkasan:
        "Menyusul dua kejadian pencurian sepeda motor di wilayah tetangga, jadwal ronda malam RW 01 dirapikan menjadi enam orang per malam.",
      konten:
        "Rapat pengurus RW 01 bersama seluruh Ketua RT memutuskan mengaktifkan kembali ronda malam dengan jadwal yang lebih tertib. Keputusan diambil menyusul laporan dua kejadian pencurian sepeda motor di wilayah tetangga pada bulan lalu.\n\nSetiap malam akan bertugas enam warga yang berasal dari dua RT secara bergantian, dengan pembagian dua shift: pukul 22.00 hingga 01.00 dan pukul 01.00 hingga 04.00. Pos ronda di dekat balai RW telah diperbaiki dan dilengkapi lampu sorot serta buku catatan kejadian.\n\nSeksi Keamanan RW 01 mengimbau warga untuk tetap mengunci pagar dan menyalakan lampu teras sepanjang malam, serta melaporkan keberadaan orang tak dikenal melalui nomor kontak keamanan yang tertera di pos ronda.",
    },
    {
      rw: 2,
      judul: "Lampu Penerangan Gang RW 02 Diganti Serentak",
      kategori: "Pembangunan",
      hari: -4,
      ringkasan:
        "Dua puluh dua titik lampu gang di RW 02 diganti dengan lampu hemat energi, dibiayai kas RW dan swadaya warga.",
      konten:
        "Pengurus RW 02 mengganti 22 titik lampu penerangan gang dengan lampu hemat energi. Penggantian dikerjakan bertahap selama satu pekan oleh warga bersama seorang teknisi listrik yang juga warga setempat.\n\nWilayah RW 02 menjadi jalur lintasan warga menuju pasar dan sekolah, sehingga penerangan gang dinilai berpengaruh langsung pada keselamatan dan rasa aman, terutama bagi anak sekolah dan warga lanjut usia yang berjalan kaki pada malam hari.\n\nPembiayaan berasal dari kas RW 02 dan iuran tambahan sukarela warga. Rinciannya dilaporkan pada laporan kas RT bulan berjalan dan dapat dibaca di laman keuangan RW 02.",
    },
    {
      rw: 2,
      judul: "RW 02 Tata Ulang Parkir Gang Agar Ambulans Bisa Masuk",
      kategori: "Keamanan",
      hari: -16,
      ringkasan:
        "Kesepakatan warga menyisakan lebar gang minimal 2,5 meter bebas kendaraan parkir di seluruh wilayah RW 02.",
      konten:
        "Rapat warga RW 02 menyepakati penataan ulang parkir kendaraan di gang. Setiap gang harus menyisakan lebar minimal 2,5 meter bebas kendaraan agar ambulans dan mobil pemadam kebakaran dapat masuk bila diperlukan.\n\nKesepakatan ini muncul setelah pengalaman bulan lalu, ketika ambulans yang menjemput warga sakit harus berhenti di ujung gang dan pasien dipapah keluar sejauh puluhan meter.\n\nKetua RW 02 meminta setiap Ketua RT mendata rumah yang tidak memiliki ruang parkir sendiri, untuk kemudian dicarikan titik parkir bersama di halaman balai RW dan lahan kosong yang dipinjamkan warga.",
    },
    {
      rw: 3,
      judul: "Bank Sampah RW 03 Salurkan Rp 4,2 Juta ke Nasabah Warga",
      kategori: "Lingkungan",
      hari: -12,
      ringkasan:
        "Selama satu semester, bank sampah RW 03 mengumpulkan 3,1 ton sampah anorganik dan mengembalikan hasilnya kepada warga penyetor.",
      konten:
        "Bank sampah yang dikelola ibu-ibu PKK RW 03 melaporkan capaian semester pertama tahun ini. Sebanyak 3,1 ton sampah anorganik berhasil dikumpulkan dari 142 nasabah warga dan disalurkan ke pengepul mitra.\n\nHasil penjualan sebesar Rp 4,2 juta dikembalikan kepada nasabah sesuai setoran masing-masing, sementara 10 persen disisihkan sebagai kas operasional bank sampah untuk pembelian karung, timbangan, dan biaya angkut.\n\nJenis sampah yang paling banyak disetorkan adalah botol plastik PET, kardus, dan kaleng aluminium. Pengelola mengajak lebih banyak warga bergabung. Penimbangan dilakukan setiap Sabtu pagi di halaman balai RW 03.",
    },
    {
      rw: 3,
      judul: "Pelatihan Pemasaran Digital untuk 25 Pelaku Usaha Rumahan RW 03",
      kategori: "Pendidikan",
      hari: -25,
      ringkasan:
        "Karang taruna RW 03 menggandeng mahasiswa KKN untuk melatih pemilik warung dan usaha rumahan memasarkan produk lewat media sosial.",
      konten:
        "Sebanyak 25 pelaku usaha mikro di RW 03 mengikuti pelatihan pemasaran digital yang digelar karang taruna bekerja sama dengan mahasiswa KKN dari perguruan tinggi setempat. Pelatihan berlangsung dua hari di balai RW 03.\n\nMateri mencakup pemotretan produk menggunakan telepon genggam, penulisan deskripsi produk, pengelolaan akun media sosial, serta pendaftaran usaha pada layanan pesan antar daring.\n\nPeserta didominasi pemilik usaha kuliner rumahan seperti katering, kue kering, dan minuman kemasan. Panitia menyiapkan pendampingan lanjutan selama satu bulan bagi peserta yang ingin dibantu membuat katalog produk.\n\nSebagian peserta juga didaftarkan ke registri usaha warga Sanggrahan yang situsnya terpisah dari situs ini.",
    },
    {
      rw: 3,
      judul: "Taman Kampung RW 03 Ditanami Ulang oleh Warga dan Pelajar",
      kategori: "Lingkungan",
      hari: -38,
      ringkasan:
        "Ruang terbuka di Gang Cempaka ditanami tanaman obat keluarga dan pohon peneduh hasil sumbangan warga.",
      konten:
        "Ruang terbuka di Gang Cempaka, RW 03, ditanami ulang oleh warga bersama pelajar yang tinggal di sekitarnya. Kegiatan diisi penanaman tanaman obat keluarga, tanaman hias, dan empat pohon peneduh.\n\nBibit berasal dari sumbangan warga dan bantuan kelurahan. Perawatan harian dibagi per RT dengan jadwal bergilir, sementara penyiraman pada musim kemarau dikoordinasikan seksi lingkungan RW 03.\n\nTaman ini juga dipakai sebagai tempat kegiatan posyandu balita saat cuaca cerah dan menjadi titik kumpul warga pada sore hari.",
    },
  ];

  for (let i = 0; i < beritaData.length; i++) {
    const b = beritaData[i];
    await db.berita.create({
      data: {
        rwId: b.rw === null ? null : rwTersimpan.get(b.rw)!.id,
        judul: b.judul,
        slug: keSlug(b.judul),
        ringkasan: b.ringkasan,
        konten: b.konten,
        kategori: b.kategori,
        status: "TERBIT",
        terbitAt: tanggalRelatif(b.hari, 9),
        dilihat: antara(40, 620),
        gambar: tulisGambar(`berita-${i + 1}`, b.judul, i + 2),
        penulisId:
          b.rw === null ? admin.id : (sekretarisPerRw.get(b.rw) ?? admin.id),
      },
    });
  }

  console.log("Membuat agenda kegiatan...");
  const kegiatanData: {
    rw: number | null;
    judul: string;
    kategori: string;
    hari: number;
    jam: number;
    durasi: number;
    lokasi: string;
    penyelenggara: string;
    deskripsi: string;
    status?: string;
  }[] = [
    {
      rw: null,
      judul: "Peringatan Maulid Nabi dan Pengajian Akbar Kampung Sanggrahan",
      kategori: "Keagamaan",
      hari: 33,
      jam: 19,
      durasi: 3,
      lokasi: "Masjid Al-Ikhlas Sanggrahan",
      penyelenggara: "Takmir Masjid & Pengurus Tiga RW",
      deskripsi:
        "Peringatan Maulid Nabi Muhammad SAW diisi ceramah agama, pembacaan salawat bersama, dan santunan anak yatim dari ketiga RW. Panitia menerima sumbangan konsumsi dari warga. Seluruh warga Kampung Sanggrahan diundang hadir bersama keluarga.",
    },
    {
      rw: null,
      judul: "Turnamen Bulu Tangkis Antar-RW Piala Kampung Sanggrahan",
      kategori: "Olahraga",
      hari: 26,
      jam: 19,
      durasi: 4,
      lokasi: "GOR Sanggrahan",
      penyelenggara: "Karang Taruna Tiga RW",
      deskripsi:
        "Turnamen ganda putra dan ganda campuran memperebutkan Piala Kampung. Setiap RW mengirim maksimal empat pasangan per kategori, disaring lebih dulu di tingkat RW masing-masing. Babak penyisihan digelar tiga malam berturut-turut.",
    },
    {
      rw: 1,
      judul: "Rapat Koordinasi Pengurus RW 01 dan Ketua RT",
      kategori: "Rapat",
      hari: 4,
      jam: 19,
      durasi: 2,
      lokasi: "Balai RW 01",
      penyelenggara: "Pengurus RW 01",
      deskripsi:
        "Agenda rapat meliputi evaluasi program semester, laporan kas RT periode Agustus, dan pembahasan usulan perbaikan penerangan jalan. Seluruh Ketua RT dan bendahara diharapkan hadir tepat waktu dengan membawa rekapitulasi kas masing-masing.",
    },
    {
      rw: 1,
      judul: "Kerja Bakti Pengecatan Pos Ronda dan Balai RW 01",
      kategori: "Kerja Bakti",
      hari: 11,
      jam: 6,
      durasi: 4,
      lokasi: "Pos Ronda & Balai RW 01",
      penyelenggara: "Seksi Kebersihan RW 01",
      deskripsi:
        "Warga diminta membawa kuas dan peralatan seadanya. Cat, kuas cadangan, dan konsumsi disediakan panitia dari kas RW. Sasaran pengerjaan adalah pengecatan ulang pos ronda, pagar balai RW, serta perbaikan papan informasi warga.",
    },
    {
      rw: 1,
      judul: "Kerja Bakti Saluran Air RW 01",
      kategori: "Kerja Bakti",
      hari: -6,
      jam: 6,
      durasi: 5,
      lokasi: "Gang Melati, RT 01",
      penyelenggara: "Pengurus RW 01",
      deskripsi:
        "Pembersihan sedimen saluran air dan pengangkutan sampah bersama warga tiga RT di RW 01.",
      status: "SELESAI",
    },
    {
      rw: 2,
      judul: "Posyandu Balita dan Lansia RW 02",
      kategori: "Posyandu",
      hari: 7,
      jam: 8,
      durasi: 4,
      lokasi: "Balai RW 02",
      penyelenggara: "Kader Posyandu RW 02",
      deskripsi:
        "Pelayanan meliputi penimbangan berat badan, pengukuran tinggi badan dan lingkar kepala balita, pemberian vitamin, serta pemeriksaan tekanan darah dan gula darah untuk warga lanjut usia. Mohon membawa buku KIA atau kartu lansia. Layanan gratis.",
    },
    {
      rw: 2,
      judul: "Rapat Warga: Penataan Parkir Gang RW 02",
      kategori: "Rapat",
      hari: 9,
      jam: 19,
      durasi: 2,
      lokasi: "Balai RW 02",
      penyelenggara: "Pengurus RW 02",
      deskripsi:
        "Tindak lanjut kesepakatan lebar gang minimal 2,5 meter bebas kendaraan. Agenda: pendataan rumah tanpa ruang parkir, penetapan titik parkir bersama, dan penyusunan jadwal pengawasan per RT.",
    },
    {
      rw: 2,
      judul: "Pelatihan Tanggap Bencana dan Simulasi Pemadaman Api",
      kategori: "Pelatihan",
      hari: 19,
      jam: 8,
      durasi: 3,
      lokasi: "Lapangan RW 02",
      penyelenggara: "Karang Taruna RW 02 bersama Damkar Kota",
      deskripsi:
        "Petugas pemadam kebakaran memberikan materi pencegahan kebakaran rumah tangga, cara aman menangani kebocoran gas, serta simulasi penggunaan alat pemadam api ringan. Terbuka untuk seluruh warga Kampung Sanggrahan, kuota 60 peserta. Pendaftaran melalui Ketua RT masing-masing.",
    },
    {
      rw: 3,
      judul: "Penimbangan Bank Sampah RW 03",
      kategori: "Umum",
      hari: 5,
      jam: 7,
      durasi: 3,
      lokasi: "Halaman Balai RW 03",
      penyelenggara: "PKK RW 03",
      deskripsi:
        "Penimbangan rutin setiap Sabtu pagi. Sampah anorganik dipilah sesuai jenisnya: botol plastik, kardus, kertas, dan kaleng. Nasabah baru dapat mendaftar langsung di tempat dengan membawa kartu keluarga.",
    },
    {
      rw: 3,
      judul: "Pertemuan Rutin PKK dan Arisan RW 03",
      kategori: "Umum",
      hari: 14,
      jam: 15,
      durasi: 2,
      lokasi: "Balai RW 03",
      penyelenggara: "TP PKK RW 03",
      deskripsi:
        "Pertemuan bulanan PKK diisi laporan kegiatan bank sampah, demo memasak menu bergizi seimbang untuk balita, serta pengundian arisan. Iuran arisan dikumpulkan sebelum acara dimulai.",
    },
    {
      rw: 3,
      judul: "Penanaman Ulang Taman Kampung Gang Cempaka",
      kategori: "Kerja Bakti",
      hari: -38,
      jam: 7,
      durasi: 4,
      lokasi: "Taman Gang Cempaka, RW 03",
      penyelenggara: "Seksi Lingkungan RW 03",
      deskripsi:
        "Penanaman tanaman obat keluarga, tanaman hias, dan pohon peneduh bersama warga dan pelajar sekitar.",
      status: "SELESAI",
    },
  ];

  for (let i = 0; i < kegiatanData.length; i++) {
    const k = kegiatanData[i];
    const mulai = tanggalRelatif(k.hari, k.jam);
    const selesai = new Date(mulai);
    selesai.setHours(selesai.getHours() + k.durasi);

    await db.kegiatan.create({
      data: {
        rwId: k.rw === null ? null : rwTersimpan.get(k.rw)!.id,
        judul: k.judul,
        slug: `${keSlug(k.judul, 60)}-${i + 1}`,
        deskripsi: k.deskripsi,
        mulai,
        selesai,
        lokasi: k.lokasi,
        penyelenggara: k.penyelenggara,
        kategori: k.kategori,
        kontak:
          k.rw === null
            ? "Sekretariat Kampung 0274-549455"
            : `Sekretariat ${rwTersimpan.get(k.rw)!.nama} ${BAHAN_RW[k.rw - 1].telepon}`,
        status: k.status ?? "TERBIT",
        gambar: tulisGambar(`kegiatan-${i + 1}`, k.judul, i + 3),
        dibuatOlehId: k.rw === null ? admin.id : (sekretarisPerRw.get(k.rw) ?? admin.id),
      },
    });
  }

  console.log("Membuat pengumuman...");
  const pengumumanData: {
    rw: number | null;
    judul: string;
    isi: string;
    penting: boolean;
    berakhirHari: number;
  }[] = [
    {
      rw: null,
      judul: "Pemadaman listrik terjadwal Sabtu pagi di wilayah Sanggrahan",
      isi: "PLN memberitahukan pemadaman terjadwal pada Sabtu pukul 08.00 - 12.00 untuk pemeliharaan jaringan di wilayah Sanggrahan dan sekitarnya. Berlaku untuk ketiga RW.",
      penting: true,
      berakhirHari: 10,
    },
    {
      rw: null,
      judul: "Pendaftaran lomba bulu tangkis antar-RW dibuka",
      isi: "Pasangan peserta didaftarkan melalui Ketua RT masing-masing, lalu disaring di tingkat RW. Tidak dipungut biaya pendaftaran.",
      penting: false,
      berakhirHari: 19,
    },
    {
      rw: 1,
      judul: "Iuran warga RW 01 bulan ini dibuka mulai tanggal 1",
      isi: "Iuran warga, keamanan, dan kebersihan sebesar Rp 75.000 per KK disetorkan kepada bendahara RT masing-masing paling lambat tanggal 20.",
      penting: true,
      berakhirHari: 20,
    },
    {
      rw: 2,
      judul: "Gang Dahlia ditutup sementara selama penggantian lampu",
      isi: "Penggantian lampu penerangan menutup sebagian Gang Dahlia pada pukul 08.00 - 15.00. Warga diminta memarkir kendaraan di halaman balai RW 02 selama pengerjaan.",
      penting: true,
      berakhirHari: 6,
    },
    {
      rw: 3,
      judul: "Pengambilan kartu keluarga sehat di balai RW 03",
      isi: "Warga RW 03 yang telah mendaftar program bantuan kesehatan dapat mengambil kartu di balai RW setiap hari kerja pukul 16.00 - 18.00 dengan membawa fotokopi KTP.",
      penting: false,
      berakhirHari: 25,
    },
  ];

  for (const p of pengumumanData) {
    await db.pengumuman.create({
      data: {
        rwId: p.rw === null ? null : rwTersimpan.get(p.rw)!.id,
        judul: p.judul,
        isi: p.isi,
        penting: p.penting,
        berakhir: tanggalRelatif(p.berakhirHari, 23),
        aktif: true,
      },
    });
  }

  console.log("Membuat galeri...");
  const albumData: {
    rw: number | null;
    nama: string;
    slug: string;
    jumlah: number;
    hari: number;
    deskripsi: string;
  }[] = [
    {
      rw: null,
      nama: "HUT Kemerdekaan RI ke-81 Kampung Sanggrahan",
      slug: "hut-kemerdekaan-ri-81",
      jumlah: 8,
      hari: -18,
      deskripsi: "Lomba anak, panjat pinang, dan malam tirakatan bersama warga ketiga RW.",
    },
    {
      rw: 1,
      nama: "Kerja Bakti Saluran Air RW 01",
      slug: "kerja-bakti-saluran-air-rw-01",
      jumlah: 6,
      hari: -6,
      deskripsi: "Dokumentasi kerja bakti tiga RT membersihkan gorong-gorong.",
    },
    {
      rw: 2,
      nama: "Penggantian Lampu Gang RW 02",
      slug: "penggantian-lampu-gang-rw-02",
      jumlah: 5,
      hari: -4,
      deskripsi: "Pemasangan 22 titik lampu hemat energi di gang-gang RW 02.",
    },
    {
      rw: 3,
      nama: "Penanaman Taman Kampung RW 03",
      slug: "penanaman-taman-kampung-rw-03",
      jumlah: 5,
      hari: -38,
      deskripsi: "Warga dan pelajar menanami ulang ruang terbuka di Gang Cempaka.",
    },
  ];

  for (let i = 0; i < albumData.length; i++) {
    const a = albumData[i];
    const album = await db.album.create({
      data: {
        rwId: a.rw === null ? null : rwTersimpan.get(a.rw)!.id,
        nama: a.nama,
        slug: a.slug,
        deskripsi: a.deskripsi,
        tanggal: tanggalRelatif(a.hari),
      },
    });
    for (let f = 0; f < a.jumlah; f++) {
      await db.foto.create({
        data: {
          albumId: album.id,
          url: tulisGambar(`galeri-${i + 1}-${f + 1}`, `${a.nama} ${f + 1}`, i * 3 + f),
          judul: `${a.nama} - foto ${f + 1}`,
          urutan: f,
        },
      });
    }
  }

  console.log("Membuat laporan keuangan dan alur persetujuan...");
  const periodeList = [
    { bulan: 5, tahun: 2026 },
    { bulan: 6, tahun: 2026 },
    { bulan: 7, tahun: 2026 },
    { bulan: 8, tahun: 2026 },
  ];

  async function catat(
    laporanId: number,
    aksi: string,
    olehId: number,
    catatan: string | null,
    createdAt: Date,
  ) {
    await db.riwayatPersetujuan.create({
      data: { laporanId, aksi, olehId, catatan, createdAt },
    });
  }

  for (let idxRt = 0; idxRt < semuaRt.length; idxRt++) {
    const rt = semuaRt[idxRt];
    // Persetujuan akhir selalu datang dari Ketua RW yang menaungi RT ini —
    // itulah aturan yang dijaga src/lib/otorisasi.ts, dan seed tidak boleh
    // menghasilkan data yang melanggarnya.
    const ketuaRwId = ketuaRwPerRw.get(rt.rwNomor)!;
    let saldoAwal = antara(1_200_000, 3_500_000);

    for (let idxP = 0; idxP < periodeList.length; idxP++) {
      const p = periodeList[idxP];

      // Periode lama sudah disetujui; dua periode terakhir sengaja dibuat
      // bervariasi. Sebarannya dihitung dari posisi RT **di dalam RW-nya**,
      // bukan dari nomor urut se-kampung, supaya ketiga RW sama-sama punya
      // contoh tiap tahap — termasuk laporan draf yang bisa disunting bendahara.
      const posisi = idxRt % 3;
      let status = "DISETUJUI";
      if (idxP === 2) {
        if (posisi === 1) status = "DIVERIFIKASI_RT";
      } else if (idxP === 3) {
        status = posisi === 0 ? "DRAFT" : posisi === 1 ? "DIAJUKAN" : "DITOLAK";
      }

      const transaksi: {
        tanggal: Date; jenis: string; kategori: string; keterangan: string; jumlah: number;
      }[] = [];

      const tgl = (h: number) => new Date(p.tahun, p.bulan - 1, h, 9, 0, 0);
      const kkBayar = Math.round(rt.jumlahKk * (0.82 + rng() * 0.16));

      transaksi.push({
        tanggal: tgl(5),
        jenis: "PEMASUKAN",
        kategori: "Iuran Warga",
        keterangan: `Iuran rutin ${kkBayar} KK @ Rp 35.000`,
        jumlah: kkBayar * 35_000,
      });
      transaksi.push({
        tanggal: tgl(8),
        jenis: "PEMASUKAN",
        kategori: "Iuran Keamanan",
        keterangan: `Iuran keamanan ${kkBayar} KK @ Rp 25.000`,
        jumlah: kkBayar * 25_000,
      });
      transaksi.push({
        tanggal: tgl(10),
        jenis: "PEMASUKAN",
        kategori: "Iuran Kebersihan",
        keterangan: `Iuran pengangkutan sampah ${kkBayar} KK @ Rp 15.000`,
        jumlah: kkBayar * 15_000,
      });
      if (rng() > 0.55) {
        transaksi.push({
          tanggal: tgl(antara(12, 20)),
          jenis: "PEMASUKAN",
          kategori: "Sumbangan",
          keterangan: pilih([
            "Sumbangan warga untuk kegiatan sosial",
            "Donasi usaha warga",
            "Sumbangan hajatan warga",
          ]),
          jumlah: antara(3, 12) * 50_000,
        });
      }

      transaksi.push({
        tanggal: tgl(25),
        jenis: "PENGELUARAN",
        kategori: "Honor Petugas Keamanan",
        keterangan: "Honor petugas ronda dan penjaga malam",
        jumlah: 600_000,
      });
      transaksi.push({
        tanggal: tgl(25),
        jenis: "PENGELUARAN",
        kategori: "Honor Petugas Kebersihan",
        keterangan: "Honor petugas pengangkut sampah",
        jumlah: 450_000,
      });
      transaksi.push({
        tanggal: tgl(18),
        jenis: "PENGELUARAN",
        kategori: "Listrik & Air",
        keterangan: "Rekening listrik pos ronda dan lampu jalan",
        jumlah: antara(140, 240) * 1_000,
      });
      transaksi.push({
        tanggal: tgl(antara(6, 22)),
        jenis: "PENGELUARAN",
        kategori: "Konsumsi Rapat",
        keterangan: "Konsumsi rapat rutin warga RT",
        jumlah: antara(120, 320) * 1_000,
      });
      if (rng() > 0.4) {
        transaksi.push({
          tanggal: tgl(antara(8, 26)),
          jenis: "PENGELUARAN",
          kategori: pilih(["Kegiatan Sosial", "Perbaikan Fasilitas", "Administrasi"]),
          keterangan: pilih([
            "Santunan warga sakit",
            "Perbaikan lampu penerangan gang",
            "Pembelian alat kebersihan",
            "Cetak kartu iuran warga",
            "Bantuan duka warga",
          ]),
          jumlah: antara(2, 14) * 100_000,
        });
      }

      const totalMasuk = transaksi.filter((t) => t.jenis === "PEMASUKAN").reduce((a, t) => a + t.jumlah, 0);
      const totalKeluar = transaksi.filter((t) => t.jenis === "PENGELUARAN").reduce((a, t) => a + t.jumlah, 0);

      const tanggalAjukan = new Date(p.tahun, p.bulan, 2, 20, 0, 0);
      const tanggalVerif = new Date(p.tahun, p.bulan, 4, 19, 30, 0);
      const tanggalSetuju = new Date(p.tahun, p.bulan, 6, 20, 15, 0);
      const sudahVerif = status === "DIVERIFIKASI_RT" || status === "DISETUJUI";

      const laporan = await db.laporanKeuangan.create({
        data: {
          judul: `Laporan Kas ${rt.nama} - ${NAMA_BULAN_SEED[p.bulan - 1]} ${p.tahun}`,
          bulan: p.bulan,
          tahun: p.tahun,
          rtId: rt.id,
          saldoAwal,
          status,
          catatan: status === "DRAFT" ? "Masih menunggu bukti setoran dari dua KK." : null,
          dibuatOlehId: rt.bendaharaId,
          diajukanAt: status === "DRAFT" ? null : tanggalAjukan,
          verifikasiRtOlehId: sudahVerif ? rt.ketuaId : null,
          verifikasiRtAt: sudahVerif ? tanggalVerif : null,
          catatanRt: sudahVerif
            ? "Rincian sudah sesuai buku kas dan bukti setoran."
            : status === "DITOLAK"
              ? "Nota pembelian alat kebersihan belum dilampirkan, mohon dilengkapi."
              : null,
          persetujuanRwOlehId: status === "DISETUJUI" ? ketuaRwId : null,
          persetujuanRwAt: status === "DISETUJUI" ? tanggalSetuju : null,
          catatanRw:
            status === "DISETUJUI" ? "Disetujui untuk dipublikasikan kepada warga." : null,
          transaksi: { create: transaksi },
        },
      });

      await catat(
        laporan.id,
        "BUAT",
        rt.bendaharaId,
        null,
        new Date(p.tahun, p.bulan - 1, 28, 20, 0, 0),
      );
      if (status !== "DRAFT") {
        await catat(
          laporan.id,
          "AJUKAN",
          rt.bendaharaId,
          "Laporan diajukan untuk diverifikasi Ketua RT.",
          tanggalAjukan,
        );
      }
      if (sudahVerif) {
        await catat(
          laporan.id,
          "VERIFIKASI_RT",
          rt.ketuaId,
          "Rincian sudah sesuai buku kas dan bukti setoran.",
          tanggalVerif,
        );
      }
      if (status === "DITOLAK") {
        await catat(
          laporan.id,
          "TOLAK_RT",
          rt.ketuaId,
          "Nota pembelian alat kebersihan belum dilampirkan, mohon dilengkapi.",
          tanggalVerif,
        );
      }
      if (status === "DISETUJUI") {
        await catat(
          laporan.id,
          "SETUJUI_RW",
          ketuaRwId,
          "Disetujui untuk dipublikasikan kepada warga.",
          tanggalSetuju,
        );
      }

      saldoAwal = saldoAwal + totalMasuk - totalKeluar;
    }
  }

  console.log("\nSeed selesai.");
  console.log(`Kata sandi seluruh akun contoh: ${KATA_SANDI_DEMO}`);
  console.log("");
  console.log(`  admin@${DOMAIN}                 -> Administrator kampung (lintas RW)`);
  for (const b of BAHAN_RW) {
    console.log(`  ketuarw${b.nomor}@${DOMAIN}              -> Ketua RW 0${b.nomor} (persetujuan kas RW 0${b.nomor})`);
    console.log(`  sekretaris.rw${b.nomor}@${DOMAIN}        -> Sekretaris RW 0${b.nomor} (konten RW 0${b.nomor})`);
    console.log(`  ketuart01.rw${b.nomor}@${DOMAIN}         -> Ketua RT 01 RW 0${b.nomor} (verifikasi)`);
    console.log(`  bendaharart01.rw${b.nomor}@${DOMAIN}     -> Bendahara RT 01 RW 0${b.nomor} (input kas)`);
  }
  console.log("");
  console.log("  Pola surel RT berlaku sampai RT 03 di tiap RW.");
  console.log(`  ${semuaRt.length} RT, ${wargaBaru.length} jiwa, ${BAHAN_RW.length} RW.`);
  console.log("");
  console.log("  CATATAN DATA: jumlah RT di RW 02 dan RW 03 adalah dugaan mengikuti");
  console.log("  pola RW 01 (tiga RT). Cocokkan ke pengurus, lalu perbaiki dari");
  console.log("  /admin/pengaturan.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
