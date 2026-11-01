"use client";

/**
 * Dipakai bila layout akar sendiri gagal. Halaman ini menggantikan seluruh
 * dokumen dan tidak memuat globals.css, jadi gayanya ditulis langsung.
 */
export default function GalatGlobal({ retry }: { error: Error; retry: () => void }) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background: "#fafaf6",
          color: "#12211c",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main style={{ maxWidth: 480 }}>
          <title>Situs sedang terganggu | Kampung Sanggrahan</title>
          <h1 style={{ fontSize: 28, margin: "0 0 12px" }}>Situs sedang terganggu</h1>
          <p style={{ lineHeight: 1.6, margin: "0 0 24px" }}>
            Halaman belum bisa ditampilkan. Data warga dan laporan kas tidak berubah. Coba lagi
            beberapa saat.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              minHeight: 44,
              padding: "0 20px",
              border: 0,
              background: "#17493a",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Coba lagi
          </button>
        </main>
      </body>
    </html>
  );
}
