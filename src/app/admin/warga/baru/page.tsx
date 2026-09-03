import { redirect } from "next/navigation";

import KepalaHalaman from "@/components/admin/KepalaHalaman";
import { db } from "@/lib/db";
import { PERAN } from "@/lib/konstanta";
import { wajibMasuk } from "@/lib/otorisasi";

import FormWarga from "../FormWarga";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tambah Warga" };

export default async function WargaBaru() {
  const pengguna = await wajibMasuk();
  const boleh = ([PERAN.ADMIN, PERAN.SEKRETARIS, PERAN.KETUA_RW, PERAN.KETUA_RT] as string[]).includes(
    pengguna.peran,
  );
  if (!boleh) redirect("/admin?galat=akses");

  const rtList = await db.rt.findMany({ orderBy: { nomor: "asc" } });

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
          rtList={rtList.map((r) => ({ id: r.id, nama: r.nama }))}
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
