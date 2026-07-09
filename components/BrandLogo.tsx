import Link from "next/link";

type BrandLogoProps = {
  compact?: boolean;
  markOnly?: boolean;
  size?: "sm" | "md" | "lg";
};

const WORDMARK_WIDTH = 1210;
const WORDMARK_HEIGHT = 230;

export function BrandLogo({
  compact = false,
  size = "md",
}: BrandLogoProps) {
  const width =
    size === "lg"
      ? 300
      : compact || size === "sm"
        ? 154
        : 190;

  return (
    <Link
      href="/"
      aria-label="REVERA"
      className="group relative inline-flex shrink-0 items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff304f]"
      style={{ width }}
    >
      <span
        className="relative block w-full"
        style={{ aspectRatio: `${WORDMARK_WIDTH} / ${WORDMARK_HEIGHT}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/revera-wordmark-base.png"
          alt="REVERA"
          className="absolute inset-0 h-full w-full object-contain transition duration-200 group-hover:opacity-0"
          width={WORDMARK_WIDTH}
          height={WORDMARK_HEIGHT}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/revera-wordmark-hover.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-contain opacity-0 transition duration-200 group-hover:opacity-100"
          width={WORDMARK_WIDTH}
          height={WORDMARK_HEIGHT}
        />
      </span>
    </Link>
  );
}
