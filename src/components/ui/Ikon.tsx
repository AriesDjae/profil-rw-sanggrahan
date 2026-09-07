/**
 * Kumpulan ikon situs, satu bahasa bentuk: petak 24x24, garis (bukan bidang
 * penuh), ujung tumpul, dan mewarisi warna teks induknya lewat currentColor.
 *
 * Sebelumnya tiap ikon digambar ulang langsung di dalam halaman, sehingga satu
 * bentuk yang sama tersebar di beberapa berkas. Semua dikumpulkan di sini agar
 * ada satu sumber kebenaran: memperbaiki bentuk cukup di satu tempat.
 *
 * Ukuran dan tebal garis sudah dibakukan per ikon, jadi pemanggilnya cukup
 * menulis <IkonPanahKiri ukuran={15} />. Keduanya masih bisa ditimpa bila
 * sebuah halaman memang butuh ukuran lain.
 *
 * Ikon di sini dianggap hiasan: selalu ada teks di sebelahnya atau aria-label
 * pada tombol pembungkusnya. Beri prop `judul` hanya bila ikon berdiri sendiri
 * tanpa teks pendamping, supaya pembaca layar tetap kebagian keterangan.
 */

export type PropsIkon = {
  /** Sisi petak ikon dalam piksel. */
  ukuran?: number;
  /** Tebal garis. Bawaannya sudah pas per ikon; jarang perlu diisi. */
  tebal?: number;
  className?: string;
  /** Keterangan untuk pembaca layar. Kosongkan bila ikon hanya hiasan. */
  judul?: string;
};

type PropsBungkus = PropsIkon & {
  children: React.ReactNode;
  /** Bentuk sambungan garis. "round" untuk ikon bersudut lengkung. */
  sambungan?: "round" | "miter";
};

function Bungkus({
  children,
  ukuran = 16,
  tebal = 2,
  sambungan = "miter",
  className,
  judul,
}: PropsBungkus) {
  return (
    <svg
      width={ukuran}
      height={ukuran}
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={tebal}
      strokeLinecap="round"
      strokeLinejoin={sambungan}
      role={judul ? "img" : undefined}
      aria-hidden={judul ? undefined : true}
      aria-label={judul}
    >
      {judul ? <title>{judul}</title> : null}
      {children}
    </svg>
  );
}

/* ---------- Arah dan navigasi ---------- */

/** Panah berekor ke kiri. Dipakai pada tautan "kembali". */
export function IkonPanahKiri(p: PropsIkon) {
  return (
    <Bungkus tebal={2.5} {...p}>
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </Bungkus>
  );
}

/** Panah berekor ke kanan. Dipakai pada tautan "lanjut ke ...". */
export function IkonPanahKanan(p: PropsIkon) {
  return (
    <Bungkus tebal={2.5} sambungan="round" {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Bungkus>
  );
}

/** Panah tanpa ekor ke kiri. Dipakai pada tombol geser korsel. */
export function IkonChevronKiri(p: PropsIkon) {
  return (
    <Bungkus tebal={2.2} {...p}>
      <path d="M15 5l-7 7 7 7" />
    </Bungkus>
  );
}

/** Panah tanpa ekor ke kanan. Dipakai pada tombol geser korsel. */
export function IkonChevronKanan(p: PropsIkon) {
  return (
    <Bungkus tebal={2.2} {...p}>
      <path d="M9 5l7 7-7 7" />
    </Bungkus>
  );
}

/** Panah keluar kotak. Menandai tautan ke situs lain. */
export function IkonTautanLuar(p: PropsIkon) {
  return (
    <Bungkus tebal={2.5} sambungan="round" {...p}>
      <path d="M7 17L17 7M9 7h8v8" />
    </Bungkus>
  );
}

/* ---------- Kendali ---------- */

/** Tiga garis mendatar, tombol buka menu. */
export function IkonMenu(p: PropsIkon) {
  return (
    <Bungkus {...p}>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </Bungkus>
  );
}

/** Silang, tombol tutup menu. */
export function IkonTutup(p: PropsIkon) {
  return (
    <Bungkus {...p}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </Bungkus>
  );
}

/** Centang. Menandai langkah selesai atau laporan yang sudah disetujui. */
export function IkonCentang(p: PropsIkon) {
  return (
    <Bungkus tebal={3} sambungan="round" {...p}>
      <path d="M4 12.5l5.5 5.5L20 7" />
    </Bungkus>
  );
}

/** Pencetak. Tombol cetak laporan. */
export function IkonCetak(p: PropsIkon) {
  return (
    <Bungkus sambungan="round" {...p}>
      <path d="M6 9V3h12v6" />
      <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
      <path d="M6 14h12v7H6z" />
    </Bungkus>
  );
}

/** Garis-garis memendek, penanda daftar yang masih kosong. */
export function IkonDaftarKosong(p: PropsIkon) {
  return (
    <Bungkus tebal={1.8} {...p}>
      <path d="M4 6h16M4 12h10M4 18h7" />
    </Bungkus>
  );
}

/* ---------- Ikon menu panel pengurus ---------- */

/**
 * Bentuk untuk tiap butir menu di Sidebar. Kuncinya sama dengan nilai
 * `ikon` pada daftar menu; nama yang tidak dikenal jatuh ke ikon dasbor.
 */
const BENTUK_MENU: Record<string, React.ReactNode> = {
  dasbor: <path d="M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6V11h-6v9zm0-16v5h6V4h-6z" />,
  persetujuan: <path d="M9 12l2 2 4-4M12 3l7 4v5c0 4.4-3 8.5-7 9.6C8 20.5 5 16.4 5 12V7l7-4z" />,
  uang: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />,
  berita: <path d="M4 5h16v14H4zM8 9h8M8 13h8M8 17h5" />,
  kalender: <path d="M3 6h18v15H3zM8 3v5M16 3v5M3 11h18" />,
  megafon: <path d="M3 11v2a1 1 0 001 1h2l4 4V6L6 10H4a1 1 0 00-1 1zM16 9a4 4 0 010 6" />,
  foto: <path d="M3 5h18v14H3zM8.5 11a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 16l-5-5-9 8" />,
  warga: (
    <path d="M16 20v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 10a4 4 0 100-8 4 4 0 000 8zM22 20v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8" />
  ),
  pengurus: <path d="M12 3l8 4v6c0 4-3.5 7.5-8 8-4.5-.5-8-4-8-8V7l8-4z" />,
  pengaturan: (
    <path d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1A1.7 1.7 0 008.9 19a1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1A1.7 1.7 0 004.6 8.9a1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
  ),
};

/** Ikon satu butir menu panel pengurus, dipilih lewat namanya. */
export function IkonMenuAdmin({ nama, ...p }: PropsIkon & { nama: string }) {
  return (
    <Bungkus tebal={1.8} sambungan="round" {...p}>
      {BENTUK_MENU[nama] ?? BENTUK_MENU.dasbor}
    </Bungkus>
  );
}
