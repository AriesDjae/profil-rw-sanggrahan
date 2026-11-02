"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

import { PUSAT_KAMPUNG, type TitikUsaha } from "@/lib/petaKampung";
import { UMKM } from "@/lib/tautanLuar";

/** Isi gelembung dirakit dari simpul, bukan teks HTML, supaya nama usaha tidak perlu dijinakkan. */
function isiGelembung(t: TitikUsaha): HTMLElement {
  const isi = document.createElement("div");
  const nama = document.createElement("p");
  nama.className = "gelembung-nama";
  nama.textContent = t.nama;
  const rincian = document.createElement("p");
  rincian.className = "gelembung-rincian";
  rincian.textContent = `${t.kategori}, RW ${String(t.rw).padStart(2, "0")}`;
  const tautan = document.createElement("a");
  tautan.href = `${UMKM.url}/umkm/${encodeURIComponent(t.slug)}`;
  tautan.textContent = "Lihat di Usaha Warga";
  isi.append(nama, rincian, tautan);
  return isi;
}

export default function PetaKampung({
  titik,
  ringkas = false,
}: {
  titik: readonly TitikUsaha[];
  ringkas?: boolean;
}) {
  const wadah = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wadah.current) return;

    const peta = L.map(wadah.current, {
      center: [PUSAT_KAMPUNG.lat, PUSAT_KAMPUNG.lng],
      zoom: 16,
      // Peta ada di tengah halaman. Roda tetikus dan usapan satu jari harus tetap
      // menggulir halaman, bukan menjebak pembaca di dalam peta.
      scrollWheelZoom: false,
      dragging: !L.Browser.mobile,
    });

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; kontributor <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(peta);

    for (const t of titik) {
      L.marker([t.lat, t.lng], {
        icon: L.divIcon({
          className: `pin-usaha pin-rw-${t.rw}`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
          popupAnchor: [0, -8],
        }),
        title: t.nama,
        alt: t.nama,
        riseOnHover: true,
      })
        .addTo(peta)
        .bindPopup(isiGelembung(t), { closeButton: false });
    }

    if (titik.length > 1) {
      peta.fitBounds(
        L.latLngBounds(titik.map((t) => [t.lat, t.lng] as [number, number])),
        { padding: [36, 36], maxZoom: 17 },
      );
    }

    const ukurUlang = new ResizeObserver(() => peta.invalidateSize());
    ukurUlang.observe(wadah.current);

    return () => {
      ukurUlang.disconnect();
      peta.remove();
    };
  }, [titik]);

  return (
    <div
      ref={wadah}
      className="h-full w-full"
      role="application"
      aria-label={
        ringkas
          ? "Peta letak Kampung Sanggrahan"
          : "Peta Kampung Sanggrahan dengan titik usaha warga"
      }
    />
  );
}
