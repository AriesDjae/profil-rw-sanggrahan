import { redirect } from "next/navigation";

import KepalaHalaman from "@/components/admin/KepalaHalaman";
import { db } from "@/lib/db";
import { hitungRingkasan } from "@/lib/keuangan";
import { PERAN } from "@/lib/konstanta";
import { lingkupRw, wajibMasuk } from "@/lib/otorisasi";

import FormLaporanBaru from "./FormLaporanBaru";

export const dynamic = "force-dynamic";

export const metadata = { title: "Buat Laporan Kas" };

export default async function BuatLaporan() {
  const pengguna = await wajibMasuk();

  if (pengguna.peran !== PERAN.BENDAHARA_RT && pengguna.peran !== PERAN.ADMIN) {
    redirect("/admin?galat=akses");
  }

  // Hanya ADMIN yang sampai ke daftar ini; bendahara RT langsung terkunci pada
  // RT-nya. Tetap disaring per RW supaya daftarnya tidak mencampur tiga RW
  // dengan nomor RT yang sama.
  const rwSaya = lingkupRw(pengguna);
  const rtList = await db.rt.findMany({
    where: rwSaya === null ? {} : { rwId: rwSaya },
    orderBy: [{ rwId: "asc" }, { nomor: "asc" }],
    include: { rw: { select: { nama: true } } },
  });

  // Usulan saldo awal dari laporan terakhir RT yang bersangkutan
  let saldoUsulan = 0;
  if (pengguna.rtId) {
    const terakhir = await db.laporanKeuangan.findFirst({
      where: { rtId: pengguna.rtId },
      orderBy: [{ tahun: "desc" }, { bulan: "desc" }],
      include: { transaksi: { select: { jenis: true, jumlah: true } } },
    });
    if (terakhir) {
      saldoUsulan = hitungRingkasan(terakhir.transaksi, terakhir.saldoAwal).saldoAkhir;
    }
  }

  const kini = new Date();

  return (
    <div className="max-w-2xl">
      <KepalaHalaman
        judul="Buat Laporan Kas"
        keterangan="Satu laporan mewakili satu periode bulanan untuk satu RT. Setelah dibuat, tambahkan rincian transaksi lalu ajukan ke Ketua RT."
        kembali={{ href: "/admin/keuangan", label: "Kembali ke daftar laporan" }}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <FormLaporanBaru
          rtList={rtList.map((r) => ({ id: r.id, nama: `${r.nama} · ${r.rw.nama}` }))}
          rtTerkunci={
            pengguna.rt ? { id: pengguna.rt.id, nama: pengguna.rt.nama } : null
          }
          saldoUsulan={saldoUsulan}
          bulanUsulan={kini.getMonth() + 1}
          tahunUsulan={kini.getFullYear()}
        />
      </div>
    </div>
  );
}
