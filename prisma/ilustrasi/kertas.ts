/**
 * Alat gambar gaya potongan kertas: bidang warna rata, tanpa garis tepi, dengan
 * pinggiran yang sedikit tidak rata seperti digunting tangan.
 *
 * Ketidakrataan itu dihitung saat berkas dibuat, bukan memakai filter SVG, jadi
 * hasil akhirnya tetap path biasa yang ringan dirender peramban. Pengacaknya
 * berbenih, sehingga berkas yang sama selalu menghasilkan gambar yang sama.
 */

export type Titik = readonly [number, number];

export function pengacak(benih: number): () => number {
  let t = Math.imul(benih + 1, 2654435761) >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const bulat = (n: number) => Math.round(n * 10) / 10;

/** Angka ringkas untuk path: "0.5" menjadi ".5", tanda minus menggantikan spasi. */
function rangkai(angka: readonly number[]): string {
  return angka.reduce((teks, n, i) => {
    const ringkas = String(n).replace(/^(-?)0\./, "$1.");
    return teks + (i > 0 && n >= 0 ? " " : "") + ringkas;
  }, "");
}

/** Bidang besar cukup berpresisi satu piksel; bidang kecil butuh desimal. */
function presisi(titik: readonly Titik[]): number {
  const xs = titik.map((t) => t[0]);
  const ys = titik.map((t) => t[1]);
  return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) > 60 ? 1 : 10;
}

export class Lembar {
  private isi: string[] = [];
  readonly acak: () => number;

  constructor(
    readonly lebar: number,
    readonly tinggi: number,
    benih: number,
  ) {
    this.acak = pengacak(benih);
  }

  antara(a: number, b: number): number {
    return a + this.acak() * (b - a);
  }

  pilih<T>(daftar: readonly T[]): T {
    return daftar[Math.floor(this.acak() * daftar.length)];
  }

  /** Memecah sisi panjang lalu menggeser titiknya sedikit, seperti guntingan tangan. */
  private pinggir(titik: readonly Titik[], goyang: number): Titik[] {
    if (goyang <= 0) return [...titik];
    const hasil: Titik[] = [];
    for (let i = 0; i < titik.length; i++) {
      const [x1, y1] = titik[i];
      const [x2, y2] = titik[(i + 1) % titik.length];
      hasil.push([x1, y1]);
      const panjang = Math.hypot(x2 - x1, y2 - y1);
      const pecahan = Math.floor(panjang / 170);
      for (let j = 1; j <= pecahan; j++) {
        const u = j / (pecahan + 1);
        hasil.push([
          x1 + (x2 - x1) * u + this.antara(-goyang, goyang),
          y1 + (y2 - y1) * u + this.antara(-goyang, goyang),
        ]);
      }
    }
    return hasil;
  }

  /** Koordinat relatif jauh lebih pendek daripada koordinat mutlak. */
  private tulisTitik(titik: readonly Titik[], tutup = true): string {
    const skala = presisi(titik);
    const r = (n: number) => Math.round(n * skala) / skala;
    let px = r(titik[0][0]);
    let py = r(titik[0][1]);
    const beda: number[] = [];
    for (const [x, y] of titik.slice(1)) {
      const rx = r(x);
      const ry = r(y);
      beda.push(bulat(rx - px), bulat(ry - py));
      px = rx;
      py = ry;
    }
    return `M${rangkai([r(titik[0][0]), r(titik[0][1])])}l${rangkai(beda)}${tutup ? "z" : ""}`;
  }

  /** Bidang bersudut. */
  potong(titik: readonly Titik[], warna: string, goyang = 1.2): void {
    this.isi.push(`<path fill="${warna}" d="${this.tulisTitik(this.pinggir(titik, goyang))}"/>`);
  }

  /** Persegi panjang dari kiri-atas. */
  kotak(x: number, y: number, l: number, t: number, warna: string, goyang = 0.8): void {
    this.potong(
      [
        [x, y],
        [x + l, y],
        [x + l, y + t],
        [x, y + t],
      ],
      warna,
      goyang,
    );
  }

  /** Bidang bulat tanpa sudut, lewat kurva Catmull-Rom tertutup. */
  gumpal(titik: readonly Titik[], warna: string): void {
    const n = titik.length;
    const skala = presisi(titik);
    const r = (a: number) => Math.round(a * skala) / skala;
    let px = r(titik[0][0]);
    let py = r(titik[0][1]);
    const beda: number[] = [];
    for (let i = 0; i < n; i++) {
      const p0 = titik[(i - 1 + n) % n];
      const p1 = titik[i];
      const p2 = titik[(i + 1) % n];
      const p3 = titik[(i + 2) % n];
      const ax = r(p1[0] + (p2[0] - p0[0]) / 6);
      const ay = r(p1[1] + (p2[1] - p0[1]) / 6);
      const bx = r(p2[0] - (p3[0] - p1[0]) / 6);
      const by = r(p2[1] - (p3[1] - p1[1]) / 6);
      const cx = r(p2[0]);
      const cy = r(p2[1]);
      beda.push(
        bulat(ax - px),
        bulat(ay - py),
        bulat(bx - px),
        bulat(by - py),
        bulat(cx - px),
        bulat(cy - py),
      );
      px = cx;
      py = cy;
    }
    this.isi.push(`<path fill="${warna}" d="M${rangkai([r(titik[0][0]), r(titik[0][1])])}c${rangkai(beda)}z"/>`);
  }

  /** Lonjong yang sedikit penyok. */
  lonjong(cx: number, cy: number, rx: number, ry: number, warna: string, penyok = 0.1, sudut = 8): void {
    const titik: Titik[] = [];
    for (let i = 0; i < sudut; i++) {
      const a = (i / sudut) * Math.PI * 2;
      const r = 1 + this.antara(-penyok, penyok);
      titik.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]);
    }
    this.gumpal(titik, warna);
  }

  /** Garis terbuka; ujungnya membulat. Dipakai untuk kabel, lengan, dan gagang. */
  garis(titik: readonly Titik[], warna: string, tebal: number): void {
    this.isi.push(`<path class="g" stroke="${warna}" stroke-width="${bulat(tebal)}" d="${this.tulisTitik(titik, false)}"/>`);
  }

  /** Banyak garis berwarna sama dalam satu path, misalnya baris genteng. */
  garisBanyak(ruas: readonly (readonly Titik[])[], warna: string, tebal: number): void {
    if (ruas.length === 0) return;
    const d = ruas.map((r) => this.tulisTitik(r, false)).join("");
    this.isi.push(`<path class="g" stroke="${warna}" stroke-width="${bulat(tebal)}" d="${d}"/>`);
  }

  /** Garis lengkung satu titik kendali, misalnya kabel yang melendut. */
  lengkung(a: Titik, kendali: Titik, b: Titik, warna: string, tebal: number): void {
    this.isi.push(
      `<path class="g" stroke="${warna}" stroke-width="${bulat(tebal)}" d="M${rangkai([bulat(a[0]), bulat(a[1])])}q${rangkai([
        bulat(kendali[0] - a[0]),
        bulat(kendali[1] - a[1]),
        bulat(b[0] - a[0]),
        bulat(b[1] - a[1]),
      ])}"/>`,
    );
  }

  bulatan(x: number, y: number, r: number, warna: string): void {
    this.isi.push(`<circle fill="${warna}" cx="${bulat(x)}" cy="${bulat(y)}" r="${bulat(r)}"/>`);
  }

  /** Isi `gambar` digeser, dibalik, atau diskalakan sebagai satu kelompok. */
  kelompok(transform: string, gambar: () => void, atribut = ""): void {
    this.isi.push(`<g transform="${transform}"${atribut ? ` ${atribut}` : ""}>`);
    gambar();
    this.isi.push("</g>");
  }

  /** Cermin mendatar terhadap titik x. */
  cermin(x: number, gambar: () => void): void {
    this.kelompok(`translate(${x * 2} 0) scale(-1 1)`, gambar);
  }

  /** Teks SVG mentah, misalnya blok <style> untuk animasi kecil. */
  mentah(svg: string): void {
    this.isi.push(svg);
  }

  svg(judul: string): string {
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.lebar} ${this.tinggi}" ` +
      `width="${this.lebar}" height="${this.tinggi}" role="img" aria-label="${judul.replace(/"/g, "&quot;")}">` +
      "<style>.g{fill:none;stroke-linecap:round;stroke-linejoin:round}</style>" +
      this.isi.join("") +
      "</svg>\n"
    );
  }
}
