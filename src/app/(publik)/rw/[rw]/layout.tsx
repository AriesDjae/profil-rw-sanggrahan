import { muatLingkupRw } from "./muat";

/**
 * Keberadaan RW diperiksa di sini, bukan hanya di halamannya.
 *
 * Halaman berada di bawah loading.tsx di folder ini, jadi tanggapannya sudah mulai
 * dikirim saat halaman itu berjalan, dan notFound() dari sana dijawab status 200.
 * Layout di folder yang sama berjalan sebelum batas itu, sehingga /rw/9/berita
 * tetap dijawab 404.
 */
export default async function LayoutRw({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ rw: string }>;
}) {
  await muatLingkupRw(params);
  return children;
}
