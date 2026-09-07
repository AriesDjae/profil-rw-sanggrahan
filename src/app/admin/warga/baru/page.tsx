import { redirect } from "next/navigation";

import KepalaHalaman from "@/components/admin/KepalaHalaman";
import { db } from "@/lib/db";
import { PERAN } from "@/lib/konstanta";
import { lingkupRw, wajibMasuk } from "@/lib/otorisasi";

import FormWarga from "../FormWarga";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tambah Warga" };

export default async function WargaBaru() {
  const pengguna = await wajibMasuk();
  const boleh = ([PERAN.ADMIN, PERAN.SEKRETARIS, PERAN.KETUA_RW, PERAN.KETUA_RT] as string[]).includes(
    pengguna.peran,
  );
  if (!boleh) redirect("/admin?galat=akses");

  const rwSaya = lingkupRw(pengguna);
  const rtMentah = await db.rt.findMany({
    where: rwSaya === null ? {} : { rwId: rwSaya },
    orderBy: [{ rwId: "asc" }, { nomor: "asc" }],
    include: { rw: { select: { nama: true } } },
  });
  // Nama RT sudah memuat RW-nya ("RT 01 / RW 02"), tetapi hanya administrator
  // kampung yang perlu membedakannya — pengurus RW hanya melihat RW-nya sendiri.
  const rtList = rtMentah.map((r) => ({
    id: r.id,
    nama: rwSaya === null ? r.nama : `RT ${r.nomor}`,
  }));

  return (
    <div className="max-w-3xl">
      <KepalaHalaman
        judul="Tambah Data Warga"
        keterangan="Isi selengkap mungkin. Data pribadi hanya terlihat oleh pengurus, tidak dipublikasikan ke halaman warga."
        kembali={{ href: "/admin/warga", label: "Kembali ke data warga" }}
      />
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <FormWarga
          awal={null}
          rtList={rtList}
          rtTerkunci={
            pengguna.peran === PERAN.KETUA_RT && pengguna.rt
              ? { id: pengguna.rt.id, nama: pengguna.rt.nama }
              : null
          }
        />
      </div>
    </div>
  );
}
