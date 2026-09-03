import Link from "next/link";

import KepalaHalaman from "@/components/admin/KepalaHalaman";
import { Lencana } from "@/components/ui/LencanaStatus";
import Kosong from "@/components/ui/Kosong";
import { db } from "@/lib/db";
import { tanggalSingkat } from "@/lib/format";
import { PERAN_KONTEN, STATUS_KONTEN } from "@/lib/konstanta";
import { wajibPeran } from "@/lib/otorisasi";

import { ubahStatusBerita } from "./aksi";

export const dynamic = "force-dynamic";
export const metadata = { title: "Berita" };

export default async function DaftarBeritaAdmin({
  searchParams,
}: {
  searchParams: Promise<{ pesan?: string; status?: string }>;
}) {
  await wajibPeran(PERAN_KONTEN);
  const sp = await searchParams;

  const berita = await db.berita.findMany({
    where: sp.status ? { status: sp.status } : undefined,
    orderBy: { updatedAt: "desc" },
    include: { penulis: { select: { nama: true } } },
    take: 100,
  });

  return (
    <>
      <KepalaHalaman
        judul="Berita"
        keterangan="Kelola kabar yang tampil di situs warga. Berita berstatus draf tidak terlihat publik."
        aksi={
          <Link
            href="/admin/berita/baru"
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Tulis berita
          </Link>
        }
      />

      {sp.pesan && (
        <p className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {sp.pesan}
        </p>
      )}

      <div className="mb-5 flex flex-wrap gap-2">
        {[
          { nilai: undefined, label: "Semua" },
          { nilai: STATUS_KONTEN.TERBIT, label: "Terbit" },
          { nilai: STATUS_KONTEN.DRAFT, label: "Draf" },
        ].map((f) => (
          <Link
            key={f.label}
            href={f.nilai ? `/admin/berita?status=${f.nilai}` : "/admin/berita"}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              sp.status === f.nilai
                ? "bg-brand-600 text-white"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {berita.length === 0 ? (
        <Kosong
          judul="Belum ada berita"
          keterangan="Mulai dengan menulis kabar pertama untuk warga."
          aksi={
            <Link
              href="/admin/berita/baru"
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Tulis berita
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <ul className="divide-y divide-slate-100">
            {berita.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
                {b.gambar ? (
                  <img
                    src={b.gambar}
                    alt=""
                    className="h-16 w-24 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="h-16 w-24 shrink-0 rounded-lg bg-gradient-to-br from-brand-600 to-brand-400" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Lencana
                      anak={b.kategori}
                      warna="bg-slate-100 text-slate-600 ring-slate-200"
                    />
                    <Lencana
                      anak={b.status === STATUS_KONTEN.TERBIT ? "Terbit" : "Draf"}
                      warna={
                        b.status === STATUS_KONTEN.TERBIT
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-amber-50 text-amber-800 ring-amber-200"
                      }
                    />
                  </div>
                  <p className="mt-1.5 truncate font-semibold text-slate-900">{b.judul}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {b.penulis?.nama ?? "-"} · diperbarui {tanggalSingkat(b.updatedAt)} ·{" "}
                    {b.dilihat} kali dibaca
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <form action={ubahStatusBerita}>
                    <input type="hidden" name="id" value={b.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      {b.status === STATUS_KONTEN.TERBIT ? "Jadikan draf" : "Terbitkan"}
                    </button>
                  </form>
                  {b.status === STATUS_KONTEN.TERBIT && (
                    <Link
                      href={`/berita/${b.slug}`}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      Lihat
                    </Link>
                  )}
                  <Link
                    href={`/admin/berita/${b.id}`}
                    className="rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
                  >
                    Sunting
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
