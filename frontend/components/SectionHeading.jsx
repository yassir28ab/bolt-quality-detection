export function SectionHeading({ num, title, dark = false }) {
  return (
    <div className="bqd-section-head">
      <span
        className="bqd-section-num"
        style={dark ? { color: "#3d3028" } : undefined}>
        {num}
      </span>
      <span
        className="bqd-section-title"
        style={dark ? { color: "#f0ebe3" } : undefined}>
        {title}
      </span>
      <div
        className="bqd-section-rule"
        style={dark ? { background: "#3d3028" } : undefined}
      />
    </div>
  );
}
