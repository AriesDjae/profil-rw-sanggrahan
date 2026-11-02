/** Kerangka abu-abu saat isi halaman dimuat. Tidak berdenyut bila pengguna mematikan animasi. */
export default function KerangkaMuat() {
  return (
    <div role="status" data-kerangka-muat className="mx-auto max-w-6xl px-4 py-12">
      <span className="sr-only">Memuat halaman…</span>
      <div aria-hidden className="motion-safe:animate-pulse">
        <div className="h-3.5 w-28 rounded bg-slate-200" />
        <div className="mt-4 h-9 w-72 max-w-full rounded bg-slate-200" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-200/70" />

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className={n === 3 ? "hidden lg:block" : ""}>
              <div className="aspect-[16/10] rounded-xl bg-slate-200" />
              <div className="mt-4 h-4 w-4/5 rounded bg-slate-200" />
              <div className="mt-2 h-4 w-3/5 rounded bg-slate-200/70" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
