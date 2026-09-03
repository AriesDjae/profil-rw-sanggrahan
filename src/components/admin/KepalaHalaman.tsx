import Link from "next/link";

export default function KepalaHalaman({
  judul,
  keterangan,
  aksi,
  kembali,
}: {
  judul: string;
  keterangan?: string;
  aksi?: React.ReactNode;
  kembali?: { href: string; label: string };
}) {
  return (
    <div className="mb-8">
      {kembali && (
        <Link
          href={kembali.href}
          className="mb-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-brand-700"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          {kembali.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{judul}</h1>
          {keterangan && (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500">
              {keterangan}
            </p>
          )}
        </div>
        {aksi && <div className="flex shrink-0 flex-wrap gap-2">{aksi}</div>}
      </div>
    </div>
  );
}
