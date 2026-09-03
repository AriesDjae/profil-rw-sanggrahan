"use client";

/**
 * Tombol hapus dengan konfirmasi peramban. Dipakai di dalam <form action={...}>
 * agar penghapusan tetap berjalan lewat server action.
 */
export default function TombolHapus({
  pesan = "Hapus data ini? Tindakan ini tidak dapat dibatalkan.",
  label = "Hapus",
  kecil = false,
}: {
  pesan?: string;
  label?: string;
  kecil?: boolean;
}) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(pesan)) e.preventDefault();
      }}
      className={
        kecil
          ? "rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
          : "rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
      }
    >
      {label}
    </button>
  );
}
