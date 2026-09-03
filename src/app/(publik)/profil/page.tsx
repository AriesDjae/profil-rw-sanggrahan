import type { Metadata } from "next";

import JudulBagian from "@/components/ui/JudulBagian";
import Paragraf from "@/components/ui/Paragraf";
import { db } from "@/lib/db";
import { angka } from "@/lib/format";
import { daftarRt, statistikWarga } from "@/lib/kueri";
import { ambilPengaturan } from "@/lib/pengaturan";

export const metadata: Metadata = {
  title: "Profil & Struktur Organisasi",
  description:
    "Sejarah, visi misi, wilayah, dan struktur kepengurusan RW 05 Sanggrahan beserta ketua RT.",
};

export const dynamic = "force-dynamic";

export default async function HalamanProfil() {
  const [pengaturan, pengurus, rtList, statistik] = await Promise.all([
    ambilPengaturan(),
    db.pengurus.findMany({
      orderBy: [{ level: "asc" }, { urutan: "asc" }],
      include: { rt: { select: { nomor: true } } },
    }),
    daftarRt(),
    statistikWarga(),
  ]);

  const pengurusRw = pengurus.filter((p) => p.level === "RW");
  const pengurusRt = pengurus.filter((p) => p.level === "RT");
  const misi = pengaturan.misi.split("\n").map((m) => m.trim()).filter(Boolean);

  return (
    <>
      <section className="bidang-hijau text-white">
        <div className="motif-kawung mx-auto max-w-5xl px-4 py-16 text-center">
          <h1 className="judul text-[2.2rem] text-white sm:text-[3rem]">
            {pengaturan.namaRw}
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-brand-100">
            {pengaturan.tagline}
          </p>
          <dl className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: "Rukun Tetangga", v: angka(rtList.length) },
              { l: "Kepala Keluarga", v: angka(statistik.totalKk) },
              { l: "Jumlah Jiwa", v: angka(statistik.totalJiwa) },
              { l: "Pengurus RW", v: angka(pengurusRw.length) },
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
        {pengaturan.sejarah && (
          <section className="mb-16">
            <JudulBagian kicker="Riwayat" judul="Sejarah Singkat Kampung" />
            <div className="rounded-2xl border border-garis bg-white p-6 sm:p-8">
              <Paragraf teks={pengaturan.sejarah} />
            </div>
          </section>
        )}

        {/* Visi misi */}
        <section className="mb-16 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-brand-100 bg-brand-50 p-6 sm:p-8">
            <h2 className="judul text-sm text-brand-700">Visi</h2>
            <p className="mt-4 text-lg font-medium leading-relaxed text-brand-900">
              {pengaturan.visi || "Visi belum diisi."}
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

        {/* Struktur pengurus RW */}
        <section className="mb-16">
          <JudulBagian
            kicker="Kepengurusan"
            judul="Struktur Organisasi RW"
            keterangan={
              pengurusRw[0]?.periode
                ? `Masa bakti ${pengurusRw[0].periode}.`
                : undefined
            }
          />
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
                  <p className="mt-0.5 text-xs font-medium text-brand-700">{p.jabatan}</p>
                  {p.telepon && <p className="mt-1 text-xs text-slate-500">{p.telepon}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Daftar RT */}
        <section className="mb-16">
          <JudulBagian
            kicker="Wilayah"
            judul="Rukun Tetangga di RW 05"
            keterangan="Setiap RT dipimpin seorang Ketua RT dan memiliki bendahara yang mengelola kas RT."
          />
          <div className="overflow-x-auto gulir-halus rounded-2xl border border-garis bg-white">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="bg-kertas text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">RT</th>
                  <th className="px-4 py-3 font-semibold">Ketua RT</th>
                  <th className="px-4 py-3 font-semibold">Cakupan Wilayah</th>
                  <th className="px-4 py-3 text-right font-semibold">KK</th>
                  <th className="px-4 py-3 text-right font-semibold">Jiwa</th>
                </tr>
              </thead>
              <tbody>
                {rtList.map((rt) => {
                  const ketua = pengurusRt.find((p) => p.rt?.nomor === rt.nomor);
                  const jiwa =
                    statistik.perRt.find((s) => s.label === `RT ${rt.nomor}`)?.nilai ?? 0;
                  const kk =
                    statistik.kkPerRt.find((s) => s.label === `RT ${rt.nomor}`)?.nilai ?? 0;
                  return (
                    <tr key={rt.id} className="border-t border-garis">
                      <td className="px-4 py-3 font-semibold text-slate-900">RT {rt.nomor}</td>
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
              </tbody>
            </table>
          </div>
        </section>

        {/* Kontak */}
        <section>
          <JudulBagian kicker="Hubungi Kami" judul="Sekretariat RW" />
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              { label: "Alamat", isi: pengaturan.alamat || "-" },
              { label: "Telepon", isi: pengaturan.telepon || "-" },
              { label: "Surel", isi: pengaturan.email || "-" },
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
