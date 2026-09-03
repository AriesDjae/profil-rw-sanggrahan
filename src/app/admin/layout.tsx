import type { Metadata } from "next";

import Sidebar, { type ItemMenu } from "@/components/admin/Sidebar";
import { db } from "@/lib/db";
import { LABEL_PERAN, PERAN, STATUS_LAPORAN } from "@/lib/konstanta";
import { wajibMasuk } from "@/lib/otorisasi";

import { keluar } from "../masuk/aksi";

export const metadata: Metadata = {
  title: { default: "Panel Pengurus", template: "%s | Panel Pengurus" },
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const pengguna = await wajibMasuk("/admin");

  const bolehKonten = ([PERAN.ADMIN, PERAN.SEKRETARIS, PERAN.KETUA_RW] as string[]).includes(
    pengguna.peran,
  );
  const bolehKelola = ([PERAN.ADMIN, PERAN.KETUA_RW] as string[]).includes(pengguna.peran);
  const ketuaRt = pengguna.peran === PERAN.KETUA_RT;
  const bendahara = pengguna.peran === PERAN.BENDAHARA_RT;

  // Jumlah laporan yang menunggu tindakan pengguna ini
  let menunggu = 0;
  if (ketuaRt && pengguna.rtId) {
    menunggu = await db.laporanKeuangan.count({
      where: { rtId: pengguna.rtId, status: STATUS_LAPORAN.DIAJUKAN },
    });
  } else if (pengguna.peran === PERAN.KETUA_RW || pengguna.peran === PERAN.ADMIN) {
    menunggu = await db.laporanKeuangan.count({
      where: { status: STATUS_LAPORAN.DIVERIFIKASI_RT },
    });
  }

  const menu: ItemMenu[] = [{ href: "/admin", label: "Dasbor", ikon: "dasbor" }];

  if (ketuaRt || pengguna.peran === PERAN.KETUA_RW || pengguna.peran === PERAN.ADMIN) {
    menu.push({
      href: "/admin/persetujuan",
      label: "Persetujuan",
      ikon: "persetujuan",
      lencana: menunggu || undefined,
    });
  }

  menu.push({ href: "/admin/keuangan", label: "Kas & Laporan", ikon: "uang" });

  if (bolehKonten) {
    menu.push(
      { href: "/admin/berita", label: "Berita", ikon: "berita" },
      { href: "/admin/kegiatan", label: "Kegiatan", ikon: "kalender" },
      { href: "/admin/pengumuman", label: "Pengumuman", ikon: "megafon" },
      { href: "/admin/galeri", label: "Galeri", ikon: "foto" },
    );
  }

  if (bolehKonten || ketuaRt) {
    menu.push({ href: "/admin/warga", label: "Data Warga", ikon: "warga" });
  }

  if (bolehKonten) {
    menu.push({ href: "/admin/pengurus", label: "Pengurus", ikon: "pengurus" });
  }

  if (bolehKelola) {
    menu.push(
      { href: "/admin/pengguna", label: "Akun Pengguna", ikon: "warga" },
      { href: "/admin/pengaturan", label: "Pengaturan", ikon: "pengaturan" },
    );
  }

  const lingkup = pengguna.rt ? pengguna.rt.nama : "Seluruh RW";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">
      <Sidebar
        menu={menu}
        nama={pengguna.nama}
        peran={LABEL_PERAN[pengguna.peran] ?? pengguna.peran}
        lingkup={lingkup}
      />

      <div className="min-w-0 flex-1">
        <header className="hidden items-center justify-between border-b border-slate-200 bg-white px-8 py-4 lg:flex">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Selamat datang, {pengguna.nama.split(" ")[0]}
            </p>
            <p className="text-xs text-slate-500">
              {LABEL_PERAN[pengguna.peran] ?? pengguna.peran}
              {pengguna.rt ? ` · ${pengguna.rt.nama}` : " · Lingkup seluruh RW"}
              {bendahara ? " · Penyusun laporan kas" : ""}
            </p>
          </div>
          <form action={keluar}>
            <button
              type="submit"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Keluar
            </button>
          </form>
        </header>

        <div className="p-5 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
