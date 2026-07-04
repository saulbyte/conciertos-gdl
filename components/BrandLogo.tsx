import Link from "next/link";

type BrandLogoProps = {
  compact?: boolean;
  markOnly?: boolean;
  size?: "sm" | "md" | "lg";
};

export function BrandLogo({
  compact = false,
  markOnly = false,
  size = "md",
}: BrandLogoProps) {
  const iconSize = size === "lg" ? 76 : compact || size === "sm" ? 36 : 44;
  const textSize =
    size === "lg" ? "text-3xl" : compact || size === "sm" ? "text-base" : "text-xl";

  return (
    <Link href="/" className="flex min-w-0 items-center gap-2.5">
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        className="shrink-0 drop-shadow-[0_0_14px_rgba(255,48,79,0.18)]"
        aria-hidden="true"
      >
        <path
          d="M24 4.5C13.8 4.5 6 12.3 6 22.1c0 12.1 14.6 20.4 18 22.1 3.4-1.7 18-10 18-22.1C42 12.3 34.2 4.5 24 4.5Z"
          fill="#071018"
          stroke="#ff304f"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <circle
          cx="24"
          cy="22"
          r="12"
          fill="#071018"
          stroke="#ff304f"
          strokeWidth="2"
          opacity="0.95"
        />
        <path
          d="M15.8 22h2.7m2.6 0v-5.5m0 5.5v5.5m2.9-5.5V14m0 8v8m2.9-8v-5.5m0 5.5v5.5m2.6-5.5h2.7"
          fill="none"
          stroke="#f6f3ea"
          strokeLinecap="round"
          strokeWidth="2.6"
        />
        <path
          d="M24 14v16"
          fill="none"
          stroke="#00c2d1"
          strokeLinecap="round"
          strokeWidth="2"
          opacity="0.9"
        />
      </svg>
      {markOnly ? null : (
        <span
          className={`min-w-0 font-black leading-none tracking-tight text-[#f6f3ea] ${textSize}`}
        >
          <span className="block">D&oacute;nde</span>
          <span className="block">Toca</span>
        </span>
      )}
    </Link>
  );
}
