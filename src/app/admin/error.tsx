"use client";

import GalatHalaman from "@/components/ui/GalatHalaman";

/** Menu samping tetap tampil, supaya pengurus bisa berpindah ke modul lain. */
export default function GalatPanel(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <GalatHalaman {...props} tujuan="/admin" labelTujuan="Kembali ke dasbor" />;
}
