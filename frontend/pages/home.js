import React from "react";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/authContext";
import { AppHeader } from "../components/AppHeader";
import { AppFooter } from "../components/AppFooter";
import { SectionHeading } from "../components/SectionHeading";

const FEATURES = [
  {
    tag: "Inspection",
    title: "Automated Detection",
    desc: "Detects and classifies bolt conditions from images, videos, and live camera streams using a custom-trained YOLOv8 model.",
    specs: ["Image and video support", "Bounding box visualization"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="6.5" stroke="#c17f3a" strokeWidth="1.2" />
        <path
          d="M6 9l2 2 4-4"
          stroke="#c17f3a"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    tag: "Processing",
    title: "Real-Time Analysis",
    desc: "Supports live stream processing through WebRTC and Socket.IO for continuous inspection workflows.",
    specs: ["Live stream mode", "Real-time frame processing"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M9 3v6l3 3"
          stroke="#c17f3a"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle cx="9" cy="9" r="6.5" stroke="#c17f3a" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    tag: "Interface",
    title: "Interactive Workspace",
    desc: "Provides a clean inspection interface with upload tools, detection history, parameter tuning, and PDF export.",
    specs: ["Detection history", "PDF export support"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect
          x="3"
          y="3"
          width="12"
          height="12"
          rx="2"
          stroke="#c17f3a"
          strokeWidth="1.2"
        />
        <path
          d="M6 9h6M9 6v6"
          stroke="#c17f3a"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

const STEPS = [
  {
    n: "01",
    title: "Load Sample",
    desc: "Place bolt in the inspection tray or connect to your conveyor feed. The system auto-detects the unit and begins framing.",
  },
  {
    n: "02",
    title: "Capture",
    desc: "High-resolution imaging captures the bolt from multiple angles — head, shank, thread, and tip — in a single pass.",
  },
  {
    n: "03",
    title: "Classify",
    desc: "The detection model identifies defect type, severity, and location. Results are matched against the loaded specification.",
  },
  {
    n: "04",
    title: "Report",
    desc: "Pass or fail verdict is issued instantly. All results are logged to the shift report with timestamps and defect imagery.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const navigateToDetection = () => {
    router.push(isAuthenticated ? "/detection" : "/login");
  };
  const navigateToStream = () => {
    router.push("/send-stream");
  };

  return (
    <div
      className="w-full flex flex-col min-h-screen"
      style={{
        fontFamily: "'Barlow', sans-serif",
        background: "#f0ebe3",
        color: "#2a2118",
      }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=Barlow:wght@300;400;500&display=swap');
        .bqd-feat-card { border-top: 3px solid #2a2118; transition: border-top-color 0.2s, transform 0.2s; }
        .bqd-feat-card:hover { border-top-color: #c17f3a; transform: translateY(-2px); }
        .bqd-log-row:hover td { background: #ece4d8; }
      `}</style>

      <AppHeader />

      {/* ── HERO ── */}
      <section
        className="relative grid gap-10 items-center px-10 py-14 overflow-hidden"
        style={{ background: "#2a2118", gridTemplateColumns: "1fr 1fr" }}>
        {/* Watermark */}
        <svg
          className="absolute opacity-[0.04] pointer-events-none"
          style={{ right: -20, top: -20 }}
          width="320"
          height="320"
          viewBox="0 0 32 32"
          fill="none">
          <rect x="10" y="2" width="12" height="6" rx="1" fill="#c17f3a" />
          <rect x="12" y="8" width="8" height="16" fill="#c17f3a" />
          <rect x="10" y="24" width="12" height="6" rx="1" fill="#c17f3a" />
          <rect x="8" y="10" width="4" height="12" fill="#c17f3a" />
          <rect x="20" y="10" width="4" height="12" fill="#c17f3a" />
        </svg>

        {/* Left: copy */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div style={{ width: 24, height: 1, background: "#c17f3a" }} />
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#c17f3a",
              }}>
              Precision Manufacturing QC
            </span>
          </div>
          <h1
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 52,
              fontWeight: 700,
              lineHeight: 1.0,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "#f0ebe3",
              marginBottom: 16,
            }}>
            Bolt Quality
            <span style={{ color: "#c17f3a", display: "block" }}>
              Detection
            </span>
          </h1>
          <p
            style={{
              fontSize: 14,
              fontWeight: 300,
              color: "#8a7a6a",
              maxWidth: 340,
              lineHeight: 1.8,
              marginBottom: 28,
            }}>
            Industrial bolt inspection platform powered by computer vision and
            real-time streaming technologies. Supports image uploads, video
            analysis, and live camera-based detection workflows.
          </p>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={navigateToDetection}
              className="bqd-btn-primary"
              style={{ fontSize: 13, padding: "10px 28px" }}>
              Open Detection
            </button>

            <button onClick={navigateToStream} className="bqd-btn-primary">
              Send Live Stream
            </button>

            <button
              className="bqd-btn-ghost"
              onClick={() => router.push("/help")}>
              View Docs
            </button>
          </div>
        </div>

        {/* Right: bolt schematic */}
        <div className="hidden lg:flex flex-col items-center gap-2">
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#3d3028",
              alignSelf: "flex-start",
            }}>
            Inspection schema
          </span>
          <svg width="240" height="200" viewBox="0 0 240 200" fill="none">
            <rect
              x="85"
              y="10"
              width="70"
              height="22"
              rx="2"
              fill="#c17f3a"
              opacity="0.9"
            />
            <text
              x="120"
              y="25"
              fontFamily="Barlow Condensed"
              fontSize="10"
              letterSpacing="1"
              fill="#1a1208"
              textAnchor="middle"
              fontWeight="700">
              HEAD SECTION
            </text>
            <rect
              x="95"
              y="32"
              width="50"
              height="50"
              fill="#8a5a28"
              opacity="0.7"
            />
            <rect
              x="89"
              y="34"
              width="8"
              height="46"
              fill="#6a4218"
              opacity="0.8"
            />
            <rect
              x="143"
              y="34"
              width="8"
              height="46"
              fill="#6a4218"
              opacity="0.8"
            />
            <rect
              x="100"
              y="82"
              width="40"
              height="70"
              fill="#7a5238"
              opacity="0.7"
            />
            <rect
              x="95"
              y="152"
              width="50"
              height="20"
              rx="2"
              fill="#c17f3a"
              opacity="0.7"
            />
            <line
              x1="160"
              y1="21"
              x2="200"
              y2="10"
              stroke="#c17f3a"
              strokeWidth="0.8"
              strokeDasharray="3 2"
              opacity="0.5"
            />
            <text
              x="205"
              y="12"
              fontFamily="Barlow Condensed"
              fontSize="9"
              letterSpacing="0.5"
              fill="#8a7a6a">
              HEX HEAD
            </text>
            <line
              x1="160"
              y1="58"
              x2="200"
              y2="50"
              stroke="#c17f3a"
              strokeWidth="0.8"
              strokeDasharray="3 2"
              opacity="0.5"
            />
            <text
              x="205"
              y="52"
              fontFamily="Barlow Condensed"
              fontSize="9"
              letterSpacing="0.5"
              fill="#8a7a6a">
              SHANK
            </text>
            <line
              x1="160"
              y1="116"
              x2="200"
              y2="110"
              stroke="#c17f3a"
              strokeWidth="0.8"
              strokeDasharray="3 2"
              opacity="0.5"
            />
            <text
              x="205"
              y="112"
              fontFamily="Barlow Condensed"
              fontSize="9"
              letterSpacing="0.5"
              fill="#8a7a6a">
              THREAD
            </text>
            <line
              x1="160"
              y1="163"
              x2="200"
              y2="163"
              stroke="#c17f3a"
              strokeWidth="0.8"
              strokeDasharray="3 2"
              opacity="0.5"
            />
            <text
              x="205"
              y="165"
              fontFamily="Barlow Condensed"
              fontSize="9"
              letterSpacing="0.5"
              fill="#8a7a6a">
              TIP
            </text>
            <line
              x1="78"
              y1="58"
              x2="44"
              y2="42"
              stroke="#c17f3a"
              strokeWidth="0.8"
              strokeDasharray="3 2"
              opacity="0.4"
            />
            <rect
              x="4"
              y="30"
              width="40"
              height="26"
              rx="1"
              fill="rgba(193,127,58,0.08)"
              stroke="#3d3028"
              strokeWidth="0.5"
            />
            <text
              x="24"
              y="43"
              fontFamily="Barlow Condensed"
              fontSize="8"
              letterSpacing="0.5"
              fill="#7a6a5a"
              textAnchor="middle">
              DEFECT
            </text>
            <text
              x="24"
              y="53"
              fontFamily="Barlow Condensed"
              fontSize="8"
              letterSpacing="0.5"
              fill="#7a6a5a"
              textAnchor="middle">
              ZONE A
            </text>
            <line
              x1="78"
              y1="116"
              x2="44"
              y2="116"
              stroke="#c17f3a"
              strokeWidth="0.8"
              strokeDasharray="3 2"
              opacity="0.4"
            />
            <rect
              x="4"
              y="104"
              width="40"
              height="26"
              rx="1"
              fill="rgba(193,127,58,0.08)"
              stroke="#3d3028"
              strokeWidth="0.5"
            />
            <text
              x="24"
              y="117"
              fontFamily="Barlow Condensed"
              fontSize="8"
              letterSpacing="0.5"
              fill="#7a6a5a"
              textAnchor="middle">
              DEFECT
            </text>
            <text
              x="24"
              y="127"
              fontFamily="Barlow Condensed"
              fontSize="8"
              letterSpacing="0.5"
              fill="#7a6a5a"
              textAnchor="middle">
              ZONE B
            </text>
            <text
              x="120"
              y="192"
              fontFamily="Barlow Condensed"
              fontSize="9"
              letterSpacing="1.5"
              fill="#3d3028"
              textAnchor="middle">
              M8 × 1.25 — REF SPEC 4.6
            </text>
          </svg>
        </div>
      </section>

      {/* ── METRICS STRIP ── */}
      <div
        className="grid grid-cols-4"
        style={{ borderBottom: "1px solid #d4c8b8" }}>
        {[
          { val: "3", label: "Inspection modes" },
          { val: "YOLOv8", label: "Detection model" },
          { val: "WebRTC", label: "Live streaming" },
          { val: "Real-time", label: "Processing pipeline" },
        ].map((m, i) => (
          <div
            key={i}
            className="px-5 py-5"
            style={{
              background: "#ede8df",
              borderRight: i < 3 ? "1px solid #d4c8b8" : "none",
            }}>
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 28,
                fontWeight: 700,
                color: "#2a2118",
                display: "block",
                lineHeight: 1,
                marginBottom: 4,
              }}>
              {m.val}
            </span>
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#7a6a5a",
                display: "block",
              }}>
              {m.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── CAPABILITIES ── */}
      <section className="px-7 py-9" style={{ background: "#f0ebe3" }}>
        <SectionHeading num="01" title="System Capabilities" />
        <div className="grid grid-cols-3 gap-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bqd-feat-card p-5 cursor-default"
              style={{ background: "#e8e0d5", border: "1px solid #d4c8b8" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 6,
                  background: "rgba(193,127,58,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}>
                {f.icon}
              </div>
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#c17f3a",
                  display: "block",
                  marginBottom: 8,
                }}>
                {f.tag}
              </span>
              <h3
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 18,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#2a2118",
                  marginBottom: 8,
                }}>
                {f.title}
              </h3>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 300,
                  color: "#6a5a4a",
                  lineHeight: 1.7,
                  marginBottom: 12,
                }}>
                {f.desc}
              </p>
              <div
                style={{ height: 1, background: "#c8bca8", marginBottom: 10 }}
              />
              {f.specs.map((s) => (
                <div key={s} className="flex items-center gap-2 mt-1">
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "#c17f3a",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 11,
                      letterSpacing: "0.05em",
                      color: "#8a7a6a",
                    }}>
                    {s}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="px-7 py-9" style={{ background: "#2a2118" }}>
        <SectionHeading num="02" title="How It Works" dark />
        <div className="grid grid-cols-4">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              style={{
                padding: "24px 20px 24px 0",
                borderRight: i < 3 ? "1px solid #3d3028" : "none",
                paddingLeft: i > 0 ? 20 : 0,
              }}>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 42,
                  fontWeight: 700,
                  color: "#3d3028",
                  lineHeight: 1,
                  marginBottom: 12,
                }}>
                {s.n}
              </div>
              <h4
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#c17f3a",
                  marginBottom: 8,
                }}>
                {s.title}
              </h4>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 300,
                  color: "#7a6a5a",
                  lineHeight: 1.7,
                }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
