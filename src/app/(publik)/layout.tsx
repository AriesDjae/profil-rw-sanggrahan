import Footer from "@/components/publik/Footer";
import Header from "@/components/publik/Header";
import { ambilPengaturan } from "@/lib/pengaturan";
import { penggunaSaatIni } from "@/lib/sesi";

export default async function LayoutPublik({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pengaturan, pengguna] = await Promise.all([
    ambilPengaturan(),
    penggunaSaatIni(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        namaRw={pengaturan.namaRw}
        tagline={pengaturan.tagline}
        sudahMasuk={Boolean(pengguna)}
      />
      <main className="flex-1">{children}</main>
      <Footer
        namaRw={pengaturan.namaRw}
        alamat={pengaturan.alamat}
        telepon={pengaturan.telepon}
        email={pengaturan.email}
      />
    </div>
  );
}
