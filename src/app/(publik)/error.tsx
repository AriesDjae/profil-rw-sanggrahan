"use client";

import GalatHalaman from "@/components/ui/GalatHalaman";

/** Hanya isi halaman yang diganti; kop dan navigasi RW tetap bisa dipakai. */
export default function GalatPublik(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <GalatHalaman {...props} />;
}
