import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { tulisGambar } from "./gambar";

const db = new PrismaClient();

const KATA_SANDI_DEMO = "sanggrahan123";

/** RNG deterministik supaya hasil seed selalu sama. */
function pembangkitAcak(seed: number) {
  let s = seed;
  return function next(): number {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
const rng = pembangkitAcak(20260903);
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
}

async function main() {
  console.log("Membersihkan data lama...");
  await bersihkan();

  const hash = await bcrypt.hash(KATA_SANDI_DEMO, 10);

  console.log("Menyiapkan pengaturan situs...");
  await db.pengaturan.create({
    data: {
      id: 1,
      namaRw: "RW 05 Sanggrahan",
      tagline: "Guyub Rukun, Warga Maju, Lingkungan Asri",
      deskripsi:
        "Portal resmi RW 05 Sanggrahan sebagai pusat informasi warga: berita lingkungan, agenda kegiatan, data kependudukan, serta laporan keuangan kas RT yang transparan dan dapat dipertanggungjawabkan.",
      sejarah:
        "Kampung Sanggrahan mulai berkembang sebagai permukiman padat pada awal 1980-an, ketika lahan persawahan di sisi timur kali secara bertahap berubah menjadi rumah tinggal. Nama Sanggrahan sendiri berasal dari kata \"sanggrah\" yang berarti tempat singgah, merujuk pada pesanggrahan tua yang dahulu menjadi tempat beristirahat para musafir yang melintasi jalur ini.\n\nRukun Warga 05 dibentuk pada tahun 1987 dengan tiga RT awal. Seiring bertambahnya jumlah kepala keluarga, wilayah ini dimekarkan menjadi delapan RT seperti sekarang. Balai RW yang berdiri di tengah kampung dibangun secara gotong royong pada tahun 2003 dan kini menjadi pusat kegiatan warga, mulai dari posyandu, rapat bulanan, hingga pertemuan karang taruna.\n\nSemangat gotong royong tetap menjadi ciri khas warga Sanggrahan. Kerja bakti rutin, ronda malam bergilir, dan arisan RT masih berjalan hingga hari ini sebagai perekat kehidupan bertetangga.",
      visi:
        "Mewujudkan RW 05 Sanggrahan sebagai lingkungan yang guyub, aman, sehat, dan mandiri dengan tata kelola yang terbuka serta partisipasi aktif seluruh warga.",
      misi:
        "Menjaga kerukunan dan semangat gotong royong antarwarga\nMeningkatkan keamanan dan ketertiban lingkungan melalui ronda terjadwal\nMengelola keuangan kas RT dan RW secara transparan dan akuntabel\nMendorong lingkungan bersih, hijau, dan bebas sampah liar\nMemberdayakan UMKM, PKK, dan karang taruna sebagai penggerak ekonomi warga\nMenyediakan layanan administrasi kependudukan yang cepat dan ramah",
      alamat: "Jl. Sanggrahan Raya No. 12, Kelurahan Sanggrahan, Kode Pos 57000",
      telepon: "0812-3456-7890",
      email: "sekretariat@rw05sanggrahan.id",
      heroFoto: tulisGambar("hero-kampung", "Kampung Sanggrahan Guyub", 0),
    },
  });

  console.log("Membuat data RT...");
  const dataRt = [
    { nomor: "01", wilayah: "Gang Melati & Jl. Sanggrahan Raya sisi utara" },
    { nomor: "02", wilayah: "Gang Mawar dan sekitarnya" },
    { nomor: "03", wilayah: "Gang Kenanga hingga lapangan" },
    { nomor: "04", wilayah: "Perumahan Sanggrahan Asri blok A-C" },
    { nomor: "05", wilayah: "Perumahan Sanggrahan Asri blok D-F" },
    { nomor: "06", wilayah: "Gang Dahlia dan bantaran kali" },
    { nomor: "07", wilayah: "Jl. Sanggrahan Raya sisi selatan" },
    { nomor: "08", wilayah: "Gang Anggrek dan area persawahan" },
  ];

  const rtList = [];
  for (const r of dataRt) {
    rtList.push(
      await db.rt.create({
        data: { nomor: r.nomor, nama: `RT ${r.nomor} / RW 05`, wilayah: r.wilayah },
      }),
    );
  }

  console.log("Membuat akun pengelola...");
  const admin = await db.user.create({
    data: {
      nama: "Administrator Situs",
      email: "admin@rw05sanggrahan.id",
      passwordHash: hash,
      peran: "ADMIN",
      jabatan: "Pengelola Sistem",
    },
  });

  const ketuaRw = await db.user.create({
    data: {
      nama: "H. Suryanto Wibowo",
      email: "ketuarw@rw05sanggrahan.id",
      passwordHash: hash,
      peran: "KETUA_RW",
      jabatan: "Ketua RW 05",
      telepon: "0812-1111-0505",
    },
  });

  const sekretaris = await db.user.create({
    data: {
      nama: "Dwi Astuti Rahmawati",
      email: "sekretaris@rw05sanggrahan.id",
      passwordHash: hash,
      peran: "SEKRETARIS",
      jabatan: "Sekretaris RW 05",
      telepon: "0813-2222-0505",
    },
  });

  const NAMA_KETUA_RT = [
    "Sugeng Riyadi", "Marno Hartono", "Bambang Sutrisno", "Agus Prasetyo",
    "Heri Kurniawan", "Widodo Saputro", "Tri Handoko", "Joko Susilo",
  ];
  const NAMA_BENDAHARA_RT = [
    "Sri Lestari", "Endang Wahyuni", "Nurul Hidayah", "Retno Palupi",
    "Siti Aminah", "Yuli Setyaningsih", "Dewi Kurniasari", "Tuti Handayani",
  ];

  const ketuaRtUser: Record<number, number> = {};
  const bendaharaRtUser: Record<number, number> = {};

  for (let i = 0; i < rtList.length; i++) {
    const rt = rtList[i];
    const k = await db.user.create({
      data: {
        nama: NAMA_KETUA_RT[i],
        email: `ketuart${rt.nomor}@rw05sanggrahan.id`,
        passwordHash: hash,
        peran: "KETUA_RT",
        jabatan: `Ketua ${rt.nama}`,
        rtId: rt.id,
        telepon: `0856-${1000 + i}-${2000 + i}`,
      },
    });
    const b = await db.user.create({
      data: {
        nama: NAMA_BENDAHARA_RT[i],
        email: `bendaharart${rt.nomor}@rw05sanggrahan.id`,
        passwordHash: hash,
        peran: "BENDAHARA_RT",
        jabatan: `Bendahara ${rt.nama}`,
        rtId: rt.id,
        telepon: `0857-${3000 + i}-${4000 + i}`,
      },
    });
    ketuaRtUser[rt.id] = k.id;
    bendaharaRtUser[rt.id] = b.id;
  }

  console.log("Membuat struktur pengurus...");
  const pengurusRw = [
    { nama: "H. Suryanto Wibowo", jabatan: "Ketua RW" },
    { nama: "Drs. Bambang Nugroho", jabatan: "Wakil Ketua RW" },
    { nama: "Dwi Astuti Rahmawati", jabatan: "Sekretaris" },
    { nama: "Hj. Murniati", jabatan: "Bendahara RW" },
    { nama: "Slamet Riyanto", jabatan: "Seksi Keamanan & Ketertiban" },
    { nama: "Purwanto", jabatan: "Seksi Kebersihan & Lingkungan" },
    { nama: "Rangga Adi Pratama", jabatan: "Seksi Pemuda & Karang Taruna" },
    { nama: "Hj. Siti Fatimah", jabatan: "Ketua TP PKK RW" },
    { nama: "dr. Indah Permatasari", jabatan: "Koordinator Posyandu" },
  ];
  for (let i = 0; i < pengurusRw.length; i++) {
    await db.pengurus.create({
      data: {
        nama: pengurusRw[i].nama,
        jabatan: pengurusRw[i].jabatan,
        level: "RW",
        urutan: i,
        periode: "2024 - 2027",
        foto: tulisGambar(`pengurus-${i + 1}`, pengurusRw[i].nama, i + 1, "kotak"),
      },
    });
  }
  for (let i = 0; i < rtList.length; i++) {
    await db.pengurus.create({
      data: {
        nama: NAMA_KETUA_RT[i],
        jabatan: `Ketua RT ${rtList[i].nomor}`,
        level: "RT",
        rtId: rtList[i].id,
        urutan: i,
        periode: "2024 - 2027",
      },
    });
  }

  console.log("Membuat data warga...");
  let nikBerjalan = 3311010101800001;
  let noKkBerjalan = 3311011201800001;
  const wargaBaru: {
    nama: string; nik: string; noKk: string; jenisKelamin: string;
    tempatLahir: string; tanggalLahir: Date; agama: string; pendidikan: string;
    pekerjaan: string; statusPerkawinan: string; hubungan: string; alamat: string; rtId: number;
  }[] = [];

  const KOTA_LAHIR = ["Sukoharjo", "Surakarta", "Klaten", "Boyolali", "Sragen", "Karanganyar", "Wonogiri", "Yogyakarta"];

  for (const rt of rtList) {
    const jumlahKk = antara(24, 34);
    for (let k = 0; k < jumlahKk; k++) {
      const noKk = String(noKkBerjalan++);
      const belakang = pilih(NAMA_BELAKANG);
      const alamat = `${rt.wilayah?.split(" ")[0] ?? "Jl. Sanggrahan"} No. ${k + 1}`;
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

      const punyaIstri = rng() > 0.12;
      if (punyaIstri) {
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
  console.log(`  ${wargaBaru.length} jiwa dibuat.`);

  console.log("Membuat berita...");
  const beritaData = [
    {
      judul: "Kerja Bakti Serentak Bersihkan Saluran Air Jelang Musim Hujan",
      kategori: "Lingkungan",
      hari: -6,
      ringkasan:
        "Lebih dari 180 warga dari delapan RT turun ke jalan membersihkan gorong-gorong dan saluran air sepanjang Jl. Sanggrahan Raya.",
      konten:
        "Minggu pagi lalu, warga RW 05 Sanggrahan menggelar kerja bakti serentak untuk membersihkan saluran air menjelang musim hujan. Kegiatan dimulai pukul 06.30 dan berlangsung hingga menjelang siang.\n\nKetua RW 05, H. Suryanto Wibowo, menyampaikan bahwa endapan lumpur di gorong-gorong sepanjang Jl. Sanggrahan Raya menjadi penyebab utama genangan pada musim hujan tahun lalu. \"Kalau salurannya lancar, air tidak lagi meluap ke halaman warga. Ini pekerjaan yang harus kita lakukan bersama, tidak bisa diserahkan ke satu dua orang saja,\" ujarnya di sela kegiatan.\n\nSetiap RT mengerahkan warganya untuk membersihkan segmen saluran di wilayah masing-masing. Ibu-ibu PKK menyiapkan konsumsi berupa teh hangat dan jajanan pasar, sementara karang taruna membantu mengangkut sampah dan sedimen ke titik kumpul.\n\nTotal delapan bak sampah besar berhasil dikumpulkan dan diangkut oleh truk kebersihan kelurahan pada sore harinya. Pengurus RW berencana menjadikan kerja bakti saluran air ini agenda rutin setiap tiga bulan.",
    },
    {
      judul: "Posyandu Balita Melati Catat Kenaikan Kehadiran hingga 92 Persen",
      kategori: "Kesehatan",
      hari: -13,
      ringkasan:
        "Program jemput bola kader posyandu berhasil menaikkan angka kehadiran penimbangan balita di RW 05 selama tiga bulan terakhir.",
      konten:
        "Posyandu Balita Melati RW 05 mencatat tingkat kehadiran 92 persen pada penimbangan bulan ini, naik signifikan dari 74 persen pada awal tahun. Kenaikan ini merupakan hasil program jemput bola yang dijalankan sembilan kader posyandu sejak bulan Mei.\n\nKoordinator Posyandu, dr. Indah Permatasari, menjelaskan bahwa kader kini aktif mengingatkan orang tua balita melalui grup percakapan RT dan mendatangi langsung keluarga yang dua bulan berturut-turut tidak hadir.\n\n\"Banyak orang tua yang bukan tidak mau datang, tapi lupa atau bentrok dengan jam kerja. Karena itu jadwal kami geser ke akhir pekan sekali dalam dua bulan,\" ujarnya.\n\nSelain penimbangan dan pengukuran tinggi badan, posyandu juga memberikan vitamin A, imunisasi lanjutan, serta penyuluhan gizi. Dari 96 balita yang terdata di RW 05, tercatat empat balita berstatus berat badan kurang dan kini mendapat pendampingan khusus berupa pemberian makanan tambahan selama 90 hari.",
    },
    {
      judul: "Laporan Kas RT Kini Dapat Diakses Warga Lewat Situs RW",
      kategori: "Umum",
      hari: -21,
      ringkasan:
        "Setiap laporan kas yang telah diverifikasi Ketua RT dan disetujui Ketua RW otomatis tampil di halaman keuangan situs ini.",
      konten:
        "Mulai periode ini, seluruh laporan kas RT di lingkungan RW 05 Sanggrahan dipublikasikan melalui situs resmi RW. Warga dapat melihat rincian pemasukan dan pengeluaran kas RT masing-masing tanpa harus menunggu rapat bulanan.\n\nAlur pelaporan disusun berjenjang. Bendahara RT menyusun laporan beserta rincian transaksi, kemudian mengajukannya untuk diverifikasi oleh Ketua RT. Setelah diverifikasi, laporan diteruskan kepada Ketua RW untuk mendapat persetujuan akhir. Hanya laporan yang telah melewati kedua tahap tersebut yang tampil di halaman publik.\n\n\"Kalau ada angka yang menurut Ketua RT belum sesuai, laporan bisa dikembalikan ke bendahara dengan catatan. Semua langkah itu tercatat, siapa yang memverifikasi dan kapan,\" jelas Sekretaris RW, Dwi Astuti Rahmawati.\n\nPengurus berharap keterbukaan ini menumbuhkan kepercayaan warga sekaligus mendorong tertib administrasi di tingkat RT.",
    },
    {
      judul: "Ronda Malam Kembali Diaktifkan dengan Jadwal Baru per Blok",
      kategori: "Keamanan",
      hari: -28,
      ringkasan:
        "Menyusul dua kejadian pencurian sepeda motor di kampung sebelah, jadwal ronda malam RW 05 dirapikan menjadi enam orang per malam.",
      konten:
        "Rapat pengurus RW bersama seluruh Ketua RT memutuskan mengaktifkan kembali ronda malam dengan jadwal yang lebih tertib. Keputusan diambil menyusul laporan dua kejadian pencurian sepeda motor di wilayah RW tetangga pada bulan lalu.\n\nSetiap malam akan bertugas enam warga yang berasal dari dua RT secara bergantian, dengan pembagian dua shift: pukul 22.00 hingga 01.00 dan pukul 01.00 hingga 04.00. Pos ronda di dekat balai RW telah diperbaiki dan dilengkapi lampu sorot serta buku catatan kejadian.\n\nSeksi Keamanan RW, Slamet Riyanto, mengimbau warga untuk tetap mengunci pagar dan menyalakan lampu teras sepanjang malam. Warga juga diminta melaporkan keberadaan orang tak dikenal melalui nomor kontak keamanan yang tertera di pos ronda.",
    },
    {
      judul: "Bank Sampah Sanggrahan Bersih Salurkan Rp 4,2 Juta ke Kas Warga",
      kategori: "Lingkungan",
      hari: -35,
      ringkasan:
        "Selama satu semester, bank sampah RW 05 mengumpulkan 3,1 ton sampah anorganik dan mengembalikan hasilnya kepada nasabah warga.",
      konten:
        "Bank Sampah Sanggrahan Bersih yang dikelola ibu-ibu PKK RW 05 melaporkan capaian semester pertama tahun ini. Sebanyak 3,1 ton sampah anorganik berhasil dikumpulkan dari 142 nasabah warga dan disalurkan ke pengepul mitra.\n\nHasil penjualan sebesar Rp 4,2 juta dikembalikan kepada nasabah sesuai setoran masing-masing, sementara 10 persen disisihkan sebagai kas operasional bank sampah untuk pembelian karung, timbangan, dan biaya angkut.\n\nJenis sampah yang paling banyak disetorkan adalah botol plastik PET, kardus, dan kaleng aluminium. Pengelola mengajak lebih banyak warga bergabung, terutama dari RT 06 dan RT 08 yang partisipasinya masih rendah. Penimbangan dilakukan setiap Sabtu pagi di halaman balai RW.",
    },
    {
      judul: "Pelatihan Digital Marketing untuk 25 Pelaku UMKM Sanggrahan",
      kategori: "Pendidikan",
      hari: -44,
      ringkasan:
        "Karang taruna menggandeng mahasiswa KKN untuk melatih pemilik warung dan usaha rumahan memasarkan produk lewat media sosial.",
      konten:
        "Sebanyak 25 pelaku usaha mikro di RW 05 mengikuti pelatihan pemasaran digital yang digelar karang taruna bekerja sama dengan mahasiswa KKN dari perguruan tinggi setempat. Pelatihan berlangsung dua hari di balai RW.\n\nMateri mencakup pemotretan produk menggunakan telepon genggam, penulisan deskripsi produk, pengelolaan akun media sosial, serta pendaftaran usaha pada layanan pesan antar daring.\n\nPeserta didominasi pemilik usaha kuliner rumahan seperti katering, kue kering, dan minuman kemasan. Panitia menyiapkan pendampingan lanjutan selama satu bulan bagi peserta yang ingin dibantu membuat katalog produk.",
    },
    {
      judul: "Perbaikan Jalan Gang Melati Selesai Lebih Cepat dari Jadwal",
      kategori: "Pembangunan",
      hari: -58,
      ringkasan:
        "Pengecoran jalan sepanjang 120 meter di Gang Melati rampung dalam sembilan hari berkat swadaya warga dan bantuan kelurahan.",
      konten:
        "Pengecoran jalan lingkungan di Gang Melati RT 01 sepanjang 120 meter telah rampung. Pekerjaan yang semula dijadwalkan dua pekan dapat diselesaikan dalam sembilan hari.\n\nPembiayaan berasal dari kombinasi bantuan stimulan kelurahan dan swadaya warga. Material disediakan melalui bantuan, sedangkan tenaga kerja sepenuhnya gotong royong warga RT 01 dan RT 02.\n\nJalan yang sebelumnya berlubang dan tergenang saat hujan kini dapat dilalui dengan nyaman. Pengurus RW mengucapkan terima kasih kepada seluruh warga yang menyumbang tenaga, konsumsi, maupun peralatan.",
    },
    {
      judul: "Santunan Anak Yatim dan Lansia Disalurkan kepada 46 Penerima",
      kategori: "Sosial",
      hari: -70,
      ringkasan:
        "Dana santunan terkumpul dari infak warga, donasi UMKM, serta sisa kas kegiatan Agustusan tahun sebelumnya.",
      konten:
        "Panitia sosial RW 05 menyalurkan santunan kepada 46 penerima yang terdiri atas 28 anak yatim dan 18 warga lanjut usia yang tinggal sendiri. Penyaluran dilakukan di balai RW dan dihadiri pengurus RT serta tokoh masyarakat.\n\nDana terkumpul dari infak warga yang dihimpun tiap RT, donasi pelaku UMKM setempat, serta sisa kas kegiatan peringatan kemerdekaan tahun sebelumnya. Rincian penerimaan dan penyaluran dana dilaporkan terbuka pada rapat RW dan diunggah ke situs ini.\n\nSelain uang tunai, penerima juga mendapat paket sembako berisi beras, minyak goreng, dan kebutuhan pokok lainnya.",
    },
  ];

  const hariIni = new Date(2026, 8, 3);
  for (let i = 0; i < beritaData.length; i++) {
    const b = beritaData[i];
    const terbit = new Date(hariIni);
    terbit.setDate(terbit.getDate() + b.hari);
    const slug = b.judul
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 70);
    await db.berita.create({
      data: {
        judul: b.judul,
        slug,
        ringkasan: b.ringkasan,
        konten: b.konten,
        kategori: b.kategori,
        status: "TERBIT",
        terbitAt: terbit,
        dilihat: antara(40, 620),
        gambar: tulisGambar(`berita-${i + 1}`, b.judul, i + 2),
        penulisId: i % 2 === 0 ? sekretaris.id : ketuaRw.id,
      },
    });
  }

  console.log("Membuat agenda kegiatan...");
  const kegiatanData = [
    {
      judul: "Rapat Koordinasi Pengurus RW dan Ketua RT",
      kategori: "Rapat",
      hari: 4,
      jam: 19,
      durasi: 2,
      lokasi: "Balai RW 05",
      penyelenggara: "Pengurus RW 05",
      deskripsi:
        "Agenda rapat meliputi evaluasi program semester, laporan kas RT periode Agustus, persiapan peringatan Hari Sumpah Pemuda, dan pembahasan usulan perbaikan penerangan jalan di RT 06 dan RT 08. Seluruh Ketua RT dan bendahara diharapkan hadir tepat waktu dengan membawa rekapitulasi kas masing-masing.",
    },
    {
      judul: "Posyandu Balita dan Lansia Bulan September",
      kategori: "Posyandu",
      hari: 7,
      jam: 8,
      durasi: 4,
      lokasi: "Balai RW 05",
      penyelenggara: "Kader Posyandu Melati",
      deskripsi:
        "Pelayanan meliputi penimbangan berat badan, pengukuran tinggi badan dan lingkar kepala balita, pemberian vitamin, serta pemeriksaan tekanan darah dan gula darah untuk warga lanjut usia. Mohon membawa buku KIA atau kartu lansia. Layanan gratis untuk seluruh warga RW 05.",
    },
    {
      judul: "Kerja Bakti Pengecatan Pos Ronda dan Balai RW",
      kategori: "Kerja Bakti",
      hari: 11,
      jam: 6,
      durasi: 4,
      lokasi: "Pos Ronda & Balai RW 05",
      penyelenggara: "Seksi Kebersihan RW",
      deskripsi:
        "Warga diminta membawa kuas dan peralatan seadanya. Cat, kuas cadangan, dan konsumsi disediakan panitia dari kas RW. Sasaran pengerjaan adalah pengecatan ulang pos ronda, pagar balai RW, serta perbaikan papan informasi warga.",
    },
    {
      judul: "Pertemuan Rutin PKK dan Arisan Ibu-Ibu",
      kategori: "Umum",
      hari: 14,
      jam: 15,
      durasi: 2,
      lokasi: "Rumah Ibu Murniati, RT 03",
      penyelenggara: "TP PKK RW 05",
      deskripsi:
        "Pertemuan bulanan PKK diisi dengan laporan kegiatan bank sampah, demo memasak menu bergizi seimbang untuk balita, serta pengundian arisan. Iuran arisan sebesar Rp 50.000 dikumpulkan sebelum acara dimulai.",
    },
    {
      judul: "Pelatihan Tanggap Bencana dan Simulasi Pemadaman Api",
      kategori: "Pelatihan",
      hari: 19,
      jam: 8,
      durasi: 3,
      lokasi: "Lapangan RT 03",
      penyelenggara: "Karang Taruna bersama Damkar Kabupaten",
      deskripsi:
        "Petugas pemadam kebakaran akan memberikan materi pencegahan kebakaran rumah tangga, cara aman menangani kebocoran gas, serta simulasi penggunaan alat pemadam api ringan. Terbuka untuk seluruh warga, kuota 60 peserta. Pendaftaran melalui Ketua RT masing-masing.",
    },
    {
      judul: "Turnamen Bulu Tangkis Antar-RT Piala Ketua RW",
      kategori: "Olahraga",
      hari: 26,
      jam: 19,
      durasi: 4,
      lokasi: "GOR Sanggrahan",
      penyelenggara: "Karang Taruna RW 05",
      deskripsi:
        "Turnamen ganda putra dan ganda campuran memperebutkan Piala Ketua RW. Setiap RT mengirim maksimal dua pasangan per kategori. Pendaftaran ditutup satu pekan sebelum pelaksanaan. Babak penyisihan digelar selama tiga malam berturut-turut.",
    },
    {
      judul: "Peringatan Maulid Nabi dan Pengajian Akbar RW",
      kategori: "Keagamaan",
      hari: 33,
      jam: 19,
      durasi: 3,
      lokasi: "Masjid Al-Ikhlas Sanggrahan",
      penyelenggara: "Takmir Masjid & Pengurus RW",
      deskripsi:
        "Peringatan Maulid Nabi Muhammad SAW diisi ceramah agama, pembacaan salawat bersama, dan santunan anak yatim. Panitia menerima sumbangan konsumsi dari warga. Seluruh warga diundang hadir bersama keluarga.",
    },
    {
      judul: "Kerja Bakti Perbaikan Saluran Air RT 06",
      kategori: "Kerja Bakti",
      hari: -6,
      jam: 6,
      durasi: 5,
      lokasi: "Gang Dahlia, RT 06",
      penyelenggara: "Pengurus RW 05",
      deskripsi: "Pembersihan sedimen saluran air dan pengangkutan sampah bersama warga delapan RT.",
      status: "SELESAI",
    },
    {
      judul: "Rapat Persiapan Peringatan HUT Kemerdekaan",
      kategori: "Rapat",
      hari: -30,
      jam: 19,
      durasi: 2,
      lokasi: "Balai RW 05",
      penyelenggara: "Panitia HUT RI",
      deskripsi: "Pembentukan panitia, penyusunan anggaran, dan pembagian tugas lomba antar-RT.",
      status: "SELESAI",
    },
  ];

  for (let i = 0; i < kegiatanData.length; i++) {
    const k = kegiatanData[i];
    const mulai = new Date(hariIni);
    mulai.setDate(mulai.getDate() + k.hari);
    mulai.setHours(k.jam, 0, 0, 0);
    const selesai = new Date(mulai);
    selesai.setHours(selesai.getHours() + k.durasi);
    const slug = `${k.judul.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60)}-${i + 1}`;

    await db.kegiatan.create({
      data: {
        judul: k.judul,
        slug,
        deskripsi: k.deskripsi,
        mulai,
        selesai,
        lokasi: k.lokasi,
        penyelenggara: k.penyelenggara,
        kategori: k.kategori,
        kontak: "Sekretariat RW 0812-3456-7890",
        status: k.status ?? "TERBIT",
        gambar: tulisGambar(`kegiatan-${i + 1}`, k.judul, i + 3),
        dibuatOlehId: sekretaris.id,
      },
    });
  }

  console.log("Membuat pengumuman...");
  const pengumumanData = [
    {
      judul: "Iuran warga bulan September dibuka mulai tanggal 1",
      isi: "Iuran warga, keamanan, dan kebersihan sebesar Rp 75.000 per KK dapat disetorkan kepada bendahara RT masing-masing paling lambat tanggal 20 September 2026.",
      penting: true,
      berakhirHari: 20,
    },
    {
      judul: "Pengambilan kartu keluarga sehat di balai RW",
      isi: "Warga yang telah mendaftar program bantuan kesehatan dapat mengambil kartu di balai RW setiap hari kerja pukul 16.00 - 18.00 dengan membawa fotokopi KTP.",
      penting: false,
      berakhirHari: 25,
    },
    {
      judul: "Pemadaman listrik terjadwal Sabtu pagi",
      isi: "PLN memberitahukan pemadaman terjadwal pada Sabtu, 12 September 2026 pukul 08.00 - 12.00 untuk pemeliharaan jaringan di wilayah Sanggrahan dan sekitarnya.",
      penting: true,
      berakhirHari: 10,
    },
    {
      judul: "Pendaftaran lomba bulu tangkis antar-RT dibuka",
      isi: "Pasangan peserta didaftarkan melalui Ketua RT masing-masing paling lambat 19 September 2026. Tidak dipungut biaya pendaftaran.",
      penting: false,
      berakhirHari: 19,
    },
  ];
  for (const p of pengumumanData) {
    const berakhir = new Date(hariIni);
    berakhir.setDate(berakhir.getDate() + p.berakhirHari);
    await db.pengumuman.create({
      data: { judul: p.judul, isi: p.isi, penting: p.penting, berakhir, aktif: true },
    });
  }

  console.log("Membuat galeri...");
  const albumData = [
    { nama: "Kerja Bakti Saluran Air", slug: "kerja-bakti-saluran-air", jumlah: 6, hari: -6, deskripsi: "Dokumentasi kerja bakti serentak delapan RT membersihkan gorong-gorong." },
    { nama: "HUT Kemerdekaan RI ke-81", slug: "hut-kemerdekaan-ri-81", jumlah: 8, hari: -18, deskripsi: "Lomba anak, panjat pinang, dan malam tirakatan warga RW 05." },
    { nama: "Posyandu dan Pemeriksaan Lansia", slug: "posyandu-lansia", jumlah: 5, hari: -34, deskripsi: "Pelayanan kesehatan bulanan di balai RW." },
  ];
  for (let i = 0; i < albumData.length; i++) {
    const a = albumData[i];
    const tanggalAlbum = new Date(hariIni);
    tanggalAlbum.setDate(tanggalAlbum.getDate() + a.hari);
    const album = await db.album.create({
      data: { nama: a.nama, slug: a.slug, deskripsi: a.deskripsi, tanggal: tanggalAlbum },
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
  const NAMA_BULAN_SEED = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  for (let idxRt = 0; idxRt < rtList.length; idxRt++) {
    const rt = rtList[idxRt];
    const rtLengkap = await db.rt.findUnique({ where: { id: rt.id } });
    const jumlahKk = rtLengkap?.jumlahKk ?? 25;
    let saldoAwal = antara(1_200_000, 3_500_000);

    for (let idxP = 0; idxP < periodeList.length; idxP++) {
      const p = periodeList[idxP];

      // Penentuan status: periode lama sudah disetujui, periode terbaru bervariasi
      let status = "DISETUJUI";
      if (idxP === 2) {
        if (idxRt === 6) status = "DIVERIFIKASI_RT";
        else if (idxRt === 7) status = "DITOLAK";
      } else if (idxP === 3) {
        if (idxRt <= 2) status = "DIAJUKAN";
        else if (idxRt <= 4) status = "DIVERIFIKASI_RT";
        else if (idxRt === 5) status = "DITOLAK";
        else status = "DRAFT";
      }

      const transaksi: {
        tanggal: Date; jenis: string; kategori: string; keterangan: string; jumlah: number;
      }[] = [];

      const tgl = (h: number) => new Date(p.tahun, p.bulan - 1, h, 9, 0, 0);
      const kkBayar = Math.round(jumlahKk * (0.82 + rng() * 0.16));

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
            "Donasi UMKM warga",
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

      const laporan = await db.laporanKeuangan.create({
        data: {
          judul: `Laporan Kas ${rt.nama} - ${NAMA_BULAN_SEED[p.bulan - 1]} ${p.tahun}`,
          bulan: p.bulan,
          tahun: p.tahun,
          rtId: rt.id,
          saldoAwal,
          status,
          catatan:
            status === "DRAFT"
              ? "Masih menunggu bukti setoran dari dua KK."
              : null,
          dibuatOlehId: bendaharaRtUser[rt.id],
          diajukanAt: status === "DRAFT" ? null : tanggalAjukan,
          verifikasiRtOlehId:
            status === "DIVERIFIKASI_RT" || status === "DISETUJUI" ? ketuaRtUser[rt.id] : null,
          verifikasiRtAt:
            status === "DIVERIFIKASI_RT" || status === "DISETUJUI" ? tanggalVerif : null,
          catatanRt:
            status === "DIVERIFIKASI_RT" || status === "DISETUJUI"
              ? "Rincian sudah sesuai buku kas dan bukti setoran."
              : status === "DITOLAK"
                ? "Nota pembelian alat kebersihan belum dilampirkan, mohon dilengkapi."
                : null,
          persetujuanRwOlehId: status === "DISETUJUI" ? ketuaRw.id : null,
          persetujuanRwAt: status === "DISETUJUI" ? tanggalSetuju : null,
          catatanRw: status === "DISETUJUI" ? "Disetujui untuk dipublikasikan kepada warga." : null,
          transaksi: { create: transaksi },
        },
      });

      // Jejak audit
      const riwayat: { aksi: string; olehId: number; catatan: string | null; createdAt: Date }[] = [
        {
          aksi: "BUAT",
          olehId: bendaharaRtUser[rt.id],
          catatan: null,
          createdAt: new Date(p.tahun, p.bulan - 1, 28, 20, 0, 0),
        },
      ];
      if (status !== "DRAFT") {
        riwayat.push({
          aksi: "AJUKAN",
          olehId: bendaharaRtUser[rt.id],
          catatan: "Laporan diajukan untuk diverifikasi Ketua RT.",
          createdAt: tanggalAjukan,
        });
      }
      if (status === "DIVERIFIKASI_RT" || status === "DISETUJUI") {
        riwayat.push({
          aksi: "VERIFIKASI_RT",
          olehId: ketuaRtUser[rt.id],
          catatan: "Rincian sudah sesuai buku kas dan bukti setoran.",
          createdAt: tanggalVerif,
        });
      }
      if (status === "DITOLAK") {
        riwayat.push({
          aksi: "TOLAK_RT",
          olehId: ketuaRtUser[rt.id],
          catatan: "Nota pembelian alat kebersihan belum dilampirkan, mohon dilengkapi.",
          createdAt: tanggalVerif,
        });
      }
      if (status === "DISETUJUI") {
        riwayat.push({
          aksi: "SETUJUI_RW",
          olehId: ketuaRw.id,
          catatan: "Disetujui untuk dipublikasikan kepada warga.",
          createdAt: tanggalSetuju,
        });
      }
      await db.riwayatPersetujuan.createMany({
        data: riwayat.map((r) => ({ ...r, laporanId: laporan.id })),
      });

      saldoAwal = saldoAwal + totalMasuk - totalKeluar;
    }
  }

  console.log("\nSeed selesai.");
  console.log("Akun demo (kata sandi sama untuk semua):", KATA_SANDI_DEMO);
  console.log("  admin@rw05sanggrahan.id         -> Administrator");
  console.log("  ketuarw@rw05sanggrahan.id       -> Ketua RW (persetujuan akhir)");
  console.log("  sekretaris@rw05sanggrahan.id    -> Sekretaris (kelola konten)");
  console.log("  ketuart01@rw05sanggrahan.id     -> Ketua RT 01 (verifikasi)");
  console.log("  bendaharart01@rw05sanggrahan.id -> Bendahara RT 01 (input kas)");
  console.log(`  ... hingga RT 08 dengan pola email yang sama. Admin: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
