export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size }} aria-hidden>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        <path d="M5 19v-5M10 19V8M15 19v-7M20 19V5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    </span>
  );
}
