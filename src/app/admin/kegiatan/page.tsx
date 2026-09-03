import Link from "next/link";

import KepalaHalaman from "@/components/admin/KepalaHalaman";
import { Lencana } from "@/components/ui/LencanaStatus";
import Kosong from "@/components/ui/Kosong";
import { db } from "@/lib/db";
import { hitungMundur, jam, tanggalSingkat } from "@/lib/format";
import { PERAN_KONTEN } from "@/lib/konstanta";
import { wajibPeran } from "@/lib/otorisasi";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kegiatan" };

const WARNA_STATUS: Record<string, string> = {
  DRAFT: "bg-amber-50 text-amber-800 ring-amber-200",
  TERBIT: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  SELESAI: "bg-slate-100 text-slate-600 ring-slate-200",
  BATAL: "bg-rose-50 text-rose-700 ring-rose-200",
};

const LABEL_STATUS: Record<string, string> = {
  DRAFT: "Draf",
  TERBIT: "Terbit",
  SELESAI: "Selesai",
  BATAL: "Batal",
};

export default async function DaftarKegiatanAdmin({
  searchParams,
}: {
  searchParams: Promise<{ pesan?: string }>;
}) {
  await wajibPeran(PERAN_KONTEN);
  const sp = await searchParams;

  const kegiatan = await db.kegiatan.findMany({
    orderBy: { mulai: "desc" },
    take: 100,
  });

  const awalHariIni = new Date();
  awalHariIni.setHours(0, 0, 0, 0);
  const mendatang = kegiatan.filter((k) => new Date(k.mulai) >= awalHariIni);
  const lampau = kegiatan.filter((k) => new Date(k.mulai) < awalHariIni);

  const Baris = ({ k }: { k: (typeof kegiatan)[number] }) => (
    <li className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-brand-50 text-center text-brand-800">
        <div>
          <p className="text-base font-bold leading-none">{new Date(k.mulai).getDate()}</p>
          <p className="text-[10px] font-semibold uppercase">
            {new Date(k.mulai).toLocaleDateString("id-ID", { month: "short" })}
          </p>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Lencana anak={k.kategori} warna="bg-slate-100 text-slate-600 ring-slate-200" />
          <Lencana
            anak={LABEL_STATUS[k.status] ?? k.status}
            warna={WARNA_STATUS[k.status] ?? "bg-slate-100 text-slate-600 ring-slate-200"}
          />
        </div>
        <p className="mt-1.5 truncate font-semibold text-slate-900">{k.judul}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {tanggalSingkat(k.mulai)} pukul {jam(k.mulai)} · {k.lokasi} ·{" "}
          {hitungMundur(k.mulai)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {k.status === "TERBIT" && (
          <Link
            href={`/kegiatan/${k.slug}`}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Lihat
          </Link>
        )}
        <Link
          href={`/admin/kegiatan/${k.id}`}
          className="rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
        >
          Sunting
        </Link>
      </div>
    </li>
  );

  return (
    <>
      <KepalaHalaman
        judul="Agenda Kegiatan"
        keterangan="Kelola jadwal kegiatan warga. Hanya kegiatan berstatus terbit yang tampil pada agenda publik."
        aksi={
          <Link
            href="/admin/kegiatan/baru"
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Jadwalkan kegiatan
          </Link>
        }
      />

      {sp.pesan && (
        <p className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {sp.pesan}
        </p>
      )}

      {kegiatan.length === 0 ? (
        <Kosong
          judul="Belum ada kegiatan"
          keterangan="Jadwalkan kegiatan pertama agar warga dapat melihatnya di agenda."
          aksi={
            <Link
              href="/admin/kegiatan/baru"
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Jadwalkan kegiatan
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
              Akan datang ({mendatang.length})
            </h2>
            {mendatang.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500">
                Tidak ada kegiatan yang dijadwalkan ke depan.
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <ul className="divide-y divide-slate-100">
                  {mendatang.map((k) => (
                    <Baris key={k.id} k={k} />
                  ))}
                </ul>
              </div>
            )}
          </section>

          {lampau.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                Sudah berlangsung ({lampau.length})
              </h2>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <ul className="divide-y divide-slate-100">
                  {lampau.map((k) => (
                    <Baris key={k.id} k={k} />
                  ))}
                </ul>
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
