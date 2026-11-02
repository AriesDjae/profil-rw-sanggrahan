import Image from "next/image";

/**
 * Kepala halaman: teks di atas langit, lalu panorama kampung sebagai tepi bawahnya.
 *
 * Teks tidak ditaruh di atas gambar. Pengurus boleh mengganti ilustrasi dengan foto
 * sungguhan dari panel, dan foto apa pun tidak boleh membuat judulnya sulit dibaca.
 */
export default function KepalaPanorama({
  gambar,
  alt,
  samping,
  children,
}: {
  gambar: string;
  alt: string;
  /** Isi kolom kanan pada layar lebar, misalnya papan penunjuk RW. */
  samping?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-langit">
      <div
        className={`mx-auto max-w-6xl px-4 pt-10 pb-2 sm:pt-14 ${
          samping ? "lg:grid lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-12" : ""
        }`}
      >
        <div className="relative z-10 max-w-2xl">{children}</div>
        {samping && <div className="relative z-10 mt-8 lg:mt-0">{samping}</div>}
      </div>

      <Image
        src={gambar}
        alt={alt}
        width={1600}
        height={440}
        sizes="100vw"
        loading="eager"
        fetchPriority="high"
        className="mt-2 h-56 w-full object-cover object-[66%_100%] sm:-mt-6 sm:aspect-[40/11] sm:h-auto"
      />

      {/* Tiang papan penunjuk berdiri di jalan pada panorama, di belakang bilahnya. */}
      {samping && <span aria-hidden className="tiang-papan" />}
    </section>
  );
}
