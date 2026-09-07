"use client";

import { useEffect, useRef } from "react";

/**
 * Mengirim satu penanda "berita ini dibaca" setelah halaman tampil.
 * Dijalankan di peramban agar halaman beritanya sendiri tetap dapat disajikan
 * dari cache tanpa menunggu penulisan ke basis data.
 */
export default function CatatDilihat({ slug }: { slug: string }) {
  const sudah = useRef(false);

  useEffect(() => {
    if (sudah.current) return;
    sudah.current = true;
    fetch(`/api/berita/${encodeURIComponent(slug)}/dilihat`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {});
  }, [slug]);

  return null;
}
