"use client";

import GalatHalaman from "@/components/ui/GalatHalaman";

/**
 * Penampung terakhir di bawah layout akar: dipakai saat layout publik atau layout
 * panel sendiri gagal, misalnya karena pengaturan situs tidak bisa dibaca.
 */
export default function GalatAkar(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main id="konten" tabIndex={-1} className="min-h-screen">
      <GalatHalaman {...props} />
    </main>
  );
}
