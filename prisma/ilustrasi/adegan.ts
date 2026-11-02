import {
  ambulans,
  angkringan,
  awan,
  ayam,
  bendera,
  benderaTali,
  bintang,
  burungKabel,
  gang,
  gapura,
  jemuran,
  kabel,
  karung,
  kelapa,
  kucing,
  lampuJalan,
  langit,
  layangan,
  masjid,
  matahari,
  meja,
  merapi,
  motor,
  orang,
  orangDuduk,
  pendapa,
  pisang,
  pohon,
  posRonda,
  potBunga,
  rimbunJauh,
  rumah,
  rumahPelana,
  sapuLidi,
  sepeda,
  tangga,
  tenda,
  tiangListrik,
  tikar,
  warung,
  WARNA,
  type GayaOrang,
  type GayaRumah,
  type WaktuHari,
} from "./benda";
import { Lembar } from "./kertas";

const dinding = (i: number) => WARNA.dinding[i % WARNA.dinding.length];

/** Warga dengan pakaian sehari-hari yang berbeda-beda. */
function warga(l: Lembar, ubah: Partial<GayaOrang> = {}): GayaOrang {
  const baju = l.pilih([WARNA.wedel, WARNA.merah, WARNA.kunyit, WARNA.daun, WARNA.pethak, WARNA.soga]);
  const bawah = l.pilih([WARNA.wedelTua, WARNA.soga, WARNA.sogaTua, "#4A5560"]);
  const kulit = l.pilih(WARNA.kulit);
  const kepala = l.pilih(["rambut", "peci", "kerudung", "rambut", "rambutPanjang", "kerudung"] as const);
  return {
    baju,
    bawah,
    kulit,
    kepala,
    warnaKepala: kepala === "kerudung" ? l.pilih([WARNA.pethak, WARNA.kunyit, WARNA.wedel, "#C97B8B"]) : undefined,
    sarung: kepala === "kerudung" || (kepala === "peci" && l.acak() > 0.4),
    ...ubah,
  };
}

type OpsiLatar = {
  waktu?: WaktuHari;
  tanah?: number;
  gunung?: boolean;
  /** Kosongkan bagian tengah latar untuk bangunan utama adegan. */
  rongga?: readonly [number, number];
};

/** Langit, Merapi, dan deret rumah; adegan menambahkan peristiwanya di atasnya. */
function latarKampung(l: Lembar, opsi: OpsiLatar = {}): number {
  const waktu = opsi.waktu ?? "pagi";
  const malam = waktu === "malam";
  const y = opsi.tanah ?? Math.round(l.tinggi * 0.76);
  const cakrawala = y - 70;

  langit(l, waktu, cakrawala);
  if (malam) {
    bintang(l, cakrawala, 34);
    l.lonjong(l.lebar * 0.8, 96, 34, 34, "#F6E7B5", 0.015, 10);
    l.lonjong(l.lebar * 0.8 + 13, 88, 30, 30, LANGIT_MALAM, 0.015, 10);
  } else {
    matahari(l, l.lebar * l.antara(0.66, 0.86), 86, 34, waktu === "sore" ? "#F4B23C" : WARNA.kunyitMuda);
    awan(l, l.lebar * 0.2, 78, 0.95, waktu === "sore" ? "#FBE3C6" : "#FFFFFF");
    awan(l, l.lebar * l.antara(0.45, 0.6), 140, 0.62, waktu === "sore" ? "#FBE3C6" : "#FFFFFF");
  }

  if (opsi.gunung) {
    merapi(l, l.lebar * 0.56, cakrawala + 16, l.lebar * 0.9, cakrawala * 0.6, {
      terang: malam ? "#2A3F63" : waktu === "sore" ? "#D79B7E" : "#B7CDD8",
      gelap: malam ? "#223552" : waktu === "sore" ? "#C2876D" : "#9DB6C4",
      asap: malam ? "#3A5075" : "#EDF3F3",
    });
  }
  rimbunJauh(l, cakrawala + 6, malam ? "#1A3148" : waktu === "sore" ? "#B98A5C" : "#A8C8B6", 34);
  rimbunJauh(l, cakrawala + 34, malam ? "#142A3C" : waktu === "sore" ? "#8C7A4C" : "#7FAE95", 38);

  // Deret rumah dengan ukuran acak; sebagian berpelana supaya tidak seragam.
  const [awalRongga, akhirRongga] = opsi.rongga ?? [-1, -1];
  let x = l.antara(-70, -20);
  let i = Math.floor(l.antara(0, 6));
  while (x < l.lebar) {
    const w = l.antara(180, 270);
    if (x + w > awalRongga && x < akhirRongga) {
      x = akhirRongga + 8;
      continue;
    }
    const gaya: GayaRumah = {
      dinding: dinding(i++),
      atap: l.acak() > 0.74 ? "seng" : "genteng",
      nyala: malam,
    };
    if (l.acak() > 0.6) rumahPelana(l, x, y, w * 0.78, l.antara(110, 150), gaya);
    else rumah(l, x, y, w, l.antara(120, 164), gaya);
    x += w + l.antara(6, 26);
  }

  if (malam) l.kotak(-20, -20, l.lebar + 40, l.tinggi + 40, "#0E183055", 0);
  gang(l, y, malam ? ["#39465A", "#2C3849"] : undefined);
  return y;
}

const LANGIT_MALAM = "#162542";

function deretRumah(
  l: Lembar,
  y: number,
  daftar: readonly (readonly [x: number, w: number, h: number, warna: number, atap?: GayaRumah["atap"]])[],
): void {
  for (const [x, w, h, warna, atap] of daftar) {
    rumah(l, x, y, w, h, { dinding: dinding(warna), atap });
  }
}

/** Panorama pembuka beranda: pagi di kampung, Merapi di kejauhan. */
export function panoramaKampung(): string {
  const l = new Lembar(1600, 440, 11);
  const jalan = 376;

  langit(l, "pagi", 280);
  matahari(l, 1236, 74, 34);
  awan(l, 250, 64, 1);
  awan(l, 700, 118, 0.7);
  awan(l, 1440, 58, 0.85);

  merapi(l, 1000, 300, 980, 214, { terang: "#B7CDD8", gelap: "#9DB6C4", asap: "#EDF3F3" });
  rimbunJauh(l, 300, "#A8C8B6", 26);
  rimbunJauh(l, 322, "#7FAE95", 30);

  kelapa(l, 120, 354, 0.82, 1);
  kelapa(l, 610, 349, 0.72, -1);
  kelapa(l, 1500, 354, 0.9, -1);
  masjid(l, 410, 346, 0.82);

  deretRumah(l, 346, [
    [-10, 110, 46, 3],
    [640, 130, 52, 5, "seng"],
    [800, 104, 44, 0],
    [930, 120, 50, 2],
    [1300, 130, 48, 1, "seng"],
    [1455, 150, 52, 3],
  ]);

  pohon(l, 318, jalan, 0.72);
  pohon(l, 1056, jalan, 0.62, ["#2C5B3C", "#3F7D52", "#86B27A"]);

  deretRumah(l, jalan, [
    [36, 150, 74, 0],
    [356, 164, 80, 1],
    [660, 168, 84, 2],
  ]);
  rumahPelana(l, 196, jalan, 112, 62, { dinding: dinding(4) });
  warung(l, 534, jalan, 112, 74);
  rumahPelana(l, 842, jalan, 118, 70, { dinding: dinding(3), atap: "seng" });
  rumah(l, 972, jalan, 146, 76, { dinding: dinding(4) });
  rumah(l, 1316, jalan, 150, 72, { dinding: dinding(0) });
  rumahPelana(l, 1474, jalan, 126, 78, { dinding: dinding(2) });

  gapura(l, 1130, jalan + 2, 176, 124);

  const t1 = tiangListrik(l, 262, jalan + 4, 186);
  const t2 = tiangListrik(l, 842, jalan + 4, 186);
  const t3 = tiangListrik(l, 1340, jalan + 4, 186);
  for (const i of [0, 2]) {
    kabel(l, [-30, t1[i][1] - 12], t1[i], 12);
    kabel(l, t1[i], t2[i], 32 + i * 3);
    kabel(l, t2[i], t3[i], 28 + i * 3);
    kabel(l, t3[i], [1640, t3[i][1] - 8], 10);
  }
  burungKabel(l, 516, 236);
  burungKabel(l, 540, 238);
  burungKabel(l, 1092, 235);

  jemuran(l, [842 - 190, 292], [800, 296]);
  gang(l, jalan);

  for (const [x, s, warna] of [
    [52, 0.92, WARNA.merah],
    [82, 0.8, WARNA.kunyit],
    [508, 0.88, WARNA.pethak],
    [955, 0.82, WARNA.kunyit],
    [1294, 0.9, WARNA.merah],
    [1458, 0.85, WARNA.pethak],
  ] as const) {
    potBunga(l, x, jalan + 4, s, warna);
  }
  pisang(l, 1566, jalan + 4, 0.8);

  posRonda(l, 700, jalan + 20, 0.74);
  angkringan(l, 384, jalan + 22, 0.6);

  orang(l, 196, jalan + 44, 62, {
    baju: WARNA.wedel,
    bawah: WARNA.soga,
    sarung: true,
    kepala: "peci",
    condong: 0.06,
    lengan: [
      [0.26, 0.22],
      [0.2, 0.3],
    ],
  });
  sapuLidi(l, [212, jalan + 10], [228, jalan + 32]);

  sepeda(l, 958, jalan + 48, 0.78, WARNA.merah);
  orang(l, 984, jalan + 24, 54, {
    baju: WARNA.kunyit,
    bawah: WARNA.wedel,
    kulit: WARNA.kulit[1],
    kepala: "kerudung",
    warnaKepala: WARNA.pethak,
    kaki: [
      [0.14, 0.34],
      [-0.02, 0.36],
    ],
    lengan: [
      [0.26, 0.14],
      [0.2, 0.18],
    ],
    condong: 0.06,
  });

  orang(l, 1254, jalan + 46, 46, {
    baju: WARNA.merah,
    bawah: WARNA.pethak,
    kulit: WARNA.kulit[2],
    lengan: [
      [0.2, -0.36],
      [-0.16, 0.26],
    ],
    condong: -0.02,
  });
  l.lengkung([1264, jalan + 4], [1320, 224], [1398, 152], "#3A4650", 1);
  l.kelompok("translate(1398 128)", () => layangan(l, 0, 0, 0.9), 'class="layangan"');

  ayam(l, 512, jalan + 36, 0.82);
  ayam(l, 546, jalan + 46, 0.66, WARNA.pethak);
  kucing(l, 1050, jalan + 32, 0.74);

  l.mentah(
    `<style>.layangan{animation:ayun 7s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 100%}` +
      `@keyframes ayun{from{rotate:-7deg}to{rotate:8deg}}` +
      `@media (prefers-reduced-motion:reduce){.layangan{animation:none}}</style>`,
  );

  return l.svg("Pagi di Kampung Sanggrahan: deretan rumah, gapura, pos ronda, dan warga di gang dengan Merapi di kejauhan");
}

/** Sampul laman tiap RW; suasananya berbeda supaya ketiganya mudah dibedakan. */
export function panoramaRw(nomor: number): string {
  const l = new Lembar(1600, 440, 20 + nomor);
  const jalan = 376;
  const waktu = (["pagi", "siang", "sore"] as const)[(nomor - 1) % 3];

  langit(l, waktu, 280);
  matahari(l, 300 + nomor * 240, 76, 32, waktu === "sore" ? "#F4B23C" : WARNA.kunyitMuda);
  const warnaAwan = waktu === "sore" ? "#FBE3C6" : "#FFFFFF";
  awan(l, 180 + nomor * 90, 70, 0.9, warnaAwan);
  awan(l, 1120 - nomor * 60, 96, 0.7, warnaAwan);
  merapi(l, 420 + nomor * 240, 300, 860, 190, {
    terang: waktu === "sore" ? "#D79B7E" : "#B7CDD8",
    gelap: waktu === "sore" ? "#C2876D" : "#9DB6C4",
    asap: "#EDF3F3",
  });
  rimbunJauh(l, 300, waktu === "sore" ? "#B98A5C" : "#A8C8B6", 26);
  rimbunJauh(l, 324, waktu === "sore" ? "#8C7A4C" : "#7FAE95", 30);

  kelapa(l, 90 + nomor * 60, 354, 0.8, 1);
  kelapa(l, 1400 - nomor * 40, 354, 0.86, -1);

  let x = -30;
  let i = nomor;
  while (x < 1640) {
    const w = l.antara(120, 180);
    const gaya: GayaRumah = { dinding: dinding(i++), atap: l.acak() > 0.72 ? "seng" : "genteng" };
    if (l.acak() > 0.6) rumahPelana(l, x, jalan, w * 0.76, l.antara(66, 84), gaya);
    else rumah(l, x, jalan, w, l.antara(66, 88), gaya);
    x += w + l.antara(6, 28);
  }
  gang(l, jalan);

  if (nomor === 1) {
    // RW 01: padat, banyak usaha rumahan.
    warung(l, 620, jalan + 2, 122, 78);
    angkringan(l, 800, jalan + 24, 0.62);
    posRonda(l, 240, jalan + 22, 0.74);
    sepeda(l, 1120, jalan + 46, 0.74);
    orang(l, 1170, jalan + 44, 58, warga(l, { condong: 0.02 }));
  } else if (nomor === 2) {
    // RW 02: lampu gang yang baru diganti, dan gang yang dijaga tetap lapang.
    lampuJalan(l, 300, jalan + 8, 136, false);
    lampuJalan(l, 760, jalan + 8, 136, false);
    lampuJalan(l, 1240, jalan + 8, 136, false);
    motor(l, 520, jalan + 40, 0.66, WARNA.wedel);
    motor(l, 590, jalan + 44, 0.66, WARNA.merah);
    orang(l, 960, jalan + 44, 58, warga(l));
    orang(l, 1000, jalan + 46, 44, warga(l, { sarung: false, kepala: "rambut" }));
  } else {
    // RW 03: taman kampung dan pepohonan.
    pohon(l, 300, jalan + 4, 0.74);
    pohon(l, 1180, jalan + 4, 0.86);
    pisang(l, 640, jalan + 6, 0.9);
    pisang(l, 700, jalan + 6, 0.72);
    for (let k = 0; k < 9; k++) {
      potBunga(l, 820 + k * 34, jalan + 6, 0.86, l.pilih([WARNA.merah, WARNA.kunyit, WARNA.pethak]));
    }
    orang(l, 460, jalan + 44, 58, warga(l, { condong: 0.18 }));
    ayam(l, 560, jalan + 40, 0.84);
  }

  return l.svg(`Suasana gang di RW 0${nomor} Kampung Sanggrahan`);
}

// ---------------------------------------------------------------------------
// Adegan peristiwa, dipilih dari judul berita, kegiatan, atau album.
// ---------------------------------------------------------------------------

const L = 1200;
const T = 675;

function kerjaBakti(l: Lembar): void {
  const y = latarKampung(l, { waktu: "pagi", gunung: l.acak() > 0.5 });
  // Selokan yang sedang dibersihkan.
  l.kotak(-20, y + 8, L + 40, 26, WARNA.wedelTua, 0.8);
  l.kotak(-20, y + 8, L + 40, 7, WARNA.sogaTua, 0.5);
  l.lonjong(420, y + 118, 74, 18, WARNA.daunTua, 0.14, 8);
  l.lonjong(452, y + 104, 46, 14, WARNA.daun, 0.14, 7);

  orang(l, 240, y + 130, 134, warga(l, {
    kepala: "caping",
    sarung: false,
    condong: 0.1,
    lengan: [[0.3, 0.2], [0.22, 0.28]],
  }));
  sapuLidi(l, [282, y + 44], [316, y + 112]);

  orang(l, 620, y + 118, 128, warga(l, {
    kepala: "peci",
    sarung: false,
    condong: 0.2,
    lengan: [[0.3, 0.3], [0.24, 0.34]],
    kaki: [[0.16, 0.44], [-0.12, 0.45]],
  }));
  l.garis([[664, y + 34], [700, y + 96]], WARNA.soga, 5);
  l.potong([[688, y + 92], [722, y + 92], [720, y + 112], [692, y + 110]], "#7E8D95", 0.4);

  orang(l, 880, y + 138, 132, warga(l, {
    kepala: "kerudung",
    sarung: false,
    lengan: [[0.22, 0.22], [0.26, 0.2]],
  }));
  // Gerobak sampah beroda satu.
  l.potong([[930, y + 76], [1076, y + 76], [1056, y + 124], [950, y + 124]], "#7E8D95", 0.6);
  l.lonjong(1004, y + 76, 66, 18, WARNA.daun, 0.14, 8);
  l.lonjong(1030, y + 68, 36, 13, WARNA.daunMuda, 0.14, 7);
  l.bulatan(1004, y + 134, 15, "#2A3540");
  l.bulatan(1004, y + 134, 6, WARNA.semenTua);
  kucing(l, 80, y + 92, 1.1);
}

function posyandu(l: Lembar): void {
  const y = latarKampung(l, { waktu: "pagi", rongga: [300, 880] });
  pendapa(l, 340, y + 8, 500, 264);
  meja(l, 420, y + 8, 150, 62, WARNA.pethak);
  // Timbangan gantung bayi.
  l.garis([[640, y - 118], [640, y - 56]], WARNA.semenTua, 3);
  l.lonjong(640, y - 74, 26, 26, WARNA.pethak, 0.02, 10);
  l.garis([[640, y - 74], [652, y - 86]], WARNA.merah, 2.4);
  l.potong([[612, y - 40], [668, y - 40], [652, y - 16], [628, y - 16]], WARNA.kunyit, 0.4);
  l.garis([[640, y - 56], [616, y - 40]], WARNA.semenTua, 1.6);
  l.garis([[640, y - 56], [664, y - 40]], WARNA.semenTua, 1.6);
  l.bulatan(640, y - 36, 10, WARNA.kulit[1]);

  orang(l, 560, y + 6, 128, warga(l, {
    kepala: "kerudung",
    warnaKepala: WARNA.pethak,
    baju: WARNA.pethak,
    bawah: WARNA.wedel,
    lengan: [[0.3, 0.1], [0.26, 0.12]],
  }));

  for (const [x, ukur] of [[170, 136], [970, 130], [1060, 134]] as const) {
    orang(l, x, y + 74, ukur, warga(l, {
      kepala: "kerudung",
      lengan: [[0.16, 0.16], [0.14, 0.2]],
    }));
    l.lonjong(x + 20, y + 74 - ukur * 0.56, 19, 15, WARNA.kunyitMuda, 0.06, 7);
    l.bulatan(x + 34, y + 74 - ukur * 0.6, 8, WARNA.kulit[1]);
  }
  orang(l, 252, y + 78, 82, warga(l, { kepala: "rambut", sarung: false, bawah: WARNA.wedel }));
}

function kas(l: Lembar): void {
  l.kotak(-20, -20, L + 40, T + 40, "#7A4A24", 0);
  for (let i = 0; i < 5; i++) {
    l.garis([[-20, i * 150 + l.antara(20, 60)], [L + 20, i * 150 + l.antara(20, 60)]], "#6C4120", 3);
  }
  // Buku kas terbuka.
  l.potong([[210, 120], [600, 96], [600, 570], [230, 596]], WARNA.pethak, 1.6);
  l.potong([[600, 96], [992, 124], [972, 596], [600, 570]], "#F4EEDD", 1.6);
  l.potong([[590, 96], [610, 96], [610, 570], [590, 570]], "#DED7C5", 0);
  const baris: [number, number][][] = [];
  for (let i = 0; i < 11; i++) {
    const y = 166 + i * 37;
    baris.push([[252, y + 4 - i * 0.6], [570, y - 14 - i * 0.6]]);
    baris.push([[632, y - 12], [950, y + 6]]);
  }
  l.garisBanyak(baris, WARNA.semenTua, 1.8);
  for (let i = 0; i < 8; i++) {
    const y = 158 + i * 37;
    const panjang = l.antara(70, 170);
    l.garis([[268, y - i * 0.6], [268 + panjang, y - 7 - i * 0.6]], WARNA.wedel, 5);
    l.garis([[470, y - 8 - i * 0.6], [554, y - 13 - i * 0.6]], i % 3 ? WARNA.wedel : WARNA.merah, 5);
    if (i < 6) {
      l.garis([[648, y - 11], [648 + panjang, y - 4]], WARNA.wedel, 5);
      l.garis([[850, y - 5], [934, y]], WARNA.wedel, 5);
    }
  }
  // Stempel dan pulpen.
  l.lonjong(830, 500, 62, 62, WARNA.wedel + "33", 0.02, 12);
  l.lonjong(830, 500, 44, 44, "#F4EEDD", 0.02, 12);
  l.lonjong(830, 500, 36, 36, WARNA.wedel + "33", 0.02, 12);
  l.garis([[1012, 170], [1120, 470]], WARNA.wedelTua, 12);
  l.garis([[1012, 170], [1034, 232]], WARNA.kunyit, 12);
  // Segelas teh hangat.
  l.lonjong(106, 150, 62, 62, "#C9C6BC", 0.02, 12);
  l.lonjong(106, 150, 48, 48, "#8E3F20", 0.02, 12);
  // Tumpukan uang logam.
  for (const [x, y] of [[130, 500], [86, 548], [150, 572]]) {
    l.lonjong(x, y, 30, 30, WARNA.kunyit, 0.02, 10);
    l.lonjong(x, y, 21, 21, WARNA.kunyitMuda, 0.02, 10);
  }
}

function ronda(l: Lembar): void {
  const y = latarKampung(l, { waktu: "malam", rongga: [150, 640] });
  lampuJalan(l, 900, y + 12, 230);
  posRonda(l, 240, y + 30, 2.2, true);
  orangDuduk(l, 330, y - 34, 104, warga(l, { kepala: "peci", sarung: true, baju: WARNA.pethak }));
  orangDuduk(l, 420, y - 34, 104, warga(l, { kepala: "rambut", sarung: true, baju: WARNA.kunyit }));
  orang(l, 720, y + 96, 142, warga(l, {
    kepala: "peci",
    sarung: true,
    baju: WARNA.wedel,
    lengan: [[0.3, 0.04], [-0.1, 0.3]],
  }));
  l.bulatan(768, y - 6, 8, WARNA.kunyitMuda);
  kucing(l, 1000, y + 76, 1.2, "#0E1830");
}

function lampu(l: Lembar): void {
  const senja = l.acak() > 0.5;
  const y = latarKampung(l, { waktu: senja ? "sore" : "malam" });
  lampuJalan(l, 180, y + 14, 250);
  lampuJalan(l, 900, y + 14, 250, !senja);
  lampuJalan(l, 540, y + 14, 330, false);
  tangga(l, [640, y + 22], [558, y - 300]);
  orang(l, 600, y - 124, 120, warga(l, {
    kepala: "caping",
    sarung: false,
    baju: WARNA.kunyit,
    bawah: WARNA.wedelTua,
    condong: -0.1,
    lengan: [[-0.12, -0.34], [-0.2, 0.08]],
    kaki: [[0.08, 0.34], [-0.1, 0.42]],
  }));
  orang(l, 760, y + 112, 134, warga(l, {
    kepala: "peci",
    sarung: false,
    lengan: [[-0.3, -0.28], [0.12, 0.28]],
  }));
  orang(l, 330, y + 122, 130, warga(l));
}

function parkir(l: Lembar): void {
  const y = latarKampung(l, { waktu: "siang" });
  for (let i = 0; i < 4; i++) {
    motor(l, 60 + i * 138, y + 42, 1.28, [WARNA.merah, WARNA.wedel, WARNA.pethak, WARNA.kunyit][i]);
  }
  ambulans(l, 660, y + 118, 1.8);
  orang(l, 590, y + 126, 136, warga(l, {
    kepala: "peci",
    sarung: false,
    lengan: [[0.32, -0.14], [-0.12, 0.3]],
  }));
}

function bankSampah(l: Lembar): void {
  const y = latarKampung(l, { waktu: "pagi", rongga: [430, 1000] });
  tenda(l, 470, y + 40, 500, 210, WARNA.daun);
  // Timbangan duduk.
  l.kotak(590, y - 74, 126, 16, "#7E8D95", 0.4);
  l.kotak(644, y - 158, 16, 90, "#7E8D95", 0.3);
  l.lonjong(652, y - 170, 38, 38, WARNA.pethak, 0.02, 10);
  l.lonjong(652, y - 170, 30, 30, "#F4EEDD", 0.02, 10);
  l.garis([[652, y - 170], [670, y - 188]], WARNA.merah, 3);
  l.kotak(576, y - 58, 154, 62, "#5C6B74", 0.4);
  karung(l, 652, y - 72, 0.9, WARNA.kunyitMuda);

  for (const [x, s, w] of [[880, 1.5, WARNA.pethak], [830, 1.26, WARNA.kunyitMuda], [936, 1.2, "#CBDCE6"]] as const) {
    karung(l, x, y + 34, s, w);
  }
  orang(l, 500, y + 42, 128, warga(l, { kepala: "peci", sarung: false, lengan: [[0.34, 0.06], [0.3, 0.1]] }));
  orang(l, 262, y + 116, 134, warga(l, { kepala: "kerudung", lengan: [[0.26, 0.2], [0.24, 0.2]] }));
  karung(l, 340, y + 116, 1.1, "#CBDCE6");
}

function pelatihan(l: Lembar): void {
  l.kotak(-20, -20, L + 40, T + 40, "#EFE7D4", 0);
  l.kotak(-20, 480, L + 40, 240, "#C9A87A", 0);
  l.kotak(-20, 470, L + 40, 12, "#A98A5E", 0.4);
  // Layar proyektor berisi grafik sederhana.
  l.kotak(330, 50, 540, 320, WARNA.pethak, 1);
  l.kotak(320, 40, 560, 16, WARNA.semenTua, 0.4);
  for (const [i, t] of [80, 134, 110, 184, 216].entries()) {
    l.kotak(400 + i * 78, 330 - t, 50, t, i === 4 ? WARNA.merah : WARNA.wedel, 0.5);
  }
  l.garis([[380, 332], [820, 332]], WARNA.wedelTua, 3);
  // Pemateri.
  orang(l, 180, 490, 208, warga(l, {
    kepala: "kerudung",
    sarung: false,
    baju: WARNA.wedel,
    bawah: WARNA.wedelTua,
    lengan: [[0.34, -0.1], [-0.1, 0.3]],
  }));
  // Peserta duduk membelakangi kita, masing-masing dengan laptop.
  for (const [i, x] of [240, 480, 720, 960].entries()) {
    meja(l, x - 110, 672, 230, 120);
    l.kotak(x - 40, 516, 86, 54, "#5C6B74", 0.4);
    l.kotak(x - 34, 521, 74, 44, i % 2 ? WARNA.kunyitMuda : "#CBDCE6", 0.3);
    orang(l, x + 4, 720, 250, warga(l, { kepala: i % 2 ? "kerudung" : "rambut", sarung: true }));
  }
}

function taman(l: Lembar): void {
  const y = latarKampung(l, { waktu: "pagi", gunung: true });
  pohon(l, 110, y + 20, 1.2);
  l.kotak(-20, y + 8, L + 40, 180, WARNA.daunMuda, 1);
  l.kotak(-20, y + 8, L + 40, 7, WARNA.daun, 0.6);
  for (const [x, w] of [[190, 360], [640, 420]] as const) {
    l.potong([[x, y + 60], [x + w, y + 60], [x + w + 26, y + 150], [x - 26, y + 150]], "#7A5A3C", 1);
    for (let i = 0; i < 6; i++) {
      const xb = x + 26 + (i * w) / 6;
      const baris = i % 2;
      l.garis([[xb, y + 96 + baris * 12], [xb, y + 74 + baris * 12]], WARNA.daunTua, 3.5);
      l.lonjong(xb - 8, y + 74 + baris * 12, 10, 6, WARNA.daun, 0.1, 6);
      l.lonjong(xb + 8, y + 72 + baris * 12, 10, 6, WARNA.daunMuda, 0.1, 6);
      if (i % 3 === 0) l.bulatan(xb, y + 66 + baris * 12, 6, l.pilih([WARNA.merah, WARNA.kunyit, WARNA.pethak]));
    }
  }
  orang(l, 420, y + 92, 118, warga(l, {
    kepala: "caping",
    sarung: false,
    condong: 0.26,
    lengan: [[0.3, 0.36], [0.22, 0.36]],
    kaki: [[0.18, 0.4], [-0.14, 0.44]],
  }));
  orang(l, 870, y + 84, 128, warga(l, {
    kepala: "kerudung",
    sarung: false,
    lengan: [[0.3, 0.1], [-0.08, 0.3]],
  }));
  // Gembor penyiram tanaman.
  l.potong([[918, y + 18], [962, y + 18], [958, y + 54], [922, y + 54]], WARNA.wedel, 0.4);
  l.garis([[960, y + 40], [992, y + 16]], WARNA.wedel, 5);
  orang(l, 584, y + 164, 92, warga(l, { kepala: "rambut", sarung: false, bawah: WARNA.wedel, baju: WARNA.merah, lengan: [[0.26, 0.1], [-0.14, 0.26]] }));
}

function maulid(l: Lembar): void {
  const y = latarKampung(l, { waktu: "sore", rongga: [320, 900] });
  masjid(l, 370, y + 6, 2.3);
  benderaTali(l, [20, 196], [370, 300], 10);
  benderaTali(l, [860, 300], [1200, 206], 10);
  for (const [x, ukur] of [[160, 128], [240, 134], [980, 130], [1060, 136], [1130, 112]] as const) {
    orang(l, x, y + 92 + (x % 3) * 12, ukur, warga(l, { kepala: x % 2 ? "kerudung" : "peci", sarung: true, baju: WARNA.pethak }));
  }
  tikar(l, 430, y + 76, 340, 44);
  for (let i = 0; i < 4; i++) {
    orangDuduk(l, 480 + i * 80, y + 50, 96, warga(l, { kepala: "peci", sarung: true, baju: WARNA.pethak }));
  }
}

function buluTangkis(l: Lembar): void {
  const senja = l.acak() > 0.5;
  const y = latarKampung(l, { waktu: senja ? "sore" : "malam" });
  // Lapangan digaris dengan cat di jalan gang.
  l.garis([[180, y + 128], [1020, y + 128], [940, y + 40], [260, y + 40], [180, y + 128]], WARNA.pethak, 4);
  l.garis([[600, y + 40], [600, y + 128]], WARNA.pethak, 4);
  lampuJalan(l, 90, y + 30, 300);
  lampuJalan(l, 1040, y + 30, 300);
  l.kotak(404, y - 90, 7, 196, "#3A4650", 0.2);
  l.kotak(788, y - 90, 7, 196, "#3A4650", 0.2);
  l.kotak(404, y - 84, 391, 9, WARNA.pethak, 0.2);
  l.kotak(411, y - 75, 377, 64, "#FFFFFF44", 0);
  const mata: [number, number][][] = [];
  for (let x = 424; x < 788; x += 18) mata.push([[x, y - 75], [x, y - 11]]);
  for (let yy = y - 62; yy < y - 12; yy += 16) mata.push([[411, yy], [788, yy]]);
  l.garisBanyak(mata, "#FFFFFF88", 1.2);

  orang(l, 280, y + 112, 158, warga(l, {
    kepala: "rambut",
    sarung: false,
    baju: WARNA.merah,
    bawah: WARNA.pethak,
    condong: 0.1,
    lengan: [[0.22, -0.36], [-0.24, 0.02]],
    kaki: [[0.2, 0.42], [-0.16, 0.44]],
  }));
  l.garis([[338, y - 48], [366, y - 92]], "#2A3540", 3.5);
  l.lonjong(374, y - 110, 15, 20, WARNA.pethak, 0.02, 8);

  orang(l, 930, y + 96, 150, warga(l, {
    kepala: "rambut",
    sarung: false,
    baju: WARNA.wedel,
    bawah: WARNA.pethak,
    condong: -0.08,
    lengan: [[-0.26, 0.04], [0.2, 0.1]],
    kaki: [[-0.16, 0.44], [0.2, 0.42]],
  }));
  // Kok melayang.
  l.potong([[640, y - 196], [658, y - 208], [660, y - 190]], WARNA.pethak, 0);
  l.bulatan(638, y - 194, 5, WARNA.kunyit);
}

function rapat(l: Lembar, ibuIbu = false): void {
  const y = latarKampung(l, { waktu: ibuIbu ? "sore" : "malam", rongga: [190, 1020] });
  pendapa(l, 230, y + 16, 760, 320);
  tikar(l, 270, y + 8, 680, 70);
  for (let i = 0; i < 7; i++) {
    const x = 330 + i * 96;
    orangDuduk(l, x, y - 18 - (i % 2) * 10, 116, warga(l, {
      kepala: ibuIbu ? "kerudung" : i % 2 ? "peci" : "rambut",
      sarung: true,
      lengan: i === 3 ? [[0.28, -0.08], [0.05, 0.27]] : undefined,
    }));
  }
  // Teko dan gelas di tikar.
  l.lonjong(600, y + 40, 24, 19, WARNA.pethak, 0.02, 8);
  l.garis([[624, y + 34], [642, y + 22]], WARNA.pethak, 5);
  l.kotak(668, y + 28, 15, 18, WARNA.gentengTua, 0.2);
  l.kotak(698, y + 30, 15, 18, WARNA.gentengTua, 0.2);
  if (ibuIbu) {
    l.kotak(520, y + 24, 46, 24, WARNA.pethak, 0.3);
    l.garis([[520, y + 36], [566, y + 36]], WARNA.merah, 2);
  }
}

function pengecatan(l: Lembar): void {
  const y = latarKampung(l, { waktu: "pagi", rongga: [230, 760] });
  posRonda(l, 300, y + 40, 2.6);
  orang(l, 760, y + 104, 140, warga(l, {
    kepala: "caping",
    sarung: false,
    lengan: [[-0.28, -0.08], [0.12, 0.28]],
  }));
  l.garis([[696, y + 8], [640, y - 32]], WARNA.soga, 5);
  l.kotak(620, y - 56, 12, 56, WARNA.wedel, 0.3);
  // Kaleng cat dan lembar koran alas.
  l.potong([[120, y + 96], [270, y + 88], [290, y + 138], [108, y + 142]], WARNA.pethak, 0.8);
  for (const [x, w] of [[160, WARNA.wedel], [216, WARNA.kunyit]] as const) {
    l.kotak(x, y + 66, 42, 54, "#7E8D95", 0.3);
    l.lonjong(x + 21, y + 66, 21, 7, w, 0.02, 8);
  }
}

function tanggapBencana(l: Lembar): void {
  const y = latarKampung(l, { waktu: "siang", rongga: [480, 900] });
  // Drum berisi api latihan.
  l.potong([[620, y + 8], [706, y + 8], [700, y + 104], [626, y + 104]], "#5C6B74", 0.6);
  l.gumpal([[626, y + 10], [642, y - 74], [664, y - 40], [682, y - 118], [712, y - 32], [702, y + 10]], WARNA.merah);
  l.gumpal([[640, y + 10], [656, y - 38], [670, y - 20], [684, y - 60], [694, y + 10]], WARNA.kunyit);
  orang(l, 370, y + 124, 142, warga(l, {
    kepala: "rambut",
    sarung: false,
    baju: WARNA.merah,
    bawah: WARNA.wedelTua,
    lengan: [[0.3, 0.1], [0.28, 0.16]],
    condong: 0.06,
  }));
  // Tabung APAR dan semprotannya.
  l.potong([[436, y + 8], [468, y + 8], [468, y + 76], [436, y + 76]], WARNA.merah, 0.3);
  l.garis([[452, y + 8], [484, y - 6], [538, y - 14]], "#2A3540", 4);
  l.potong([[538, y - 14], [640, y - 54], [646, y + 16]], "#FFFFFF99", 0);
  for (const [x, u] of [[860, 134], [950, 124], [1040, 138]] as const) {
    orang(l, x, y + 110 + (u % 3) * 8, u, warga(l));
  }
}

function agustusan(l: Lembar): void {
  const y = latarKampung(l, { waktu: "siang", rongga: [430, 760] });
  gapura(l, 450, y + 14, 300, 250, WARNA.merah);
  benderaTali(l, [-10, 230], [450, 200], 12);
  benderaTali(l, [750, 200], [1210, 230], 12);
  for (const x of [60, 176, 930, 1056]) bendera(l, x, y + 16, 210);
  // Lomba balap karung.
  const lomba = l.acak() > 0.5;
  if (lomba) {
    for (const [x, c] of [[250, WARNA.pethak], [420, WARNA.kunyitMuda], [860, WARNA.pethak]] as const) {
      orang(l, x, y + 126, 118, warga(l, {
        kepala: "rambut",
        baju: x > 500 ? WARNA.merah : WARNA.pethak,
        sarung: false,
        kaki: [[0.05, 0.46], [-0.05, 0.46]],
        lengan: [[0.16, 0.22], [-0.16, 0.22]],
      }));
      l.potong([[x - 30, y + 126 - 56], [x + 30, y + 126 - 56], [x + 26, y + 126], [x - 26, y + 126]], c, 0.6);
    }
  } else {
    // Panjat pinang: batang tinggi dengan hadiah di puncaknya.
    l.kotak(600, y - 320, 18, 410, WARNA.sogaTua, 0.4);
    l.lonjong(609, y - 330, 76, 16, WARNA.kunyit, 0.03, 10);
    for (let i = 0; i < 7; i++) l.kotak(544 + i * 20, y - 322, 7, 34, [WARNA.merah, WARNA.pethak, WARNA.wedel][i % 3], 0.1);
    orang(l, 590, y + 12, 108, warga(l, {
      kepala: "rambut",
      sarung: false,
      baju: WARNA.merah,
      lengan: [[0.16, -0.26], [0.2, -0.16]],
      kaki: [[0.16, 0.24], [-0.16, 0.3]],
    }));
    orang(l, 576, y + 94, 112, warga(l, {
      kepala: "rambut",
      sarung: false,
      baju: WARNA.pethak,
      lengan: [[0.2, -0.26], [0.22, -0.18]],
      kaki: [[0.06, 0.46], [-0.08, 0.46]],
    }));
  }
  for (const x of [120, 1000, 1110]) {
    orang(l, x, y + 104, 128, warga(l, { lengan: [[0.24, -0.3], [-0.2, 0.2]] }));
  }
}

function papanWarga(l: Lembar): void {
  const y = latarKampung(l, { waktu: "pagi", rongga: [330, 880], gunung: true });
  // Papan pengumuman beratap kecil.
  l.kotak(388, y - 320, 14, 340, WARNA.sogaTua, 0.4);
  l.kotak(806, y - 320, 14, 340, WARNA.sogaTua, 0.4);
  l.potong([[340, y - 322], [604, y - 392], [868, y - 322]], WARNA.genteng, 1);
  l.potong([[340, y - 322], [604, y - 392], [520, y - 322]], WARNA.gentengTua, 0.8);
  l.kotak(376, y - 322, 456, 262, WARNA.wedel, 0.8);
  l.kotak(392, y - 306, 424, 230, WARNA.soga, 0.6);
  const warnaKertas = [WARNA.pethak, WARNA.kunyitMuda, "#CBDCE6", "#F1D0C0", WARNA.pethak, "#CFE2C6"];
  for (let i = 0; i < 6; i++) {
    const x = 408 + (i % 3) * 136 + l.antara(-6, 6);
    const yy = y - 294 + Math.floor(i / 3) * 108 + l.antara(-6, 6);
    const tinggi = l.antara(84, 96);
    l.potong([[x, yy + 2], [x + 118, yy], [x + 120, yy + tinggi], [x + 2, yy + tinggi + 2]], warnaKertas[i], 0.6);
    const baris: [number, number][][] = [];
    for (let k = 0; k < 4; k++) {
      baris.push([[x + 14, yy + 20 + k * 15], [x + l.antara(70, 104), yy + 20 + k * 15]]);
    }
    l.garisBanyak(baris, WARNA.wedel, 3);
    l.bulatan(x + 59, yy + 7, 5, WARNA.merah);
  }
  orang(l, 500, y + 120, 142, warga(l, { kepala: "kerudung", lengan: [[0.16, -0.3], [-0.1, 0.3]] }));
  orang(l, 700, y + 130, 148, warga(l, { kepala: "peci", sarung: true }));
  orang(l, 610, y + 134, 96, warga(l, { kepala: "rambut", sarung: false, bawah: WARNA.wedel }));
}

const DAFTAR_ADEGAN: readonly [RegExp, (l: Lembar) => void][] = [
  [/kemerdekaan|hut |agustus|lomba/i, agustusan],
  [/bulu tangkis|turnamen/i, buluTangkis],
  [/saluran|kerja bakti/i, (l) => (/pengecatan|pos ronda/i.test(judulSekarang) ? pengecatan(l) : kerjaBakti(l))],
  [/ronda/i, ronda],
  [/lampu|penerangan/i, lampu],
  [/posyandu|kesehatan/i, posyandu],
  [/parkir|ambulans/i, parkir],
  [/bank sampah|penimbangan/i, bankSampah],
  [/pelatihan pemasaran|digital/i, pelatihan],
  [/taman|penanaman/i, taman],
  [/maulid|pengajian/i, maulid],
  [/rapat koordinasi|rapat warga|rapat/i, (l) => rapat(l)],
  [/pkk|arisan/i, (l) => rapat(l, true)],
  [/tanggap bencana|pemadaman api/i, tanggapBencana],
  [/laporan kas|kas rt/i, kas],
];

let judulSekarang = "";

/** Adegan yang cocok dengan judul; bila tidak ada, warga di papan pengumuman. */
export function adeganUntuk(judul: string, benih: number, lebar = L, tinggi = T): string {
  judulSekarang = judul;
  const l = new Lembar(L, T, benih + 7);
  const adegan = DAFTAR_ADEGAN.find(([pola]) => pola.test(judul))?.[1] ?? papanWarga;
  adegan(l);
  const svg = l.svg(judul);
  if (lebar === L && tinggi === T) return svg;
  // Potongan persegi dari tengah adegan, untuk gambar berasio lain.
  return svg.replace(
    `viewBox="0 0 ${L} ${T}" width="${L}" height="${T}"`,
    `viewBox="${(L - T) / 2} 0 ${T} ${T}" width="${tinggi}" height="${tinggi}"`,
  );
}

/** Potret pengurus: tanpa wajah, cukup baju dan penutup kepalanya. */
export function potretPengurus(nama: string, benih: number): string {
  const l = new Lembar(400, 400, benih + 3);
  const perempuan = /^(ibu|hj|dra|sri|siti|dewi|endang|ani|rina|ratna|nur|yuni|wati|tri|lestari)/i.test(
    nama.replace(/^[A-Z]{1,3}\.\s*/, ""),
  );
  l.kotak(-10, -10, 420, 420, l.pilih(["#CBDCE6", "#F4DA9A", "#CFE2C6", "#F1D0C0", "#D9CEB8"]), 0);
  const baju = l.pilih([WARNA.wedel, WARNA.soga, WARNA.daun, WARNA.gentengTua]);
  const kulit = l.pilih(WARNA.kulit);
  l.gumpal(
    [
      [20, 420],
      [46, 310],
      [140, 268],
      [260, 268],
      [354, 310],
      [380, 420],
    ],
    baju,
  );
  if (!perempuan) {
    l.potong([[168, 268], [200, 324], [232, 268]], WARNA.pethak, 0);
  }
  // Motif kawung pada baju.
  for (const [x, y] of [[96, 346], [150, 382], [250, 382], [304, 346]]) {
    l.lonjong(x, y, 9, 15, WARNA.kunyitMuda + "88", 0.04, 6);
  }
  l.potong([[172, 262], [228, 262], [224, 298], [176, 298]], kulit, 0.4);
  l.lonjong(200, 186, 70, 84, kulit, 0.03, 10);
  if (perempuan) {
    const warna = l.pilih([WARNA.pethak, WARNA.kunyit, "#C97B8B", WARNA.wedel]);
    l.gumpal(
      [
        [112, 300],
        [116, 160],
        [200, 88],
        [284, 160],
        [288, 300],
        [200, 322],
      ],
      warna,
    );
    l.lonjong(200, 192, 56, 66, kulit, 0.02, 10);
  } else if (l.acak() > 0.45) {
    l.potong([[126, 132], [132, 74], [268, 74], [274, 132]], "#1E1A18", 0.6);
    l.kotak(126, 124, 148, 8, "#3A3430", 0.3);
  } else {
    l.gumpal(
      [
        [124, 186],
        [130, 112],
        [200, 88],
        [272, 112],
        [278, 186],
        [252, 136],
        [150, 132],
      ],
      "#1E1A18",
    );
  }
  return l.svg(nama);
}

/** Halaman 404: gang yang berakhir di tembok. */
export function gangBuntu(): string {
  const l = new Lembar(640, 420, 5);
  const y = 330;
  langit(l, "pagi", 250);
  awan(l, 120, 60, 0.7);
  awan(l, 520, 92, 0.55);
  rimbunJauh(l, 250, "#A8C8B6", 20);
  // Tembok ujung gang.
  l.kotak(150, 118, 340, y - 118, WARNA.dinding[0][0], 1.2);
  l.kotak(150, 118, 340, 12, WARNA.gentengTua, 0.5);
  const bata: [number, number][][] = [];
  for (let b = 0; b < 7; b++) {
    const yy = 150 + b * 27;
    bata.push([
      [150, yy],
      [490, yy],
    ]);
    for (let x = 170 + (b % 2) * 34; x < 490; x += 68) {
      bata.push([
        [x, yy],
        [x, yy + 27],
      ]);
    }
  }
  l.garisBanyak(bata, WARNA.dinding[0][1], 2);
  rumah(l, 8, y, 150, 124, { dinding: WARNA.dinding[2] });
  rumahPelana(l, 486, y, 138, 118, { dinding: WARNA.dinding[3] });
  gang(l, y);
  // Rambu dilarang masuk di depan tembok.
  l.kotak(315, 176, 10, y - 170, "#5C6B74", 0.3);
  l.lonjong(320, 152, 50, 50, WARNA.merah, 0.01, 12);
  l.lonjong(320, 152, 41, 41, WARNA.pethak, 0.01, 12);
  l.kotak(289, 143, 62, 18, WARNA.merah, 0.2);
  kucing(l, 430, y + 30, 1.5);
  ayam(l, 214, y + 40, 1.3);
  potBunga(l, 178, y + 6, 1.3, WARNA.merah);
  return l.svg("Ujung gang yang buntu, dengan rambu dilarang masuk dan seekor kucing");
}

/** Halaman galat: listrik kampung padam, petugas memanjat tiang. */
export function listrikPadam(): string {
  const l = new Lembar(640, 420, 8);
  const y = 340;
  langit(l, "malam", 280);
  bintang(l, 280, 22);
  l.lonjong(520, 76, 28, 28, "#F6E7B5", 0.015, 10);
  l.lonjong(530, 70, 25, 25, "#162542", 0.015, 10);
  rimbunJauh(l, 300, "#142A3C", 34);
  rumah(l, 30, y, 200, 120, { dinding: ["#465A78", "#39495F"], atap: "seng" });
  rumah(l, 400, y, 220, 130, { dinding: ["#465A78", "#39495F"], atap: "seng" });
  gang(l, y, ["#39465A", "#2C3849"]);
  const t = tiangListrik(l, 320, y + 6, 280);
  kabel(l, [-20, 96], t[0], 22, "#8799AD");
  kabel(l, t[2], [660, 96], 22, "#8799AD");
  tangga(l, [372, y + 10], [332, 128]);
  orang(l, 356, 268, 108, {
    baju: WARNA.kunyit,
    bawah: WARNA.wedel,
    kepala: "caping",
    lengan: [
      [-0.3, -0.3],
      [-0.2, 0.06],
    ],
    kaki: [
      [0.06, 0.34],
      [-0.08, 0.42],
    ],
    condong: -0.1,
  });
  l.potong([[246, 96], [262, 62], [254, 90], [272, 84], [250, 124], [258, 100]], WARNA.kunyit, 0);
  return l.svg("Malam hari, petugas memperbaiki kabel di tiang listrik kampung");
}

/** Siluet atap untuk tepi atas kaki halaman; warnanya diambil dari latar halaman. */
export function siluetAtap(warna: string): string {
  const l = new Lembar(1600, 70, 3);
  const titik: [number, number][] = [[-10, 80]];
  let x = -10;
  while (x < 1620) {
    const w = l.antara(70, 150);
    const h = l.antara(10, 34);
    titik.push([x, 70 - h * 0.6], [x + w * 0.22, 70 - h - 14], [x + w * 0.78, 70 - h - 14], [x + w, 70 - h * 0.6]);
    x += w + l.antara(0, 24);
  }
  titik.push([1620, 80]);
  l.potong(titik, warna, 0);
  return l.svg("");
}
