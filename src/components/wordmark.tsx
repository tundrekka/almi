// Wordmark ZALUT — bold, mayúsculas, tracking apretado (como el logo).
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-bold uppercase tracking-[-0.06em] leading-none ${className}`}
    >
      ZALUT
    </span>
  );
}
