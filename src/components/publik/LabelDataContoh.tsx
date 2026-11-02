/**
 * Pita pemberitahuan bahwa isi situs adalah data contoh hasil seed.
 *
 * Situs demo ini memakai nama kampung yang nyata, sehingga tanpa pita ini
 * pengunjung bisa mengira 825 warga dan laporan kas di dalamnya adalah data
 * sungguhan. Setelah situs diisi data warga asli, matikan pita dengan
 * `LABEL_DATA_CONTOH=mati` di variabel lingkungan lalu bangun ulang.
 */
export default function LabelDataContoh() {
  if (process.env.LABEL_DATA_CONTOH === "mati") return null;

  return (
    <aside
      aria-label="Catatan data contoh"
      className="tanpa-cetak border-b border-aksen-200 bg-aksen-50 px-4 py-2 text-center text-sm text-aksen-800"
    >
      <strong className="font-semibold">Situs demo.</strong> Nama warga,
      pengurus, berita, dan laporan kas di sini adalah data contoh, bukan data
      warga Kampung Sanggrahan yang sebenarnya.
    </aside>
  );
}
