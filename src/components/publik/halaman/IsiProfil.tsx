import Link from "next/link";

import JudulBagian from "@/components/ui/JudulBagian";
import Paragraf from "@/components/ui/Paragraf";
import { db } from "@/lib/db";
import { angka } from "@/lib/format";
import { LEVEL_PENGURUS } from "@/lib/konstanta";
import { daftarRt, statistikWarga } from "@/lib/kueri";
import { ambilPengaturan } from "@/lib/pengaturan";
import { saringKontenRw } from "@/lib/rw";

import type { Lingkup } from "./lingkup";

/**
 * Profil — dipakai `/profil` (kampung) dan `/rw/[n]/profil`.
 *
 * Sejarah, visi, dan misi diambil dari RW yang sedang dibuka; pada halaman
 * kampung diambil dari Pengaturan. Struktur pengurus RW ditambah pengurus
 * tingkat kampung, karena mereka memang membawahi RW ini juga.
 */
export default async function IsiProfil({ lingkup }: { lingkup: Lingkup }) {
  const rwId = lingkup.rw?.id ?? null;

  const [pengaturan, rwPenuh, pengurus, rtList, statistik] = await Promise.all([
    ambilPengaturan(),
    rwId === null ? Promise.resolve(null) : db.rw.findUnique({ where: { id: rwId } }),
    db.pengurus.findMany({
      where: saringKontenRw(rwId),
      orderBy: [{ level: "asc" }, { urutan: "asc" }],
      include: { rt: { select: { nomor: true } }, rw: { select: { nama: true } } },
    }),
    daftarRt(rwId),
    statistikWarga(undefined, rwId),
  ]);

  // Sumber teks profil: RW yang dibuka, atau kampung bila tidak ada RW.
  const profil = rwPenuh ?? pengaturan;
  const tagline = profil.tagline;
  const misi = profil.misi.split("\n").map((m) => m.trim()).filter(Boolean);

  const pengurusRw = pengurus.filter(
    (p) => p.level === LEVEL_PENGURUS.RW || p.level === LEVEL_PENGURUS.KAMPUNG,
  );
  const pengurusRt = pengurus.filter((p) => p.level === LEVEL_PENGURUS.RT);

  return (
    <>
      <section className="bidang-hijau text-white">
        <div className="motif-kawung mx-auto max-w-5xl px-4 py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">
            {pengaturan.namaKampung} · Kelurahan {pengaturan.kelurahan}
          </p>
          <h1 className="judul mt-3 text-[2.2rem] text-white sm:text-[3rem]">
            {lingkup.rw ? lingkup.nama : pengaturan.namaKampung}
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-brand-100">
            {tagline}
          </p>
          <dl className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: "Rukun Tetangga", v: angka(rtList.length) },
              { l: "Kepala Keluarga", v: angka(statistik.totalKk) },
              { l: "Jumlah Jiwa", v: angka(statistik.totalJiwa) },
              {
                l: lingkup.rw ? "Pengurus RW" : "Rukun Warga",
                v: angka(lingkup.rw ? pengurusRw.length : 3),
              },
            ].map((s) => (
              <div key={s.l} className="border-t border-white/25 pt-3 text-left">
                <dd className="judul angka-kas text-[1.6rem]">{s.v}</dd>
                <dt className="mt-1 text-[12px] text-brand-200">{s.l}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-16">
        {/* Sejarah */}
        {profil.sejarah && (
          <section className="mb-16">
            <JudulBagian
              kicker="Riwayat"
              judul={lingkup.rw ? `Sejarah Singkat ${lingkup.nama}` : "Sejarah Singkat Kampung"}
            />
            <div className="rounded-2xl border border-garis bg-white p-6 sm:p-8">
              <Paragraf teks={profil.sejarah} />
            </div>
          </section>
        )}

        {/* Visi misi */}
        <section className="mb-16 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-brand-100 bg-brand-50 p-6 sm:p-8">
            <h2 className="judul text-sm text-brand-700">Visi</h2>
            <p className="mt-4 text-lg font-medium leading-relaxed text-brand-900">
              {profil.visi || "Visi belum diisi."}
            </p>
          </div>
          <div className="rounded-2xl border border-garis bg-white p-6 sm:p-8">
            <h2 className="judul text-sm text-brand-700">Misi</h2>
            <ol className="mt-4 space-y-3">
              {misi.length === 0 && <li className="text-sm text-slate-500">Misi belum diisi.</li>}
              {misi.map((m, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-700">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                    {i + 1}
                  </span>
                  {m}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Struktur pengurus */}
        <section className="mb-16">
          <JudulBagian
            kicker="Kepengurusan"
            judul={lingkup.rw ? `Struktur Organisasi ${lingkup.nama}` : "Struktur Organisasi"}
            keterangan={
              pengurusRw[0]?.periode ? `Masa bakti ${pengurusRw[0].periode}.` : undefined
            }
          />
          {pengurusRw.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-garis px-5 py-10 text-center text-sm text-slate-500">
              Struktur pengurus belum diisi.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pengurusRw.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-4 rounded-2xl border border-garis bg-white p-4 shadow-sm"
                >
                  {p.foto ? (
                    <img
                      src={p.foto}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-brand-100 text-lg font-bold text-brand-700">
                      {p.nama
                        .split(" ")
                        .filter((k) => k.length > 2)
                        .slice(0, 2)
                        .map((k) => k[0])
                        .join("")}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">{p.nama}</p>
                    <p className="mt-0.5 text-xs font-medium text-brand-700">
                      {p.jabatan}
                      {!lingkup.rw && p.rw ? ` · ${p.rw.nama}` : ""}
                      {p.level === LEVEL_PENGURUS.KAMPUNG ? " · tingkat kampung" : ""}
                    </p>
                    {p.telepon && <p className="mt-1 text-xs text-slate-500">{p.telepon}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Daftar RT */}
        <section className="mb-16">
          <JudulBagian
            kicker="Wilayah"
            judul={lingkup.rw ? `Rukun Tetangga di ${lingkup.nama}` : "Rukun Tetangga se-Kampung"}
            keterangan="Setiap RT dipimpin seorang Ketua RT dan memiliki bendahara yang mengelola kas RT."
          />
          <div className="overflow-x-auto gulir-halus rounded-2xl border border-garis bg-white">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="bg-kertas text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">RT</th>
                  {!lingkup.rw && <th className="px-4 py-3 font-semibold">RW</th>}
                  <th className="px-4 py-3 font-semibold">Ketua RT</th>
                  <th className="px-4 py-3 font-semibold">Cakupan Wilayah</th>
                  <th className="px-4 py-3 text-right font-semibold">KK</th>
                  <th className="px-4 py-3 text-right font-semibold">Jiwa</th>
                </tr>
              </thead>
              <tbody>
                {rtList.map((rt) => {
                  // Nomor RT berulang antar-RW, jadi ketua RT dicocokkan lewat
                  // id RT-nya, bukan nomornya.
                  const ketua = pengurusRt.find((p) => p.rtId === rt.id);
                  const jiwa = statistik.perRt.find((s) => s.rtId === rt.id)?.nilai ?? 0;
                  const kk = statistik.kkPerRt.find((s) => s.rtId === rt.id)?.nilai ?? 0;
                  return (
                    <tr key={rt.id} className="border-t border-garis">
                      <td className="px-4 py-3 font-semibold text-slate-900">RT {rt.nomor}</td>
                      {!lingkup.rw && (
                        <td className="px-4 py-3 text-slate-600">
                          <Link
                            href={`/rw/${rt.rw.nomor}`}
                            className="underline-offset-4 hover:text-brand-700 hover:underline"
                          >
                            {rt.rw.nama}
                          </Link>
                        </td>
                      )}
                      <td className="px-4 py-3 text-slate-700">{ketua?.nama ?? "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{rt.wilayah ?? "-"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                        {angka(kk)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                        {angka(jiwa)}
                      </td>
                    </tr>
                  );
                })}
                {rtList.length === 0 && (
                  <tr>
                    <td
                      colSpan={lingkup.rw ? 5 : 6}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      Daftar RT belum diisi pengurus.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Kontak */}
        <section>
          <JudulBagian
            kicker="Hubungi Kami"
            judul={lingkup.rw ? `Sekretariat ${lingkup.nama}` : "Sekretariat Kampung"}
          />
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              { label: "Alamat", isi: profil.alamat || pengaturan.alamat || "-" },
              { label: "Telepon", isi: profil.telepon || pengaturan.telepon || "-" },
              { label: "Surel", isi: profil.email || pengaturan.email || "-" },
            ].map((k) => (
              <div key={k.label} className="rounded-2xl border border-garis bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {k.label}
                </p>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-800">
                  {k.isi}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
