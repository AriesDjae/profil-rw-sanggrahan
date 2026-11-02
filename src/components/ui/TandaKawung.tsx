/** Tanda situs: empat kelopak kawung, motif batik Yogyakarta. */
export default function TandaKawung({
  ukuran = 40,
  className = "",
}: {
  ukuran?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      width={ukuran}
      height={ukuran}
      viewBox="0 0 64 64"
      className={`shrink-0 ${className}`}
    >
      <rect width="64" height="64" rx="12" fill="#162542" />
      <g fill="#f3d68c">
        <ellipse cx="32" cy="17.5" rx="8" ry="13.5" transform="rotate(45 32 32)" />
        <ellipse cx="32" cy="17.5" rx="8" ry="13.5" transform="rotate(135 32 32)" />
        <ellipse cx="32" cy="17.5" rx="8" ry="13.5" transform="rotate(225 32 32)" />
        <ellipse cx="32" cy="17.5" rx="8" ry="13.5" transform="rotate(315 32 32)" />
      </g>
      <circle cx="32" cy="32" r="3.4" fill="#fefdfa" />
    </svg>
  );
}
