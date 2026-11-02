"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import type { TitikUsaha } from "@/lib/petaKampung";

// Leaflet membaca `window` saat dimuat, jadi hanya boleh berjalan di peramban.
const PetaKampung = dynamic(() => import("./PetaKampung"), { ssr: false });

/**
 * Pustaka peta dan kepingannya baru diminta saat petanya hampir terlihat. Warga
 * yang hanya membuka beranda untuk memilih RW tidak ikut menanggung bebannya.
 * Tingginya tetap, supaya halaman tidak melonjak saat peta masuk.
 */
export default function PetaMalas({
  titik,
  ringkas = false,
}: {
  titik: readonly TitikUsaha[];
  ringkas?: boolean;
}) {
  const wadah = useRef<HTMLDivElement>(null);
  const [tampak, setTampak] = useState(false);

  useEffect(() => {
    const elemen = wadah.current;
    if (!elemen) return;
    const pengamat = new IntersectionObserver(
      ([masuk]) => {
        if (masuk.isIntersecting) {
          setTampak(true);
          pengamat.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    pengamat.observe(elemen);
    return () => pengamat.disconnect();
  }, []);

  return (
    <div
      ref={wadah}
      className={`isolate overflow-hidden rounded-xl border border-garis bg-soga-50 ${
        ringkas ? "h-80 sm:h-[26rem]" : "h-[62vh] min-h-[24rem]"
      }`}
    >
      {tampak ? (
        <PetaKampung titik={titik} ringkas={ringkas} />
      ) : (
        <p className="grid h-full place-items-center text-sm text-tinta/60">Menyiapkan peta</p>
      )}
    </div>
  );
}
