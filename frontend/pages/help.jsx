import React from "react";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/authContext";
import { AppHeader } from "../components/AppHeader";
import { AppFooter } from "../components/AppFooter";
import { SectionHeading } from "../components/SectionHeading";

const sections = [
  {
    num: "01",
    title: "Home Page",
    body: "The Home Page provides an overview of the system's capabilities and metrics. From here you can navigate to the Detection Page, view recent inspection logs, and understand the system's core features.",
    bullets: null,
  },
  {
    num: "02",
    title: "Detection Page",
    body: "The Detection Page is the core workspace. Select an input mode, configure YOLO parameters, and run the detection pipeline.",
    bullets: [
      'Choose an input mode from the sidebar: "Import Video", "Import Image", or "Live Feed".',
      "If importing a file, click the upload button and select your video or image.",
      "Adjust YOLO parameters (Confidence, NMS Threshold, Input Size) directly in the sidebar.",
      'Click "Run Detection" to start the analysis pipeline.',
      "The processed output with detection overlays will appear in the Output panel.",
    ],
  },
  {
    num: "03",
    title: "Live Feed Mode",
    body: "Live Feed mode establishes a real-time WebRTC connection with a remote camera device. The system captures frames at 10fps, processes each through the YOLO model, and renders the annotated output on the canvas panel. No file upload is needed.",
    bullets: null,
  },
  {
    num: "04",
    title: "YOLO Configuration",
    body: "Three parameters control detection behaviour:",
    bullets: [
      "Confidence Threshold — minimum score a detection must achieve to be shown. Lower values show more detections, higher values show only confident ones. Default: 0.5.",
      "NMS Threshold — controls how aggressively overlapping boxes are suppressed. Lower values merge more boxes. Default: 0.4.",
      "Input Size — resolution fed to the model. Higher values improve accuracy at the cost of speed. Default: 416.",
    ],
  },
  {
    num: "05",
    title: "Navigation & Auth",
    body: "Click the logo at the top left to return to the Home Page at any time. Use the Log Out button in the header to end your session. Your detection history is saved per session if the setting is enabled in the Settings panel.",
    bullets: null,
  },
];

export default function HelpPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const navigateToDetection = () => {
    router.push(isAuthenticated ? "/detection" : "/login");
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ fontFamily: "'Barlow', sans-serif", background: "#f0ebe3", color: "#2a2118" }}
    >
      <AppHeader />

      <main className="flex flex-1 flex-col">

        {/* ── Hero band ── */}
        <div
          className="px-10 py-12"
          style={{ background: "#2a2118" }}
        >
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#c17f3a",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div style={{ width: 24, height: 1, background: "#c17f3a" }} />
            Documentation
          </div>
          <h1
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 48,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "#f0ebe3",
              lineHeight: 1.05,
              marginBottom: 16,
              maxWidth: 600,
            }}
          >
            System
            <span style={{ color: "#c17f3a" }}> Reference</span>
          </h1>
          <p
            style={{
              fontSize: 14,
              fontWeight: 300,
              color: "#8a7a6a",
              maxWidth: 560,
              lineHeight: 1.8,
            }}
          >
            Bolt QD is an industrial-grade inspection system powered by YOLOv8.
            It detects and classifies bolt defects in video, image, and live
            feed inputs — designed for manufacturing lines where speed and
            accuracy are non-negotiable.
          </p>
        </div>

        {/* ── Intro strip ── */}
        <div
          style={{
            background: "#ede8df",
            borderTop: "1px solid #d4c8b8",
            borderBottom: "1px solid #d4c8b8",
            padding: "20px 40px",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
          }}
        >
          {[
            { label: "Detection engine", value: "YOLOv8" },
            { label: "Supported inputs", value: "Video · Image · Live" },
            { label: "Classification types", value: "50+ bolt specs" },
          ].map((item) => (
            <div key={item.label} style={{ padding: "0 20px" }}>
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#8a7a6a",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#2a2118",
                  letterSpacing: "0.04em",
                }}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* ── Section content ── */}
        <div
          style={{
            maxWidth: 860,
            width: "100%",
            margin: "0 auto",
            padding: "48px 40px",
            display: "flex",
            flexDirection: "column",
            gap: 40,
          }}
        >
          {sections.map((s) => (
            <div key={s.num}>
              <SectionHeading num={s.num} title={s.title} />

              <div
                style={{
                  background: "#e8e0d5",
                  border: "1px solid #d4c8b8",
                  borderLeft: "3px solid #c17f3a",
                  padding: "22px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 300,
                    color: "#4a3a28",
                    lineHeight: 1.8,
                  }}
                >
                  {s.body}
                </p>

                {s.bullets && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                    {s.bullets.map((b, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: "#c17f3a",
                            flexShrink: 0,
                            marginTop: 6,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 300,
                            color: "#4a3a28",
                            lineHeight: 1.75,
                          }}
                        >
                          {b}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* ── CTA ── */}
          <div
            style={{
              background: "#2a2118",
              border: "1px solid #3d3028",
              padding: "32px 28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
              flexWrap: "wrap",
              marginTop: 8,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#8a7a6a",
                  marginBottom: 6,
                }}
              >
                Ready to inspect?
              </div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "#f0ebe3",
                }}
              >
                Open the Detection Workspace
              </div>
            </div>
            <button className="bqd-btn-primary" onClick={navigateToDetection} style={{ fontSize: 13, padding: "12px 32px" }}>
              Go to Detection
            </button>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
