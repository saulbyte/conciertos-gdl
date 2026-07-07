import Link from "next/link";

type BrandLogoProps = {
  compact?: boolean;
  markOnly?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "auto" | "wordmark" | "mobile";
};

const textClass =
  "[font-family:Impact,Haettenschweiler,'Arial_Narrow_Bold','Arial_Black',sans-serif]";

export function BrandLogo({
  compact = false,
  markOnly = false,
  size = "md",
  variant = "auto",
}: BrandLogoProps) {
  const mobile = variant === "mobile";
  const width = markOnly
    ? size === "lg"
      ? 108
      : compact || size === "sm"
        ? 52
        : 64
    : mobile
      ? 138
    : size === "lg"
      ? 390
      : compact || size === "sm"
        ? 198
        : 210;
  const height = markOnly
    ? size === "lg"
      ? 108
      : compact || size === "sm"
        ? 52
        : 64
    : mobile
      ? 32
    : size === "lg"
      ? 92
      : compact || size === "sm"
        ? 46
        : 50;

  return (
    <Link
      href="/"
      aria-label="La Cartelera"
      className="group inline-flex shrink-0 items-center text-[#f6f3ea] transition hover:text-[#ff304f] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff304f]"
    >
      {markOnly ? (
        <LaCarteleraMark width={width} height={height} />
      ) : (
        <LaCarteleraWordmark width={width} height={height} />
      )}
    </Link>
  );
}

function LaCarteleraWordmark({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 640 150"
      role="img"
      aria-labelledby="la-cartelera-title"
      className="block h-auto max-w-full overflow-visible"
    >
      <title id="la-cartelera-title">La Cartelera</title>
      <defs>
        <clipPath id="la-cartelera-top">
          <polygon points="0,0 640,0 640,70 0,61" />
        </clipPath>
        <clipPath id="la-cartelera-bottom">
          <polygon points="0,84 640,74 640,150 0,150" />
        </clipPath>
      </defs>
      <g
        className={`${textClass} fill-current font-black uppercase tracking-[-0.055em]`}
      >
        <text
          x="5"
          y="113"
          fontSize="104"
          fontWeight="900"
          clipPath="url(#la-cartelera-top)"
          transform="scale(1.02, 1.18)"
        >
          LA CARTELERA
        </text>
        <text
          x="5"
          y="113"
          fontSize="104"
          fontWeight="900"
          clipPath="url(#la-cartelera-bottom)"
          transform="scale(1.02, 1.18)"
        >
          LA CARTELERA
        </text>
      </g>
    </svg>
  );
}

function LaCarteleraMark({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 160 160"
      role="img"
      aria-labelledby="la-cartelera-mark-title"
      className="block h-auto overflow-visible"
    >
      <title id="la-cartelera-mark-title">La Cartelera</title>
      <defs>
        <clipPath id="la-cartelera-mark-top">
          <polygon points="0,0 160,0 160,74 0,65" />
        </clipPath>
        <clipPath id="la-cartelera-mark-bottom">
          <polygon points="0,88 160,78 160,160 0,160" />
        </clipPath>
      </defs>
      <rect
        x="8"
        y="8"
        width="144"
        height="144"
        rx="18"
        fill="#071018"
        stroke="currentColor"
        strokeWidth="8"
      />
      <g
        className={`${textClass} fill-current font-black uppercase tracking-[-0.08em]`}
      >
        <text
          x="27"
          y="112"
          fontSize="92"
          fontWeight="900"
          clipPath="url(#la-cartelera-mark-top)"
        >
          LC
        </text>
        <text
          x="27"
          y="112"
          fontSize="92"
          fontWeight="900"
          clipPath="url(#la-cartelera-mark-bottom)"
        >
          LC
        </text>
      </g>
    </svg>
  );
}
