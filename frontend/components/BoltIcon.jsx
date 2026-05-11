export function BoltIcon({ size = 32 }) {
  const s = size / 32;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x={10*s} y={2*s} width={12*s} height={6*s} rx={s} fill="#c17f3a" />
      <rect x={12*s} y={8*s} width={8*s}  height={16*s} fill="#c17f3a" />
      <rect x={10*s} y={24*s} width={12*s} height={6*s} rx={s} fill="#c17f3a" />
      <rect x={8*s}  y={10*s} width={4*s}  height={12*s} fill="#8a5a28" />
      <rect x={20*s} y={10*s} width={4*s}  height={12*s} fill="#8a5a28" />
    </svg>
  );
}
