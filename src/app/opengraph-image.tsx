import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

export const alt = "Kampung Sanggrahan, portal warga RW 01, RW 02, dan RW 03";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Empat kelopak kawung, motif yang sama dengan latar bidang hijau di situs. */
function Kawung({ ukuran, warna }: { ukuran: number; warna: string }) {
  return (
    <svg width={ukuran} height={ukuran} viewBox="0 0 64 64" fill={warna}>
      {[45, 135, 225, 315].map((sudut) => (
        <ellipse
          key={sudut}
          cx="32"
          cy="17.5"
          rx="8"
          ry="13.5"
          transform={`rotate(${sudut} 32 32)`}
        />
      ))}
    </svg>
  );
}

/**
 * Gambar yang muncul saat tautan dibagikan ke WhatsApp, Facebook, atau LinkedIn.
 * Dibuat saat build. Foto contoh berformat SVG tidak dibaca aplikasi-aplikasi
 * itu, jadi gambar inilah pengganti untuk halaman yang tidak punya foto.
 */
export default async function GambarBagikan() {
  const [judul, teks] = await Promise.all([
    readFile(join(process.cwd(), "src/fonts/bricolage-grotesque-latin-700-normal.woff")),
    readFile(join(process.cwd(), "src/fonts/gantari-latin-500-normal.woff")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          padding: "72px 80px",
          backgroundColor: "#162542",
          color: "#ffffff",
          fontFamily: "Gantari",
        }}
      >
        <div style={{ position: "absolute", right: -190, top: 55, display: "flex", opacity: 0.2 }}>
          <Kawung ukuran={520} warna="#f3d68c" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#b4c3dc",
            }}
          >
            Portal Warga
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontFamily: "Bricolage Grotesque",
                fontSize: 104,
                lineHeight: 1,
                letterSpacing: -2,
              }}
            >
              Kampung
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: "Bricolage Grotesque",
                fontSize: 104,
                lineHeight: 1.05,
                letterSpacing: -2,
                color: "#f3d68c",
              }}
            >
              Sanggrahan
            </div>
            <div style={{ display: "flex", marginTop: 32, fontSize: 32, color: "#d9e1ee" }}>
              Berita, agenda, data warga, dan laporan kas RW 01, 02, 03
            </div>
          </div>

          <div style={{ display: "flex", fontSize: 26, color: "#b4c3dc" }}>
            Semaki, Umbulharjo, Kota Yogyakarta
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Bricolage Grotesque", data: judul, weight: 700, style: "normal" },
        { name: "Gantari", data: teks, weight: 500, style: "normal" },
      ],
    },
  );
}
