/** Merender teks polos berparagraf (dipisah baris kosong) menjadi elemen <p>. */
export default function Paragraf({ teks }: { teks: string }) {
  const bagian = teks
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="isi-artikel">
      {bagian.map((p, i) => (
        <p key={i}>
          {p.split("\n").map((baris, j, arr) => (
            <span key={j}>
              {baris}
              {j < arr.length - 1 && <br />}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}
