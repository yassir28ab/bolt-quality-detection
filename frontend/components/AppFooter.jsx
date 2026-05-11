export function AppFooter() {
  return (
    <footer
      className="w-full flex justify-between items-center px-7 py-4 shrink-0"
      style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        background: "#1a1208",
        borderTop: "2px solid #c17f3a",
      }}
    >
      <p
        style={{
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#3d3028",
        }}
      >
        © 2024 Bolt Quality Detection
      </p>
      <div className="flex gap-5">
        {["Privacy", "Terms", "Help", "Contact"].map((l) => (
          <span
            key={l}
            style={{
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#3d3028",
              cursor: "pointer",
              transition: "color 0.1s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#c17f3a"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#3d3028"; }}
          >
            {l}
          </span>
        ))}
      </div>
    </footer>
  );
}
