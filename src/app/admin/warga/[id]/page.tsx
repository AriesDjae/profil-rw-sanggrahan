import { notFound, redirect } from "next/navigation";

import KepalaHalaman from "@/components/admin/KepalaHalaman";
import TombolHapus from "@/components/admin/TombolHapus";
import { db } from "@/lib/db";
import { untukInputTanggal } from "@/lib/format";
import { PERAN } from "@/lib/konstanta";
import { lingkupRt, lingkupRw, wajibMasuk } from "@/lib/otorisasi";

import { hapusWarga } from "../aksi";
import FormWarga from "../FormWarga";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sunting Data Warga" };

export default async function SuntingWarga({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const pengguna = await wajibMasuk();
  const boleh = ([PERAN.ADMIN, PERAN.SEKRETARIS, PERAN.KETUA_RW, PERAN.KETUA_RT] as string[]).includes(
    pengguna.peran,
  );
  if (!boleh) redirect("/admin?galat=akses");

  const { id } = await params;
  const warga = await db.warga.findUnique({
    where: { id: Number(id) },
    include: { rt: { select: { rwId: true } } },
  });
  if (!warga) notFound();

  const lingkup = lingkupRt(pengguna);
  if (lingkup && warga.rtId !== lingkup) redirect("/admin?galat=akses");

  // Pemeriksaan RW tidak boleh dilewat hanya karena perannya tidak terikat RT.
  // Sekretaris dan Ketua RW tidak punya lingkup RT, jadi tanpa baris ini
  // mereka dapat membuka berkas warga RW lain — lengkap dengan NIK, nomor KK,
  // dan alamatnya — cukup dengan menebak angka pada alamat halaman.
  const rwSaya = lingkupRw(pengguna);
  if (rwSaya !== null && warga.rt.rwId !== rwSaya) redirect("/admin?galat=akses");

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
        judul="Sunting Data Warga"
        keterangan={warga.nama}
        kembali={{ href: "/admin/warga", label: "Kembali ke data warga" }}
        aksi={
          <form action={hapusWarga}>
            <input type="hidden" name="id" value={warga.id} />
            <TombolHapus label="Hapus data" pesan="Hapus data warga ini secara permanen?" />
          </form>
        }
      />
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <FormWarga
          awal={{
            id: warga.id,
            nama: warga.nama,
            nik: warga.nik,
            noKk: warga.noKk,
            jenisKelamin: warga.jenisKelamin,
            tempatLahir: warga.tempatLahir,
            tanggalLahir: untukInputTanggal(warga.tanggalLahir),
            agama: warga.agama,
            pendidikan: warga.pendidikan,
            pekerjaan: warga.pekerjaan,
            statusPerkawinan: warga.statusPerkawinan,
            hubungan: warga.hubungan,
            alamat: warga.alamat,
            rtId: warga.rtId,
          }}
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
