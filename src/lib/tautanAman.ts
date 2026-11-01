/**
 * Memastikan tujuan setelah masuk tetap berada di situs ini.
 *
 * Awalan "/" saja tidak cukup: `//contoh.com` dan `/\contoh.com` dibaca peramban
 * sebagai alamat situs lain, sehingga tautan masuk yang dipalsukan bisa membawa
 * pengurus ke halaman tiruan.
 */
export function tujuanAman(tujuan: string | null | undefined, bawaan = "/admin"): string {
  if (!tujuan || !tujuan.startsWith("/") || /[\\\s]/.test(tujuan)) return bawaan;

  try {
    const dasar = "http://situs.invalid";
    const url = new URL(tujuan, dasar);
    return url.origin === dasar ? `${url.pathname}${url.search}${url.hash}` : bawaan;
  } catch {
    return bawaan;
  }
}
