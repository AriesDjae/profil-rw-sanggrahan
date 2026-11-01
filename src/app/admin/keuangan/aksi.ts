"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { STATUS_DAPAT_DISUNTING, pindahStatusLaporan } from "@/lib/alurLaporan";
import { db } from "@/lib/db";
import { segarkanLamanRw } from "@/lib/rw";
import { nilaiForm, type HasilAksi } from "@/lib/formulir";
import { NAMA_BULAN, PERAN, STATUS_LAPORAN } from "@/lib/konstanta";
import {
  bolehSetujuiRw,
  bolehSuntingLaporan,
  bolehVerifikasiRt,
  wajibMasuk,
} from "@/lib/otorisasi";
import { simpanBerkas } from "@/lib/unggah";

export type Hasil = HasilAksi;

/** Masih di bawah batas kolom Int (32-bit), supaya galatnya bisa dibaca pengurus. */
const JUMLAH_MAKS = 2_000_000_000;

/** Pesan saat laporan sudah dipindahkan orang lain sebelum tombolnya ditekan. */
const GALAT_KEDULUAN = "Laporan baru saja diproses pengurus lain, silakan periksa statusnya";

/** Mengubah "1.500.000" atau "Rp 1.500.000" menjadi 1500000. */
function keAngka(nilai: FormDataEntryValue | null): number {
  const teks = String(nilai ?? "").replace(/[^0-9-]/g, "");
  const n = Number(teks);
  return Number.isFinite(n) ? n : 0;
}

async function segarkan(laporanId?: number) {
  revalidatePath("/admin/keuangan");
  revalidatePath("/admin/persetujuan");
  revalidatePath("/admin");
  revalidatePath("/keuangan");
  // Beranda tiap RW dibangun statis dengan masa berlaku lima menit. Tanpa baris
  // ini, pengurus yang baru menyimpan perubahan membuka laman RW-nya dan tidak
  // melihat apa-apa selama beberapa menit — lalu mengira simpanannya gagal.
  await segarkanLamanRw();

  if (laporanId) {
    revalidatePath(`/admin/keuangan/${laporanId}`);
    revalidatePath(`/keuangan/${laporanId}`);
  }
}

/* -------------------------------------------------------------------------- */
/* Penyusunan laporan (Bendahara RT)                                          */
/* -------------------------------------------------------------------------- */

export async function buatLaporan(_prev: Hasil, formData: FormData): Promise<Hasil> {
  const nilai = nilaiForm(formData);
  const pengguna = await wajibMasuk();

  const rtId =
    pengguna.peran === PERAN.ADMIN
      ? Number(formData.get("rtId"))
      : (pengguna.rtId ?? 0);

  if (!rtId) return { galat: "RT tujuan laporan belum dipilih.", nilai };
  if (!bolehSuntingLaporan(pengguna, rtId)) {
    return { galat: "Hanya bendahara RT bersangkutan yang dapat membuat laporan kas.", nilai };
  }

  const bulan = Number(formData.get("bulan"));
  const tahun = Number(formData.get("tahun"));
  if (!bulan || bulan < 1 || bulan > 12) return { galat: "Bulan tidak valid.", nilai };
  if (!tahun || tahun < 2000 || tahun > 2100) return { galat: "Tahun tidak valid.", nilai };

  const rt = await db.rt.findUnique({ where: { id: rtId } });
  if (!rt) return { galat: "Data RT tidak ditemukan.", nilai };

  const kembar = await db.laporanKeuangan.findFirst({
    where: { rtId, tahun, bulan },
  });
  if (kembar) {
    return {
      galat: `Laporan ${rt.nama} periode ${NAMA_BULAN[bulan - 1]} ${tahun} sudah ada. Silakan buka laporan tersebut.`,
      nilai,
    };
  }

  // Saldo awal diusulkan dari saldo akhir laporan sebelumnya bila kosong
  let saldoAwal = keAngka(formData.get("saldoAwal"));
  if (!formData.get("saldoAwal")) saldoAwal = 0;
  if (Math.abs(saldoAwal) > JUMLAH_MAKS) return { galat: "Saldo awal terlalu besar.", nilai };

  let laporan;
  try {
    // Pengecekan `kembar` di atas hanya untuk pesan yang ramah. Penjaga
    // sebenarnya adalah @@unique([rtId, tahun, bulan]) di basis data.
    laporan = await db.laporanKeuangan.create({
      data: {
        judul: `Laporan Kas ${rt.nama} - ${NAMA_BULAN[bulan - 1]} ${tahun}`,
        bulan,
        tahun,
        rtId,
        saldoAwal,
        status: STATUS_LAPORAN.DRAFT,
        catatan: String(formData.get("catatan") ?? "").trim() || null,
        dibuatOlehId: pengguna.id,
        riwayat: {
          create: { aksi: "BUAT", olehId: pengguna.id, catatan: "Laporan dibuat." },
        },
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { galat: "Laporan untuk periode ini baru saja dibuat.", nilai };
    }
    throw e;
  }

  await segarkan(laporan.id);
  redirect(`/admin/keuangan/${laporan.id}`);
}

export async function ubahLaporan(_prev: Hasil, formData: FormData): Promise<Hasil> {
  const nilai = nilaiForm(formData);
  const pengguna = await wajibMasuk();
  const id = Number(formData.get("id"));
  const laporan = await db.laporanKeuangan.findUnique({ where: { id } });
  if (!laporan) return { galat: "Laporan tidak ditemukan.", nilai };
  if (!bolehSuntingLaporan(pengguna, laporan.rtId)) {
    return { galat: "Anda tidak berhak mengubah laporan ini.", nilai };
  }
  if (
    laporan.status !== STATUS_LAPORAN.DRAFT &&
    laporan.status !== STATUS_LAPORAN.DITOLAK
  ) {
    return { galat: "Laporan yang sudah diajukan tidak dapat diubah.", nilai };
  }

  const saldoAwal = keAngka(formData.get("saldoAwal"));
  if (Math.abs(saldoAwal) > JUMLAH_MAKS) return { galat: "Saldo awal terlalu besar.", nilai };

  const { count } = await db.laporanKeuangan.updateMany({
    where: { id, status: { in: STATUS_DAPAT_DISUNTING } },
    data: {
      saldoAwal,
      catatan: String(formData.get("catatan") ?? "").trim() || null,
    },
  });
  if (count === 0) return { galat: "Laporan yang sudah diajukan tidak dapat diubah.", nilai };

  await segarkan(id);
  return { sukses: "Perubahan laporan tersimpan." };
}

export async function hapusLaporan(formData: FormData) {
  const pengguna = await wajibMasuk();
  const id = Number(formData.get("id"));
  const laporan = await db.laporanKeuangan.findUnique({ where: { id } });
  if (!laporan) return;
  if (!bolehSuntingLaporan(pengguna, laporan.rtId)) return;
  if (
    laporan.status !== STATUS_LAPORAN.DRAFT &&
    laporan.status !== STATUS_LAPORAN.DITOLAK
  ) {
    return;
  }

  const { count } = await db.laporanKeuangan.deleteMany({
    where: { id, status: { in: STATUS_DAPAT_DISUNTING } },
  });
  if (count === 0) return;

  await segarkan();
  redirect("/admin/keuangan?pesan=laporan-dihapus");
}

/* -------------------------------------------------------------------------- */
/* Transaksi                                                                   */
/* -------------------------------------------------------------------------- */

export async function tambahTransaksi(_prev: Hasil, formData: FormData): Promise<Hasil> {
  const nilai = nilaiForm(formData);
  const pengguna = await wajibMasuk();
  const laporanId = Number(formData.get("laporanId"));
  const laporan = await db.laporanKeuangan.findUnique({ where: { id: laporanId } });
  if (!laporan) return { galat: "Laporan tidak ditemukan.", nilai };
  if (!bolehSuntingLaporan(pengguna, laporan.rtId)) {
    return { galat: "Anda tidak berhak menambah transaksi pada laporan ini.", nilai };
  }
  if (
    laporan.status !== STATUS_LAPORAN.DRAFT &&
    laporan.status !== STATUS_LAPORAN.DITOLAK
  ) {
    return { galat: "Laporan sedang dalam proses persetujuan dan tidak dapat diubah.", nilai };
  }

  const jenis = String(formData.get("jenis"));
  if (jenis !== "PEMASUKAN" && jenis !== "PENGELUARAN") {
    return { galat: "Jenis transaksi tidak valid.", nilai };
  }

  const jumlah = keAngka(formData.get("jumlah"));
  if (jumlah <= 0) return { galat: "Jumlah transaksi harus lebih dari nol.", nilai };
  if (jumlah > JUMLAH_MAKS) return { galat: "Jumlah transaksi terlalu besar.", nilai };

  const keterangan = String(formData.get("keterangan") ?? "").trim();
  if (!keterangan) return { galat: "Keterangan transaksi wajib diisi.", nilai };

  const tanggalTeks = String(formData.get("tanggal") ?? "");
  const tanggal = tanggalTeks ? new Date(tanggalTeks) : new Date();
  if (Number.isNaN(tanggal.getTime())) return { galat: "Tanggal tidak valid.", nilai };

  let bukti: string | null = null;
  try {
    bukti = await simpanBerkas(formData.get("bukti") as File | null, "bukti");
  } catch (e) {
    return { galat: e instanceof Error ? e.message : "Gagal mengunggah bukti.", nilai };
  }

  try {
    await db.transaksi.create({
      data: {
        laporanId,
        tanggal,
        jenis,
        kategori: String(formData.get("kategori") ?? "Lain-lain"),
        keterangan,
        jumlah,
        bukti,
      },
    });
  } catch {
    // Laporan bisa saja diajukan di sela pemeriksaan di atas dan penulisan ini;
    // trigger basis data menolaknya.
    return { galat: "Laporan sedang dalam proses persetujuan dan tidak dapat diubah.", nilai };
  }

  await segarkan(laporanId);
  return { sukses: "Transaksi ditambahkan." };
}

export async function hapusTransaksi(formData: FormData) {
  const pengguna = await wajibMasuk();
  const id = Number(formData.get("id"));
  const transaksi = await db.transaksi.findUnique({
    where: { id },
    include: { laporan: true },
  });
  if (!transaksi) return;
  if (!bolehSuntingLaporan(pengguna, transaksi.laporan.rtId)) return;
  if (
    transaksi.laporan.status !== STATUS_LAPORAN.DRAFT &&
    transaksi.laporan.status !== STATUS_LAPORAN.DITOLAK
  ) {
    return;
  }

  try {
    await db.transaksi.delete({ where: { id } });
  } catch {
    return;
  }
  await segarkan(transaksi.laporanId);
}

/* -------------------------------------------------------------------------- */
/* Alur persetujuan berjenjang                                                 */
/* -------------------------------------------------------------------------- */

export async function ajukanLaporan(formData: FormData) {
  const pengguna = await wajibMasuk();
  const id = Number(formData.get("id"));
  const laporan = await db.laporanKeuangan.findUnique({
    where: { id },
    include: { _count: { select: { transaksi: true } } },
  });
  if (!laporan) return;
  if (!bolehSuntingLaporan(pengguna, laporan.rtId)) {
    redirect(`/admin/keuangan/${id}?galat=Anda tidak berhak mengajukan laporan ini`);
  }
  if (
    laporan.status !== STATUS_LAPORAN.DRAFT &&
    laporan.status !== STATUS_LAPORAN.DITOLAK
  ) {
    redirect(`/admin/keuangan/${id}?galat=Laporan sudah diajukan`);
  }
  if (laporan._count.transaksi === 0) {
    redirect(
      `/admin/keuangan/${id}?galat=Tambahkan minimal satu transaksi sebelum mengajukan laporan`,
    );
  }

  const berhasil = await pindahStatusLaporan(db, {
    id,
    dari: STATUS_DAPAT_DISUNTING,
    ke: STATUS_LAPORAN.DIAJUKAN,
    aksi: "AJUKAN",
    olehId: pengguna.id,
    catatan: "Laporan diajukan untuk diverifikasi Ketua RT.",
    syarat: { transaksi: { some: {} } },
    data: {
      diajukanAt: new Date(),
      // Bersihkan hasil pemeriksaan sebelumnya bila ini pengajuan ulang
      verifikasiRtOlehId: null,
      verifikasiRtAt: null,
      catatanRt: null,
      persetujuanRwOlehId: null,
      persetujuanRwAt: null,
      catatanRw: null,
    },
  });
  if (!berhasil) redirect(`/admin/keuangan/${id}?galat=${GALAT_KEDULUAN}`);

  await segarkan(id);
  redirect(`/admin/keuangan/${id}?pesan=Laporan berhasil diajukan ke Ketua RT`);
}

export async function verifikasiRt(formData: FormData) {
  const pengguna = await wajibMasuk();
  const id = Number(formData.get("id"));
  const catatan = String(formData.get("catatan") ?? "").trim();
  const laporan = await db.laporanKeuangan.findUnique({ where: { id } });
  if (!laporan) return;

  if (!bolehVerifikasiRt(pengguna, laporan.rtId)) {
    redirect(`/admin/keuangan/${id}?galat=Hanya Ketua RT bersangkutan yang dapat memverifikasi`);
  }
  if (laporan.status !== STATUS_LAPORAN.DIAJUKAN) {
    redirect(`/admin/keuangan/${id}?galat=Laporan tidak berada pada tahap verifikasi RT`);
  }

  const berhasil = await pindahStatusLaporan(db, {
    id,
    dari: [STATUS_LAPORAN.DIAJUKAN],
    ke: STATUS_LAPORAN.DIVERIFIKASI_RT,
    aksi: "VERIFIKASI_RT",
    olehId: pengguna.id,
    catatan: catatan,
    data: {
      verifikasiRtOlehId: pengguna.id,
      verifikasiRtAt: new Date(),
      catatanRt: catatan || null,
    },
  });
  if (!berhasil) redirect(`/admin/keuangan/${id}?galat=${GALAT_KEDULUAN}`);

  await segarkan(id);
  redirect(`/admin/keuangan/${id}?pesan=Laporan diteruskan ke Ketua RW`);
}

export async function tolakRt(formData: FormData) {
  const pengguna = await wajibMasuk();
  const id = Number(formData.get("id"));
  const catatan = String(formData.get("catatan") ?? "").trim();
  const laporan = await db.laporanKeuangan.findUnique({ where: { id } });
  if (!laporan) return;

  if (!bolehVerifikasiRt(pengguna, laporan.rtId)) {
    redirect(`/admin/keuangan/${id}?galat=Laporan ini berada di luar RW Anda`);
  }
  if (laporan.status !== STATUS_LAPORAN.DIAJUKAN) {
    redirect(`/admin/keuangan/${id}?galat=Laporan tidak berada pada tahap verifikasi RT`);
  }
  if (!catatan) {
    redirect(`/admin/keuangan/${id}?galat=Isi alasan pengembalian agar bendahara dapat merevisi`);
  }

  const berhasil = await pindahStatusLaporan(db, {
    id,
    dari: [STATUS_LAPORAN.DIAJUKAN],
    ke: STATUS_LAPORAN.DITOLAK,
    aksi: "TOLAK_RT",
    olehId: pengguna.id,
    catatan: catatan,
    data: {
      verifikasiRtOlehId: pengguna.id,
      verifikasiRtAt: new Date(),
      catatanRt: catatan,
    },
  });
  if (!berhasil) redirect(`/admin/keuangan/${id}?galat=${GALAT_KEDULUAN}`);

  await segarkan(id);
  redirect(`/admin/keuangan/${id}?pesan=Laporan dikembalikan kepada bendahara`);
}

export async function setujuiRw(formData: FormData) {
  const pengguna = await wajibMasuk();
  const id = Number(formData.get("id"));
  const catatan = String(formData.get("catatan") ?? "").trim();
  const laporan = await db.laporanKeuangan.findUnique({
    where: { id },
    include: { rt: { select: { rwId: true } } },
  });
  if (!laporan) return;

  if (!bolehSetujuiRw(pengguna, laporan.rt.rwId)) {
    redirect(
      `/admin/keuangan/${id}?galat=Persetujuan akhir hanya diberikan Ketua RW yang menaungi RT ini`,
    );
  }
  if (laporan.status !== STATUS_LAPORAN.DIVERIFIKASI_RT) {
    redirect(
      `/admin/keuangan/${id}?galat=Laporan harus diverifikasi Ketua RT terlebih dahulu`,
    );
  }

  const berhasil = await pindahStatusLaporan(db, {
    id,
    dari: [STATUS_LAPORAN.DIVERIFIKASI_RT],
    ke: STATUS_LAPORAN.DISETUJUI,
    aksi: "SETUJUI_RW",
    olehId: pengguna.id,
    catatan: catatan,
    data: {
      persetujuanRwOlehId: pengguna.id,
      persetujuanRwAt: new Date(),
      catatanRw: catatan || null,
    },
  });
  if (!berhasil) redirect(`/admin/keuangan/${id}?galat=${GALAT_KEDULUAN}`);

  await segarkan(id);
  redirect(`/admin/keuangan/${id}?pesan=Laporan disetujui dan kini tampil untuk warga`);
}

export async function tolakRw(formData: FormData) {
  const pengguna = await wajibMasuk();
  const id = Number(formData.get("id"));
  const catatan = String(formData.get("catatan") ?? "").trim();
  const laporan = await db.laporanKeuangan.findUnique({
    where: { id },
    include: { rt: { select: { rwId: true } } },
  });
  if (!laporan) return;

  if (!bolehSetujuiRw(pengguna, laporan.rt.rwId)) {
    redirect(`/admin/keuangan/${id}?galat=Laporan ini berada di luar RW Anda`);
  }
  if (laporan.status !== STATUS_LAPORAN.DIVERIFIKASI_RT) {
    redirect(`/admin/keuangan/${id}?galat=Laporan tidak berada pada tahap persetujuan RW`);
  }
  if (!catatan) {
    redirect(`/admin/keuangan/${id}?galat=Isi alasan pengembalian laporan`);
  }

  const berhasil = await pindahStatusLaporan(db, {
    id,
    dari: [STATUS_LAPORAN.DIVERIFIKASI_RT],
    ke: STATUS_LAPORAN.DITOLAK,
    aksi: "TOLAK_RW",
    olehId: pengguna.id,
    catatan: catatan,
    data: {
      persetujuanRwOlehId: pengguna.id,
      persetujuanRwAt: new Date(),
      catatanRw: catatan,
    },
  });
  if (!berhasil) redirect(`/admin/keuangan/${id}?galat=${GALAT_KEDULUAN}`);

  await segarkan(id);
  redirect(`/admin/keuangan/${id}?pesan=Laporan dikembalikan untuk direvisi`);
}

/**
 * Membuka kembali laporan yang sudah disetujui agar dapat diperbaiki.
 * Hanya Ketua RW atau administrator, dan selalu tercatat pada jejak audit.
 */
export async function bukaKembali(formData: FormData) {
  const pengguna = await wajibMasuk();
  const id = Number(formData.get("id"));
  const catatan = String(formData.get("catatan") ?? "").trim();
  const laporan = await db.laporanKeuangan.findUnique({
    where: { id },
    include: { rt: { select: { rwId: true } } },
  });
  if (!laporan) return;

  if (!bolehSetujuiRw(pengguna, laporan.rt.rwId)) {
    redirect(
      `/admin/keuangan/${id}?galat=Hanya Ketua RW yang menaungi RT ini atau administrator kampung yang dapat membuka kembali laporan`,
    );
  }
  if (laporan.status !== STATUS_LAPORAN.DISETUJUI) {
    redirect(`/admin/keuangan/${id}?galat=Hanya laporan yang sudah disetujui yang dapat dibuka kembali`);
  }
  if (!catatan) {
    redirect(`/admin/keuangan/${id}?galat=Isi alasan pembukaan kembali laporan`);
  }

  const berhasil = await pindahStatusLaporan(db, {
    id,
    dari: [STATUS_LAPORAN.DISETUJUI],
    ke: STATUS_LAPORAN.DITOLAK,
    aksi: "TOLAK_RW",
    olehId: pengguna.id,
    catatan: `Dibuka kembali: ${catatan}`,
    data: {
      catatanRw: catatan,
      persetujuanRwOlehId: null,
      persetujuanRwAt: null,
    },
  });
  if (!berhasil) redirect(`/admin/keuangan/${id}?galat=${GALAT_KEDULUAN}`);

  await segarkan(id);
  redirect(`/admin/keuangan/${id}?pesan=Laporan dibuka kembali dan ditarik dari halaman publik`);
}
