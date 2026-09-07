"use client";

import { IkonCetak } from "./Ikon";

export default function TombolCetak({ label = "Cetak laporan" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="tanpa-cetak inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
    >
      <IkonCetak ukuran={15} />
      {label}
    </button>
  );
}
