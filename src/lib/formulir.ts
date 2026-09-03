/**
 * Pembantu formulir server action.
 *
 * React 19 mengosongkan formulir tak terkendali setiap kali sebuah action
 * selesai dijalankan. Bila action menolak masukan, isian yang sudah diketik
 * pengguna ikut hilang. Karena itu setiap action mengembalikan kembali nilai
 * yang dikirim melalui `nilai`, lalu formulir memakainya sebagai nilai awal.
 */

export type HasilAksi = {
  galat?: string;
  sukses?: string;
  /** Nilai teks yang dikirim pengguna, untuk mengisi ulang formulir saat gagal. */
  nilai?: Record<string, string>;
};

/** Mengambil seluruh bidang teks dari FormData (berkas diabaikan). */
export function nilaiForm(formData: FormData): Record<string, string> {
  const hasil: Record<string, string> = {};
  for (const [kunci, nilai] of formData.entries()) {
    if (typeof nilai === "string") hasil[kunci] = nilai;
  }
  return hasil;
}

/**
 * Pembaca nilai awal untuk komponen formulir: memakai nilai kiriman terakhir
 * bila ada, selain itu memakai nilai bawaan dari basis data.
 */
export function pembacaNilai(nilai: Record<string, string> | undefined) {
  return (nama: string, bawaan?: string | number | null) => {
    const dikirim = nilai?.[nama];
    return dikirim !== undefined ? dikirim : (bawaan ?? undefined);
  };
}

/** Versi untuk kotak centang: "on" bila dicentang. */
export function pembacaCentang(nilai: Record<string, string> | undefined) {
  return (nama: string, bawaan: boolean) =>
    nilai ? nilai[nama] === "on" : bawaan;
}
