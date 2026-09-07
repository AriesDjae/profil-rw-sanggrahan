import Footer from "@/components/publik/Footer";
import Header from "@/components/publik/Header";
import { ambilPengaturan } from "@/lib/pengaturan";
import { daftarRw } from "@/lib/rw";

/**
 * Layout ini sengaja tidak membaca cookie sesi. Sekali sebuah layout membaca
 * cookie, seluruh halaman di bawahnya berubah menjadi dinamis dan kehilangan
 * cache. Pengurus yang sudah masuk tetap tidak dirugikan: tautan "Masuk
 * Pengurus" menuju /masuk, dan halaman itu langsung mengalihkan mereka ke
 * panel bila sesinya masih berlaku.
 */
export default async function LayoutPublik({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pengaturan, rwList] = await Promise.all([ambilPengaturan(), daftarRw()]);
  const nav = rwList.map((r) => ({ nomor: r.nomor, nama: r.nama }));

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        namaKampung={pengaturan.namaKampung}
        tagline={pengaturan.tagline}
        daftarRw={nav}
      />
      <main className="flex-1">{children}</main>
      <Footer
        namaKampung={pengaturan.namaKampung}
        alamat={pengaturan.alamat}
        telepon={pengaturan.telepon}
        email={pengaturan.email}
        daftarRw={nav}
      />
    </div>
  );
}
