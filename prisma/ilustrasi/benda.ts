import type { Lembar, Titik } from "./kertas";

/**
 * Benda-benda kampung. Matahari pagi datang dari timur, yaitu sisi kanan bila
 * menghadap Merapi di utara, jadi sisi kiri setiap benda dibuat lebih gelap.
 */

export const WARNA = {
  wedel: "#233A60",
  wedelTua: "#162542",
  soga: "#8B5427",
  sogaTua: "#5E3618",
  kunyit: "#EAAD24",
  kunyitMuda: "#F6D77F",
  pethak: "#FBF7EC",
  genteng: "#BC5A30",
  gentengTua: "#8E3F20",
  gentengMuda: "#D07A4A",
  seng: "#93A3AB",
  sengTua: "#6E7E88",
  daun: "#3F7D52",
  daunTua: "#2C5B3C",
  daunMuda: "#6FA568",
  tanah: "#D9C3A0",
  tanahTua: "#BFA37B",
  semen: "#D9CEB8",
  semenTua: "#BDAF95",
  merah: "#C8352B",
  kulit: ["#8A5A36", "#A2703F", "#74482A"],
  rambut: "#1E1A18",
  dinding: [
    ["#F7EBD3", "#E2CFAE"],
    ["#F4DA9A", "#DDBB6F"],
    ["#CFE2C6", "#ABC8A2"],
    ["#CBDCE6", "#A5BDCB"],
    ["#F1D0C0", "#D9AE9B"],
    ["#FBF7EC", "#DED7C5"],
  ],
} as const;

export type WaktuHari = "pagi" | "siang" | "sore" | "malam";

export const LANGIT: Record<WaktuHari, string[]> = {
  pagi: ["#D5E7EF", "#E1EEEE", "#EEF2E2", "#FAEFCF"],
  siang: ["#BFDDEB", "#CFE6EE", "#DFEEEE", "#ECF3E6"],
  sore: ["#F4D9B3", "#F7CF9B", "#F4B984", "#EE9F72"],
  malam: ["#101C33", "#162542", "#1C2F4F", "#27406A"],
};

export function langit(l: Lembar, waktu: WaktuHari, cakrawala: number): void {
  const pita = LANGIT[waktu];
  l.kotak(-20, -20, l.lebar + 40, l.tinggi + 40, pita[0], 0);
  const tinggi = cakrawala / pita.length;
  pita.slice(1).forEach((warna, i) => {
    const y = tinggi * (i + 1);
    const atas: Titik[] = [];
    const langkah = 8;
    for (let k = 0; k <= langkah; k++) {
      atas.push([(l.lebar / langkah) * k, y + l.antara(-7, 7)]);
    }
    l.potong([...atas, [l.lebar + 20, l.tinggi], [-20, l.tinggi]], warna, 0);
  });
}

export function matahari(l: Lembar, x: number, y: number, r: number, warna: string = WARNA.kunyitMuda): void {
  l.lonjong(x, y, r * 1.5, r * 1.5, warna + "55", 0.02, 10);
  l.lonjong(x, y, r, r, warna, 0.015, 10);
}

export function awan(l: Lembar, x: number, y: number, s: number, warna = "#FFFFFF"): void {
  const dasar = y + 14 * s;
  l.lonjong(x - 34 * s, y + 2 * s, 30 * s, 16 * s, warna);
  l.lonjong(x + 2 * s, y - 6 * s, 38 * s, 24 * s, warna);
  l.lonjong(x + 44 * s, y + 3 * s, 28 * s, 14 * s, warna);
  l.potong(
    [
      [x - 60 * s, dasar - 8 * s],
      [x + 70 * s, dasar - 8 * s],
      [x + 62 * s, dasar],
      [x - 52 * s, dasar],
    ],
    warna,
    0,
  );
}

export function bintang(l: Lembar, cakrawala: number, jumlah: number): void {
  for (let i = 0; i < jumlah; i++) {
    l.bulatan(l.antara(10, l.lebar - 10), l.antara(10, cakrawala * 0.8), l.antara(1, 2.4), "#F6E7B5");
  }
}

/** Merapi dengan kepulan tipis di puncaknya; penanda utara bagi orang Yogyakarta. */
export function merapi(
  l: Lembar,
  x: number,
  y: number,
  lebar: number,
  tinggi: number,
  warna: { terang: string; gelap: string; asap: string },
): void {
  const puncak = y - tinggi;
  const kiri = x - lebar / 2;
  const kanan = x + lebar / 2;
  l.potong(
    [
      [kiri, y],
      [x - lebar * 0.2, y - tinggi * 0.42],
      [x - lebar * 0.06, puncak + tinggi * 0.06],
      [x - lebar * 0.015, puncak],
      [x + lebar * 0.03, puncak + tinggi * 0.015],
      [x + lebar * 0.07, puncak + tinggi * 0.07],
      [x + lebar * 0.22, y - tinggi * 0.4],
      [kanan, y],
    ],
    warna.terang,
    1.6,
  );
  l.potong(
    [
      [kiri, y],
      [x - lebar * 0.2, y - tinggi * 0.42],
      [x - lebar * 0.06, puncak + tinggi * 0.06],
      [x - lebar * 0.015, puncak],
      [x - lebar * 0.03, y - tinggi * 0.62],
      [x + lebar * 0.01, y - tinggi * 0.46],
      [x - lebar * 0.06, y - tinggi * 0.28],
      [x - lebar * 0.03, y],
    ],
    warna.gelap,
    1.6,
  );
  const a = tinggi * 0.13;
  l.lonjong(x + a * 0.5, puncak - a * 0.7, a * 0.75, a * 0.5, warna.asap);
  l.lonjong(x + a * 1.7, puncak - a * 1.3, a * 1.05, a * 0.62, warna.asap);
  l.lonjong(x + a * 3.3, puncak - a * 1.55, a * 1.1, a * 0.48, warna.asap);
}

/** Barisan rumpun pohon jauh yang memudar ke arah cakrawala. */
export function rimbunJauh(l: Lembar, y: number, warna: string, tinggi = 34): void {
  const titik: Titik[] = [[-20, l.tinggi]];
  for (let x = -20; x <= l.lebar + 40; x += 46) {
    titik.push([x, y - l.antara(0, tinggi)]);
  }
  titik.push([l.lebar + 40, l.tinggi]);
  l.gumpal(titik, warna);
}

export type GayaRumah = {
  dinding: readonly [string, string];
  atap?: "genteng" | "seng";
  nyala?: boolean;
  bata?: boolean;
};

/** Rumah kampung tampak depan dengan atap limasan. `x` adalah sisi kiri dinding. */
export function rumah(l: Lembar, x: number, y: number, w: number, h: number, g: GayaRumah): void {
  const [terang, gelap] = g.dinding;
  const seng = g.atap === "seng";
  const atapT = seng ? WARNA.seng : WARNA.genteng;
  const atapG = seng ? WARNA.sengTua : WARNA.gentengTua;
  const tinggiAtap = Math.min(h * 0.72, w * 0.46);
  const juluran = Math.max(10, w * 0.07);

  l.kotak(x, y - h, w, h, terang);
  l.kotak(x, y - h * 0.13, w, h * 0.13, gelap, 0.6);

  const bawah = y - h + 5;
  const atas = bawah - tinggiAtap;
  const kiri = x - juluran;
  const kanan = x + w + juluran;
  const bahuKiri = x + w * 0.2;
  const bahuKanan = x + w * 0.8;
  l.kotak(x, y - h, w, h * 0.13, gelap, 0.5);
  l.potong(
    [
      [kiri, bawah],
      [bahuKiri, atas],
      [bahuKanan, atas],
      [kanan, bawah],
    ],
    atapT,
    1.3,
  );
  l.potong(
    [
      [kiri, bawah],
      [bahuKiri, atas],
      [bahuKiri + w * 0.05, atas],
      [x + w * 0.16, bawah],
    ],
    atapG,
    1,
  );
  // Baris genteng: garis tipis yang tidak sepenuhnya sejajar.
  const barisGenteng: Titik[][] = [];
  for (let i = 1; i <= 3; i++) {
    const u = i / 4;
    const yy = atas + tinggiAtap * u;
    barisGenteng.push([
      [bahuKiri + (kiri - bahuKiri) * u + 2, yy + l.antara(-1, 1)],
      [bahuKanan + (kanan - bahuKanan) * u - 2, yy + l.antara(-1, 1)],
    ]);
  }
  l.garisBanyak(barisGenteng, atapG, 1.6);
  l.kotak(kiri, bawah - 1, kanan - kiri, 5, atapG, 0.3);

  // Pintu dan jendela.
  const lebarPintu = Math.min(w * 0.2, h * 0.34);
  const tinggiPintu = h * 0.62;
  const xPintu = x + w * 0.5 - lebarPintu / 2 + l.antara(-w * 0.14, w * 0.14);
  l.kotak(xPintu, y - tinggiPintu, lebarPintu, tinggiPintu, WARNA.soga, 0.4);
  l.kotak(xPintu + lebarPintu * 0.12, y - tinggiPintu + 4, lebarPintu * 0.76, tinggiPintu * 0.42, WARNA.sogaTua, 0.3);
  const kaca = g.nyala ? WARNA.kunyit : WARNA.wedel;
  const lJendela = w * 0.17;
  const tJendela = h * 0.34;
  const yJendela = y - h * 0.68;
  for (const xJ of [x + w * 0.08, x + w - w * 0.08 - lJendela]) {
    if (xJ + lJendela > xPintu - 3 && xJ < xPintu + lebarPintu + 3) continue;
    l.kotak(xJ - 2, yJendela - 2, lJendela + 4, tJendela + 4, WARNA.pethak, 0.3);
    l.kotak(xJ, yJendela, lJendela, tJendela, kaca, 0.3);
    l.garis(
      [
        [xJ + lJendela / 2, yJendela],
        [xJ + lJendela / 2, yJendela + tJendela],
      ],
      WARNA.pethak,
      2,
    );
  }
}

/** Pendapa joglo: atap bertingkat di atas tiang kayu, tanpa dinding. */
export function pendapa(l: Lembar, x: number, y: number, w: number, h: number): void {
  const yAtap = y - h * 0.5;
  l.kotak(x - 12, y - 10, w + 24, 10, WARNA.semen, 0.5);
  l.kotak(x - 12, y - 4, w + 24, 4, WARNA.semenTua, 0.3);
  for (const u of [0.02, 0.32, 0.68, 0.98]) {
    l.kotak(x + w * u - 4, yAtap, 8, h * 0.5 - 10, WARNA.soga, 0.3);
  }
  l.potong(
    [
      [x - w * 0.09, yAtap + 6],
      [x + w * 0.2, y - h * 0.72],
      [x + w * 0.8, y - h * 0.72],
      [x + w * 1.09, yAtap + 6],
    ],
    WARNA.genteng,
    1.2,
  );
  l.potong(
    [
      [x + w * 0.14, y - h * 0.7],
      [x + w * 0.38, y - h],
      [x + w * 0.62, y - h],
      [x + w * 0.86, y - h * 0.7],
    ],
    WARNA.gentengMuda,
    1,
  );
  l.potong(
    [
      [x - w * 0.09, yAtap + 6],
      [x + w * 0.2, y - h * 0.72],
      [x + w * 0.27, y - h * 0.72],
      [x + w * 0.1, yAtap + 6],
    ],
    WARNA.gentengTua,
    0.8,
  );
  l.kotak(x - w * 0.09, yAtap + 3, w * 1.18, 5, WARNA.gentengTua, 0.3);
  l.kotak(x + w * 0.38, y - h - 4, w * 0.24, 6, WARNA.gentengTua, 0.3);
}

export function masjid(l: Lembar, x: number, y: number, s: number): void {
  const w = 150 * s;
  const h = 62 * s;
  l.kotak(x, y - h, w, h, WARNA.pethak);
  l.kotak(x, y - h * 0.14, w, h * 0.14, "#DED7C5", 0.5);
  for (let i = 0; i < 3; i++) {
    const xp = x + w * (0.14 + i * 0.28);
    l.gumpal(
      [
        [xp, y],
        [xp, y - h * 0.5],
        [xp + w * 0.08, y - h * 0.74],
        [xp + w * 0.16, y - h * 0.5],
        [xp + w * 0.16, y],
      ],
      WARNA.daunTua,
    );
  }
  l.kotak(x - 6 * s, y - h - 5 * s, w + 12 * s, 7 * s, WARNA.daun, 0.4);
  l.gumpal(
    [
      [x + w * 0.2, y - h - 4 * s],
      [x + w * 0.24, y - h - 40 * s],
      [x + w * 0.5, y - h - 72 * s],
      [x + w * 0.76, y - h - 40 * s],
      [x + w * 0.8, y - h - 4 * s],
    ],
    WARNA.daun,
  );
  l.kotak(x + w * 0.5 - 1.5 * s, y - h - 86 * s, 3 * s, 16 * s, WARNA.kunyit, 0);
  l.kotak(x + w + 16 * s, y - 118 * s, 15 * s, 118 * s, WARNA.pethak);
  l.kotak(x + w + 12 * s, y - 92 * s, 23 * s, 5 * s, WARNA.daun, 0.3);
  l.potong(
    [
      [x + w + 15 * s, y - 118 * s],
      [x + w + 23.5 * s, y - 142 * s],
      [x + w + 32 * s, y - 118 * s],
    ],
    WARNA.daun,
    0.4,
  );
}

/** Gapura kampung dari tembok, bercat putih-merah seperti menjelang Agustusan. */
export function gapura(l: Lembar, x: number, y: number, w: number, h: number, warna?: string): void {
  const lebarTiang = w * 0.14;
  const tiang = (xt: number) => {
    l.kotak(xt, y - h, lebarTiang, h, WARNA.pethak);
    l.kotak(xt, y - h, lebarTiang * 0.34, h, "#DED7C5", 0.4);
    for (let i = 0; i < 3; i++) {
      l.kotak(xt, y - (i * 2 + 1) * h * 0.1, lebarTiang, h * 0.1, WARNA.merah, 0.4);
    }
    l.kotak(xt - 5, y - h - 7, lebarTiang + 10, 8, WARNA.sogaTua, 0.3);
    l.potong(
      [
        [xt - 3, y - h - 7],
        [xt + lebarTiang / 2, y - h - 24],
        [xt + lebarTiang + 3, y - h - 7],
      ],
      WARNA.genteng,
      0.4,
    );
  };
  tiang(x);
  tiang(x + w - lebarTiang);
  const tinggiPapan = h * 0.2;
  l.kotak(x + lebarTiang - 2, y - h * 0.94, w - lebarTiang * 2 + 4, tinggiPapan, warna ?? WARNA.wedel);
  l.kotak(x + lebarTiang + 8, y - h * 0.9, w - lebarTiang * 2 - 16, 2.5, WARNA.kunyit, 0);
  l.kotak(x + lebarTiang + 8, y - h * 0.94 + tinggiPapan * 0.72, w - lebarTiang * 2 - 16, 2.5, WARNA.kunyit, 0);
}

/** Pos ronda panggung dari bambu, lengkap dengan kentongan. */
export function posRonda(l: Lembar, x: number, y: number, s: number, nyala = false): void {
  const w = 130 * s;
  const h = 96 * s;
  const lantai = y - 26 * s;
  l.potong(
    [
      [x - 14 * s, y - h + 6 * s],
      [x + w * 0.5, y - h - 26 * s],
      [x + w + 14 * s, y - h + 6 * s],
    ],
    WARNA.seng,
    0.8,
  );
  l.potong(
    [
      [x - 14 * s, y - h + 6 * s],
      [x + w * 0.5, y - h - 26 * s],
      [x + w * 0.42, y - h + 6 * s],
    ],
    WARNA.sengTua,
    0.6,
  );
  if (nyala) {
    l.potong(
      [
        [x + w * 0.5, y - h + 12 * s],
        [x - 26 * s, y],
        [x + w + 26 * s, y],
      ],
      WARNA.kunyit + "33",
      0,
    );
  }
  for (const u of [0, 0.5, 1]) {
    l.kotak(x + w * u - 3 * s, y - h + 4 * s, 6 * s, h - 4 * s, WARNA.soga, 0.3);
  }
  l.kotak(x - 8 * s, lantai, w + 16 * s, 8 * s, WARNA.tanahTua, 0.4);
  for (let i = 0; i < 7; i++) {
    l.kotak(x - 6 * s + (i * w) / 6.4, lantai + 1, 1.6, 6 * s, WARNA.soga, 0);
  }
  if (nyala) l.bulatan(x + w * 0.5, y - h + 12 * s, 6 * s, WARNA.kunyitMuda);
  // Kentongan bambu tergantung di tiang kanan.
  const xk = x + w + 6 * s;
  l.garis(
    [
      [xk, y - h + 12 * s],
      [xk, y - h + 24 * s],
    ],
    WARNA.sogaTua,
    1.6,
  );
  l.kotak(xk - 5 * s, y - h + 24 * s, 10 * s, 34 * s, WARNA.kunyit, 0.3);
  l.kotak(xk - 1.4 * s, y - h + 30 * s, 2.8 * s, 20 * s, WARNA.sogaTua, 0);
}

export function tiangListrik(l: Lembar, x: number, y: number, h: number): Titik[] {
  l.kotak(x - 4, y - h, 8, h, "#5C6B74", 0.4);
  l.kotak(x - 4, y - h, 3, h, "#46525A", 0.2);
  l.kotak(x - 30, y - h + 12, 60, 5, "#46525A", 0.3);
  l.kotak(x - 11, y - h + 54, 22, 34, "#7E8D95", 0.3);
  return [
    [x - 28, y - h + 11],
    [x, y - h + 11],
    [x + 28, y - h + 11],
  ];
}

export function kabel(l: Lembar, a: Titik, b: Titik, lendut = 26, warna = "#3A4650"): void {
  l.lengkung(a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + lendut], b, warna, 1.5);
}

export function burungKabel(l: Lembar, x: number, y: number, warna = "#2A3540"): void {
  l.lonjong(x, y - 5, 6, 4, warna, 0.05, 6);
  l.bulatan(x + 5, y - 8, 2.8, warna);
}

export function pohon(l: Lembar, x: number, y: number, s: number, warna?: readonly [string, string, string]): void {
  const [tua, tengah, muda] = warna ?? [WARNA.daunTua, WARNA.daun, WARNA.daunMuda];
  l.potong(
    [
      [x - 9 * s, y],
      [x - 5 * s, y - 95 * s],
      [x + 5 * s, y - 95 * s],
      [x + 10 * s, y],
    ],
    WARNA.sogaTua,
    0.6,
  );
  l.garis(
    [
      [x, y - 70 * s],
      [x + 26 * s, y - 104 * s],
    ],
    WARNA.sogaTua,
    5 * s,
  );
  l.lonjong(x - 30 * s, y - 116 * s, 52 * s, 44 * s, tua, 0.1, 9);
  l.lonjong(x + 34 * s, y - 112 * s, 50 * s, 40 * s, tua, 0.1, 9);
  l.lonjong(x + 2 * s, y - 158 * s, 56 * s, 46 * s, tengah, 0.1, 9);
  l.lonjong(x + 30 * s, y - 128 * s, 38 * s, 28 * s, tengah, 0.1, 8);
  l.lonjong(x + 20 * s, y - 170 * s, 30 * s, 22 * s, muda, 0.12, 8);
  l.lonjong(x + 46 * s, y - 140 * s, 18 * s, 13 * s, muda, 0.12, 7);
}

export function pisang(l: Lembar, x: number, y: number, s: number): void {
  l.potong(
    [
      [x - 7 * s, y],
      [x - 4 * s, y - 72 * s],
      [x + 4 * s, y - 72 * s],
      [x + 7 * s, y],
    ],
    WARNA.daunMuda,
    0.5,
  );
  const daun = (sudut: number, panjang: number, warna: string) => {
    const a = (sudut * Math.PI) / 180;
    const ujung: Titik = [x + Math.cos(a) * panjang * s, y - 72 * s + Math.sin(a) * panjang * s];
    const tengah: Titik = [x + Math.cos(a) * panjang * 0.5 * s, y - 72 * s + Math.sin(a) * panjang * 0.5 * s - 12 * s];
    l.gumpal(
      [
        [x, y - 72 * s],
        [tengah[0], tengah[1] - 11 * s],
        ujung,
        [tengah[0], tengah[1] + 11 * s],
      ],
      warna,
    );
  };
  daun(-155, 64, WARNA.daunTua);
  daun(-30, 66, WARNA.daunTua);
  daun(-110, 58, WARNA.daun);
  daun(-68, 62, WARNA.daun);
  daun(-5, 50, WARNA.daunMuda);
  daun(-175, 46, WARNA.daunMuda);
}

export function kelapa(l: Lembar, x: number, y: number, s: number, condong = 1): void {
  const px = x + 26 * s * condong;
  const py = y - 200 * s;
  l.lengkung([x, y], [x - 8 * s * condong, y - 110 * s], [px, py], "#7A5A3C", 8 * s);
  for (const [sudut, p, warna] of [
    [-168, 74, WARNA.daunTua],
    [-12, 76, WARNA.daunTua],
    [-142, 70, WARNA.daun],
    [-40, 72, WARNA.daun],
    [-110, 56, WARNA.daunMuda],
    [-72, 58, WARNA.daunMuda],
    [165, 56, WARNA.daun],
    [15, 58, WARNA.daun],
  ] as const) {
    const a = (sudut * Math.PI) / 180;
    const ujung: Titik = [px + Math.cos(a) * p * s, py + Math.sin(a) * p * s + 14 * s];
    const tengah: Titik = [px + Math.cos(a) * p * 0.5 * s, py + Math.sin(a) * p * 0.5 * s - 8 * s];
    l.gumpal(
      [
        [px, py],
        [tengah[0], tengah[1] - 4 * s],
        ujung,
        [tengah[0], tengah[1] + 5 * s],
      ],
      warna,
    );
  }
}

export function potBunga(l: Lembar, x: number, y: number, s: number, warnaBunga: string): void {
  l.potong(
    [
      [x - 9 * s, y - 15 * s],
      [x + 9 * s, y - 15 * s],
      [x + 6.5 * s, y],
      [x - 6.5 * s, y],
    ],
    WARNA.gentengTua,
    0.3,
  );
  l.lonjong(x, y - 24 * s, 13 * s, 11 * s, WARNA.daun, 0.15, 7);
  for (const [dx, dy] of [
    [-6, -28],
    [3, -32],
    [8, -24],
  ]) {
    l.bulatan(x + dx * s, y + dy * s, 2.6 * s, warnaBunga);
  }
}

/** Tali jemuran di antara dua titik, dengan pakaian warna-warni. */
export function jemuran(l: Lembar, a: Titik, b: Titik): void {
  const c: Titik = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 12];
  l.lengkung(a, c, b, "#5C6B74", 1.3);
  const warna = [WARNA.merah, WARNA.pethak, WARNA.kunyit, WARNA.wedel, "#6FA568"];
  const jumlah = 4;
  for (let i = 0; i < jumlah; i++) {
    const u = (i + 0.8) / (jumlah + 0.6);
    const x = (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0];
    const y = (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1];
    const w = l.antara(13, 20);
    const h = l.antara(18, 30);
    l.potong(
      [
        [x - w / 2, y],
        [x + w / 2, y + 1],
        [x + w / 2 + 2, y + h],
        [x - w / 2 - 1, y + h - 1],
      ],
      warna[i % warna.length],
      0.4,
    );
  }
}

export function layangan(l: Lembar, x: number, y: number, s: number): void {
  l.potong(
    [
      [x, y - 28 * s],
      [x + 22 * s, y],
      [x, y + 34 * s],
      [x - 22 * s, y],
    ],
    WARNA.merah,
    0,
  );
  l.potong(
    [
      [x, y - 28 * s],
      [x, y + 34 * s],
      [x - 22 * s, y],
    ],
    WARNA.pethak,
    0,
  );
  l.potong(
    [
      [x - 8 * s, y + 34 * s],
      [x + 8 * s, y + 34 * s],
      [x, y + 26 * s],
    ],
    WARNA.kunyit,
    0,
  );
}

export type GayaOrang = {
  baju: string;
  bawah: string;
  kulit?: string;
  kepala?: "rambut" | "peci" | "kerudung" | "caping" | "rambutPanjang";
  warnaKepala?: string;
  sarung?: boolean;
  /** Ujung lengan depan dan belakang, relatif terhadap bahu, dalam tinggi badan. */
  lengan?: readonly [Titik, Titik];
  /** Ujung kaki kiri dan kanan, relatif terhadap pinggul. */
  kaki?: readonly [Titik, Titik];
  condong?: number;
};

/**
 * Orang kecil tanpa wajah. Ukurannya sengaja tetap kecil di dalam adegan: gerak
 * tubuhnya yang bercerita, bukan rincian wajah.
 */
export function orang(l: Lembar, x: number, y: number, t: number, g: GayaOrang): { tangan: Titik } {
  const kulit = g.kulit ?? WARNA.kulit[0];
  const condong = g.condong ?? 0;
  const pinggul: Titik = [x, y - t * 0.46];
  const bahu: Titik = [x + condong * t, y - t * 0.8];
  const kepala: Titik = [bahu[0] + condong * t * 0.25, y - t * 0.92];
  const r = t * 0.082;
  const tebalKaki = t * 0.095;
  const tebalLengan = t * 0.068;
  const lengan = g.lengan ?? [
    [0.14, 0.3],
    [-0.12, 0.3],
  ];
  const kaki = g.kaki ?? [
    [0.05, 0.46],
    [-0.06, 0.46],
  ];
  const ujung = (p: Titik, q: Titik): Titik => [p[0] + q[0] * t, p[1] + q[1] * t];

  const lenganBelakang = ujung(bahu, lengan[1]);
  l.garis([bahu, lenganBelakang], kulit, tebalLengan);

  if (g.sarung) {
    l.potong(
      [
        [pinggul[0] - t * 0.1, pinggul[1]],
        [pinggul[0] + t * 0.1, pinggul[1]],
        [pinggul[0] + t * 0.13, y],
        [pinggul[0] - t * 0.13, y],
      ],
      g.bawah,
      0,
    );
  } else {
    l.garis([pinggul, ujung(pinggul, kaki[1])], g.bawah, tebalKaki);
    l.garis([pinggul, ujung(pinggul, kaki[0])], g.bawah, tebalKaki);
  }

  l.potong(
    [
      [bahu[0] - t * 0.1, bahu[1] - t * 0.02],
      [bahu[0] + t * 0.1, bahu[1] - t * 0.02],
      [pinggul[0] + t * 0.1, pinggul[1] + t * 0.03],
      [pinggul[0] - t * 0.1, pinggul[1] + t * 0.03],
    ],
    g.baju,
    0,
  );

  l.bulatan(kepala[0], kepala[1], r, kulit);
  const warnaKepala = g.warnaKepala ?? WARNA.rambut;
  switch (g.kepala ?? "rambut") {
    case "rambut":
      l.gumpal(
        [
          [kepala[0] - r * 1.05, kepala[1] + r * 0.1],
          [kepala[0] - r * 0.7, kepala[1] - r * 1.05],
          [kepala[0] + r * 0.8, kepala[1] - r * 1.05],
          [kepala[0] + r * 1.05, kepala[1] - r * 0.1],
          [kepala[0], kepala[1] - r * 0.45],
        ],
        warnaKepala,
      );
      break;
    case "rambutPanjang":
      l.gumpal(
        [
          [kepala[0] - r * 1.15, kepala[1] + r * 1.5],
          [kepala[0] - r * 1.1, kepala[1] - r * 0.8],
          [kepala[0], kepala[1] - r * 1.2],
          [kepala[0] + r * 1.1, kepala[1] - r * 0.7],
          [kepala[0] + r * 0.9, kepala[1] - r * 0.1],
          [kepala[0] - r * 0.5, kepala[1] + r * 0.2],
        ],
        warnaKepala,
      );
      break;
    case "peci":
      l.kotak(kepala[0] - r * 1.02, kepala[1] - r * 1.1, r * 2.04, r * 0.95, warnaKepala, 0);
      break;
    case "kerudung":
      l.gumpal(
        [
          [kepala[0] - r * 1.25, kepala[1] + r * 1.7],
          [kepala[0] - r * 1.2, kepala[1] - r * 0.7],
          [kepala[0], kepala[1] - r * 1.25],
          [kepala[0] + r * 1.2, kepala[1] - r * 0.7],
          [kepala[0] + r * 1.25, kepala[1] + r * 1.7],
          [kepala[0], kepala[1] + r * 2.1],
        ],
        warnaKepala,
      );
      l.lonjong(kepala[0] + r * 0.12, kepala[1] + r * 0.1, r * 0.68, r * 0.74, kulit, 0.02, 7);
      break;
    case "caping":
      l.potong(
        [
          [kepala[0] - r * 2.2, kepala[1] - r * 0.3],
          [kepala[0], kepala[1] - r * 1.8],
          [kepala[0] + r * 2.2, kepala[1] - r * 0.3],
        ],
        WARNA.kunyit,
        0,
      );
      break;
  }

  const lenganDepan = ujung(bahu, lengan[0]);
  l.garis([bahu, lenganDepan], kulit, tebalLengan);
  return { tangan: lenganDepan };
}

/** Warga duduk bersila di tikar atau lantai pendapa, dilihat dari samping. */
export function orangDuduk(l: Lembar, x: number, y: number, t: number, g: GayaOrang): void {
  orang(l, x, y + t * 0.3, t, {
    ...g,
    sarung: true,
    lengan: g.lengan ?? [
      [0.16, 0.24],
      [0.05, 0.27],
    ],
  });
  l.gumpal(
    [
      [x - t * 0.2, y],
      [x - t * 0.16, y - t * 0.12],
      [x + t * 0.2, y - t * 0.12],
      [x + t * 0.26, y],
    ],
    g.bawah,
  );
}

export function sapuLidi(l: Lembar, a: Titik, b: Titik): void {
  l.garis([a, b], WARNA.soga, 3);
  l.potong(
    [
      [b[0] - 3, b[1] - 2],
      [b[0] + 3, b[1] - 2],
      [b[0] + 19, b[1] + 13],
      [b[0] - 19, b[1] + 13],
    ],
    WARNA.kunyit,
    0.4,
  );
}

export function sepeda(l: Lembar, x: number, y: number, s: number, warna: string = WARNA.wedel): void {
  const r = 17 * s;
  const roda = (cx: number) => {
    l.mentah(
      `<circle cx="${cx}" cy="${y - r}" r="${r}" fill="none" stroke="#2A3540" stroke-width="${2.6 * s}"/>`,
    );
  };
  roda(x);
  roda(x + 56 * s);
  l.garis(
    [
      [x, y - r],
      [x + 24 * s, y - r - 22 * s],
      [x + 46 * s, y - r - 22 * s],
      [x + 28 * s, y - r],
      [x, y - r],
    ],
    warna,
    3 * s,
  );
  l.garis(
    [
      [x + 46 * s, y - r - 22 * s],
      [x + 56 * s, y - r],
    ],
    warna,
    3 * s,
  );
  l.garis(
    [
      [x + 46 * s, y - r - 22 * s],
      [x + 43 * s, y - r - 34 * s],
      [x + 52 * s, y - r - 36 * s],
    ],
    "#2A3540",
    2.6 * s,
  );
  l.garis(
    [
      [x + 24 * s, y - r - 22 * s],
      [x + 22 * s, y - r - 28 * s],
    ],
    "#2A3540",
    2.6 * s,
  );
  l.kotak(x + 14 * s, y - r - 31 * s, 16 * s, 4 * s, "#2A3540", 0);
}

export function ayam(l: Lembar, x: number, y: number, s: number, warna: string = WARNA.gentengMuda): void {
  l.lonjong(x, y - 10 * s, 11 * s, 8 * s, warna, 0.08, 7);
  l.bulatan(x + 10 * s, y - 17 * s, 4.5 * s, warna);
  l.potong(
    [
      [x - 8 * s, y - 13 * s],
      [x - 20 * s, y - 22 * s],
      [x - 15 * s, y - 8 * s],
    ],
    WARNA.gentengTua,
    0,
  );
  l.bulatan(x + 10.5 * s, y - 22 * s, 2 * s, WARNA.merah);
  l.potong(
    [
      [x + 14 * s, y - 18 * s],
      [x + 19 * s, y - 16.5 * s],
      [x + 14 * s, y - 15 * s],
    ],
    WARNA.kunyit,
    0,
  );
  l.garis(
    [
      [x - 2 * s, y - 3 * s],
      [x - 2 * s, y],
    ],
    WARNA.kunyit,
    1.4 * s,
  );
  l.garis(
    [
      [x + 3 * s, y - 3 * s],
      [x + 3 * s, y],
    ],
    WARNA.kunyit,
    1.4 * s,
  );
}

export function kucing(l: Lembar, x: number, y: number, s: number, warna = "#2A3540"): void {
  l.lonjong(x, y - 9 * s, 7 * s, 9 * s, warna, 0.05, 7);
  l.bulatan(x + 1 * s, y - 20 * s, 5.5 * s, warna);
  l.potong(
    [
      [x - 4 * s, y - 23 * s],
      [x - 3 * s, y - 30 * s],
      [x + 1 * s, y - 25 * s],
    ],
    warna,
    0,
  );
  l.potong(
    [
      [x + 1 * s, y - 25 * s],
      [x + 5 * s, y - 30 * s],
      [x + 6 * s, y - 23 * s],
    ],
    warna,
    0,
  );
  l.lengkung([x - 5 * s, y - 2 * s], [x - 18 * s, y - 3 * s], [x - 15 * s, y - 15 * s], warna, 2.6 * s);
}

/** Jalan gang berlapis paving, dengan selokan kecil di sisi atasnya. */
export function gang(l: Lembar, y: number, warna: readonly [string, string] = [WARNA.semen, WARNA.semenTua]): void {
  l.kotak(-20, y, l.lebar + 40, l.tinggi - y + 20, warna[0], 0);
  l.kotak(-20, y, l.lebar + 40, 8, warna[1], 0.5);
  // Bekas sapuan dan retak semen: sedikit saja, supaya jalannya tidak polos.
  const ruas: Titik[][] = [];
  const baris = Math.ceil((l.tinggi - y) / 30);
  for (let b = 1; b < baris; b++) {
    const yy = y + 10 + b * 28;
    for (let x = l.antara(-60, 120); x < l.lebar; x += l.antara(190, 340)) {
      ruas.push([
        [x, yy],
        [x + l.antara(40, 90), yy + l.antara(-1, 1)],
      ]);
    }
  }
  l.garisBanyak(ruas, warna[1], 1.4);
}

/** Rumah berpelana: sisi segitiga menghadap jalan, lebih sempit dan lebih tinggi. */
export function rumahPelana(l: Lembar, x: number, y: number, w: number, h: number, g: GayaRumah): void {
  const [terang, gelap] = g.dinding;
  const seng = g.atap === "seng";
  const atapT = seng ? WARNA.seng : WARNA.genteng;
  const atapG = seng ? WARNA.sengTua : WARNA.gentengTua;
  const tinggiAtap = w * 0.42;
  const puncak = y - h - tinggiAtap;

  l.potong(
    [
      [x, y],
      [x, y - h],
      [x + w / 2, puncak],
      [x + w, y - h],
      [x + w, y],
    ],
    terang,
    1,
  );
  l.potong(
    [
      [x, y],
      [x, y - h],
      [x + w * 0.14, y - h - tinggiAtap * 0.28],
      [x + w * 0.14, y],
    ],
    gelap,
    0.6,
  );
  l.kotak(x, y - h * 0.12, w, h * 0.12, gelap, 0.5);
  // Papan lisplang di dua sisi atap.
  l.garis(
    [
      [x - w * 0.09, y - h + tinggiAtap * 0.2],
      [x + w / 2, puncak - 2],
      [x + w * 1.09, y - h + tinggiAtap * 0.2],
    ],
    atapT,
    Math.max(7, w * 0.05),
  );
  l.garis(
    [
      [x - w * 0.09, y - h + tinggiAtap * 0.2],
      [x + w / 2, puncak - 2],
    ],
    atapG,
    Math.max(7, w * 0.05),
  );
  const kaca = g.nyala ? WARNA.kunyit : WARNA.wedel;
  l.lonjong(x + w / 2, puncak + tinggiAtap * 0.62, w * 0.075, w * 0.075, kaca, 0.02, 8);
  const lp = w * 0.24;
  const tp = h * 0.64;
  const xp = x + w * 0.16;
  l.kotak(xp, y - tp, lp, tp, WARNA.wedel, 0.4);
  l.kotak(xp + lp * 0.14, y - tp + 4, lp * 0.72, tp * 0.4, WARNA.wedelTua, 0.3);
  const lj = w * 0.28;
  const xj = x + w * 0.56;
  const yj = y - h * 0.7;
  l.kotak(xj - 2, yj - 2, lj + 4, h * 0.36 + 4, WARNA.pethak, 0.3);
  l.kotak(xj, yj, lj, h * 0.36, kaca, 0.3);
  l.garis(
    [
      [xj + lj / 2, yj],
      [xj + lj / 2, yj + h * 0.36],
    ],
    WARNA.pethak,
    2,
  );
}

/** Warung dengan terpal bergaris, etalase, dan gantungan kopi sachet. */
export function warung(l: Lembar, x: number, y: number, w: number, h: number): void {
  l.kotak(x, y - h, w, h, WARNA.dinding[1][0]);
  l.kotak(x, y - h * 0.34, w, h * 0.34, WARNA.soga, 0.5);
  l.kotak(x + 6, y - h * 0.34 + 5, w - 12, h * 0.1, WARNA.sogaTua, 0.3);
  l.kotak(x + w * 0.1, y - h * 0.82, w * 0.8, h * 0.44, WARNA.wedelTua, 0.4);
  const warna = [WARNA.merah, WARNA.kunyit, WARNA.pethak, WARNA.daun, WARNA.merah, WARNA.kunyit, WARNA.wedel];
  const jumlahRak = 7;
  for (let i = 0; i < jumlahRak; i++) {
    l.kotak(x + w * 0.13 + (i * w * 0.74) / jumlahRak, y - h * 0.78, w * 0.07, h * 0.15, warna[i], 0.2);
    l.kotak(x + w * 0.13 + (i * w * 0.74) / jumlahRak, y - h * 0.6, w * 0.07, h * 0.15, warna[(i + 3) % 7], 0.2);
  }
  const garis = 7;
  const lebarGaris = (w + 28) / garis;
  for (let i = 0; i < garis; i++) {
    l.potong(
      [
        [x - 14 + i * lebarGaris, y - h * 0.92],
        [x - 14 + (i + 1) * lebarGaris, y - h * 0.92],
        [x - 14 + (i + 1) * lebarGaris + 3, y - h * 0.76],
        [x - 14 + i * lebarGaris - 3, y - h * 0.76],
      ],
      i % 2 ? WARNA.pethak : WARNA.merah,
      0.3,
    );
  }
  l.potong(
    [
      [x - 8, y - h * 1.08],
      [x + w + 8, y - h * 1.08],
      [x + w + 14, y - h * 0.92],
      [x - 14, y - h * 0.92],
    ],
    WARNA.seng,
    0.5,
  );
}

/** Gerobak angkringan bertudung terpal, khas malam Yogyakarta. */
export function angkringan(l: Lembar, x: number, y: number, s: number, nyala = false): void {
  const w = 120 * s;
  const yBadan = y - 22 * s;
  for (const u of [0.24, 0.76]) {
    l.mentah(
      `<circle class="g" stroke="#2A3540" stroke-width="${4 * s}" cx="${x + w * u}" cy="${y - 13 * s}" r="${13 * s}"/>`,
    );
  }
  l.kotak(x, yBadan - 36 * s, w, 36 * s, WARNA.daun, 0.4);
  l.kotak(x, yBadan - 36 * s, w, 8 * s, WARNA.daunTua, 0.2);
  l.kotak(x + 8 * s, yBadan - 24 * s, w - 16 * s, 14 * s, WARNA.pethak, 0.2);
  for (const u of [0.04, 0.92]) {
    l.kotak(x + w * u, yBadan - 86 * s, 4 * s, 52 * s, WARNA.sogaTua, 0.2);
  }
  l.potong(
    [
      [x - 14 * s, yBadan - 82 * s],
      [x + w + 14 * s, yBadan - 82 * s],
      [x + w + 4 * s, yBadan - 100 * s],
      [x - 4 * s, yBadan - 100 * s],
    ],
    WARNA.wedel,
    0.4,
  );
  if (nyala) l.bulatan(x + w * 0.5, yBadan - 70 * s, 5 * s, WARNA.kunyitMuda);
  l.kotak(x + w * 0.2, yBadan - 54 * s, 14 * s, 18 * s, WARNA.semenTua, 0.2);
}

export function meja(l: Lembar, x: number, y: number, w: number, h: number, warna: string = WARNA.soga): void {
  l.kotak(x, y - h, w, 7, warna, 0.3);
  l.kotak(x + 5, y - h + 6, 5, h - 6, WARNA.sogaTua, 0.2);
  l.kotak(x + w - 10, y - h + 6, 5, h - 6, WARNA.sogaTua, 0.2);
}

export function tikar(l: Lembar, x: number, y: number, w: number, h: number): void {
  l.potong(
    [
      [x + w * 0.06, y - h],
      [x + w * 0.94, y - h],
      [x + w, y],
      [x, y],
    ],
    WARNA.kunyit,
    0.8,
  );
  const garis: Titik[][] = [];
  for (let i = 1; i < 4; i++) {
    const yy = y - h + (h * i) / 4;
    garis.push([
      [x + 6, yy],
      [x + w - 6, yy],
    ]);
  }
  l.garisBanyak(garis, WARNA.merah, 2);
}

export function tenda(l: Lembar, x: number, y: number, w: number, h: number, warna: string = WARNA.wedel): void {
  for (const u of [0, 1]) {
    l.kotak(x + w * u - 3, y - h, 6, h, "#7E8D95", 0.2);
  }
  l.potong(
    [
      [x - 14, y - h + 4],
      [x + w * 0.5, y - h - 34],
      [x + w + 14, y - h + 4],
    ],
    warna,
    0.6,
  );
  l.potong(
    [
      [x - 14, y - h + 4],
      [x + w * 0.5, y - h - 34],
      [x + w * 0.34, y - h + 4],
    ],
    WARNA.wedelTua,
    0.5,
  );
  const n = 6;
  for (let i = 0; i < n; i++) {
    const xp = x - 14 + (i * (w + 28)) / n;
    l.potong(
      [
        [xp, y - h + 4],
        [xp + (w + 28) / n, y - h + 4],
        [xp + (w + 28) / n / 2, y - h + 16],
      ],
      i % 2 ? WARNA.kunyit : WARNA.pethak,
      0,
    );
  }
}

/** Lampu jalan dengan kerucut cahaya bidang datar. */
export function lampuJalan(l: Lembar, x: number, y: number, h: number, nyala = true): void {
  if (nyala) {
    l.potong(
      [
        [x + 30, y - h + 8],
        [x - 54, y],
        [x + 130, y],
      ],
      WARNA.kunyit + "33",
      0,
    );
  }
  l.kotak(x - 3, y - h, 6, h, "#3A4650", 0.2);
  l.lengkung([x, y - h], [x + 6, y - h - 16], [x + 30, y - h], "#3A4650", 4);
  l.kotak(x + 22, y - h, 16, 6, "#3A4650", 0.1);
  l.lonjong(x + 30, y - h + 9, 7, 5, nyala ? WARNA.kunyitMuda : WARNA.pethak, 0.02, 6);
}

export function tangga(l: Lembar, bawah: Titik, atas: Titik): void {
  const nx = 10;
  l.garis(
    [
      [bawah[0] - nx, bawah[1]],
      [atas[0] - nx, atas[1]],
    ],
    WARNA.semenTua,
    3,
  );
  l.garis(
    [
      [bawah[0] + nx, bawah[1]],
      [atas[0] + nx, atas[1]],
    ],
    WARNA.semenTua,
    3,
  );
  const anak: Titik[][] = [];
  for (let i = 1; i < 7; i++) {
    const u = i / 7;
    const cx = bawah[0] + (atas[0] - bawah[0]) * u;
    const cy = bawah[1] + (atas[1] - bawah[1]) * u;
    anak.push([
      [cx - nx, cy],
      [cx + nx, cy],
    ]);
  }
  l.garisBanyak(anak, WARNA.semenTua, 2.4);
}

export function motor(l: Lembar, x: number, y: number, s: number, warna: string = WARNA.merah): void {
  const r = 15 * s;
  for (const cx of [x + r, x + 78 * s]) {
    l.bulatan(cx, y - r, r, "#2A3540");
    l.bulatan(cx, y - r, r * 0.42, WARNA.semenTua);
  }
  l.gumpal(
    [
      [x + 12 * s, y - 24 * s],
      [x + 22 * s, y - 42 * s],
      [x + 58 * s, y - 40 * s],
      [x + 74 * s, y - 60 * s],
      [x + 82 * s, y - 30 * s],
      [x + 52 * s, y - 20 * s],
    ],
    warna,
  );
  l.lonjong(x + 34 * s, y - 45 * s, 24 * s, 6 * s, "#2A3540", 0.03, 6);
  l.garis(
    [
      [x + 74 * s, y - 60 * s],
      [x + 68 * s, y - 72 * s],
      [x + 80 * s, y - 74 * s],
    ],
    "#2A3540",
    3 * s,
  );
}

export function ambulans(l: Lembar, x: number, y: number, s: number): void {
  const w = 230 * s;
  const h = 110 * s;
  l.potong(
    [
      [x, y - 18 * s],
      [x, y - h],
      [x + w * 0.72, y - h],
      [x + w * 0.9, y - h * 0.62],
      [x + w, y - h * 0.56],
      [x + w, y - 18 * s],
    ],
    WARNA.pethak,
    0.6,
  );
  l.potong(
    [
      [x + w * 0.74, y - h * 0.92],
      [x + w * 0.87, y - h * 0.62],
      [x + w * 0.74, y - h * 0.62],
    ],
    WARNA.wedel,
    0.3,
  );
  l.kotak(x, y - h * 0.5, w, 12 * s, WARNA.merah, 0.3);
  l.kotak(x + w * 0.3, y - h * 0.86, 26 * s, 8 * s, WARNA.merah, 0);
  l.kotak(x + w * 0.3 + 9 * s, y - h * 0.86 - 9 * s, 8 * s, 26 * s, WARNA.merah, 0);
  l.kotak(x + w * 0.46, y - h - 9 * s, 26 * s, 10 * s, WARNA.merah, 0.2);
  for (const u of [0.2, 0.8]) {
    l.bulatan(x + w * u, y - 18 * s, 18 * s, "#2A3540");
    l.bulatan(x + w * u, y - 18 * s, 7 * s, WARNA.semenTua);
  }
}

export function karung(l: Lembar, x: number, y: number, s: number, warna: string = WARNA.pethak): void {
  l.gumpal(
    [
      [x - 26 * s, y],
      [x - 28 * s, y - 34 * s],
      [x - 10 * s, y - 56 * s],
      [x + 12 * s, y - 56 * s],
      [x + 28 * s, y - 34 * s],
      [x + 26 * s, y],
    ],
    warna,
  );
  l.garis(
    [
      [x - 12 * s, y - 50 * s],
      [x + 12 * s, y - 50 * s],
    ],
    WARNA.soga,
    2.4 * s,
  );
}

export function bendera(l: Lembar, x: number, y: number, h: number): void {
  l.kotak(x - 1.6, y - h, 3.2, h, WARNA.semenTua, 0);
  const w = h * 0.34;
  const t = h * 0.1;
  l.potong(
    [
      [x + 2, y - h],
      [x + 2 + w * 0.5, y - h + 3],
      [x + 2 + w, y - h],
      [x + 2 + w, y - h + t],
      [x + 2 + w * 0.5, y - h + t + 3],
      [x + 2, y - h + t],
    ],
    WARNA.merah,
    0,
  );
  l.potong(
    [
      [x + 2, y - h + t],
      [x + 2 + w * 0.5, y - h + t + 3],
      [x + 2 + w, y - h + t],
      [x + 2 + w, y - h + t * 2],
      [x + 2 + w * 0.5, y - h + t * 2 + 3],
      [x + 2, y - h + t * 2],
    ],
    WARNA.pethak,
    0,
  );
}

/** Tali bendera kecil melintang gang. */
export function benderaTali(l: Lembar, a: Titik, b: Titik, jumlah = 12): void {
  const c: Titik = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 26];
  l.lengkung(a, c, b, "#5C6B74", 1.2);
  for (let i = 1; i < jumlah; i++) {
    const u = i / jumlah;
    const x = (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0];
    const y = (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1];
    l.potong(
      [
        [x - 9, y],
        [x + 9, y],
        [x, y + 18],
      ],
      i % 2 ? WARNA.merah : WARNA.pethak,
      0,
    );
  }
}
