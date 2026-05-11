import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { RiFileHistoryFill } from "react-icons/ri";
import ClipLoader from "react-spinners/ClipLoader";
import jsPDF from "jspdf";
import { useAuth } from "../contexts/authContext";
import { AppHeader } from "../components/AppHeader";
import { AppFooter } from "../components/AppFooter";
import { SectionHeading } from "../components/SectionHeading";
import ProcessLiveStream from "../components/ProcessLiveStream";
import { uploadFile, fetchHistory, deleteRecord, clearAllHistory } from "../lib/api";

const MODES = [
  { value: "importVideo", label: "Import Video" },
  { value: "importImage", label: "Import Image" },
  { value: "live",        label: "Live Feed"    },
];

export default function DetectionPage() {
  const [file, setFile]                 = useState(null);
  const [fileURL, setFileURL]           = useState(null);
  const [confidence, setConfidence]     = useState(0.25);
  const [nmsThreshold, setNmsThreshold] = useState(0.45);
  const [selectedMode, setSelectedMode] = useState("importVideo");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [outputURL, setOutputURL]       = useState(null);
  const [loading, setLoading]           = useState(false);
  const [history, setHistory]           = useState([]);
  const [error, setError]               = useState("");

  const router = useRouter();
  const { isAuthenticated, userId } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, []);

  // Fetch history only when the modal opens — avoids unnecessary requests
  useEffect(() => {
    if (isHistoryOpen) loadHistory();
  }, [isHistoryOpen]);

  const loadHistory = async () => {
    if (!userId) {
      console.warn("loadHistory called with no userId — skipping.");
      return;
    }
    try {
      const res = await fetchHistory(Number(userId));
      setHistory(res.data);
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setFile(f);
    setFileURL(URL.createObjectURL(f));
    setOutputURL(null);
    setError("");
  };

  const handleModeChange = (mode) => {
    setSelectedMode(mode);
    setFile(null);
    setFileURL(null);
    setOutputURL(null);
    setError("");
  };

  const setDefaultYoloParameters = () => {
    setConfidence(0.25);
    setNmsThreshold(0.45);
  };

  const handlePredict = async () => {
    if (!file && selectedMode !== "live") {
      setError("Please upload a file before running detection.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file",         file);
      formData.append("user_id",      Number(userId));
      formData.append("confidence",   confidence);
      formData.append("nmsThreshold", nmsThreshold);

      const response = await uploadFile(formData);
      if (response.data.output) {
        const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        setOutputURL(`${base}/${response.data.output}`);
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("Detection failed. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (multimediaId) => {
    try {
      await deleteRecord(Number(userId), multimediaId);
      setHistory((prev) => prev.filter((item) => item.multimedia_id !== multimediaId));
    } catch (err) {
      console.error("Error deleting record:", err);
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearAllHistory(Number(userId));
      setHistory([]);
    } catch (err) {
      console.error("Error clearing history:", err);
    }
  };

  const exportHistoryToPDF = () => {
    const doc        = new jsPDF();
    const lineHeight = 6;
    const pageHeight = doc.internal.pageSize.height;
    const margin     = 10;

    const writeLine = (text, x, y) => {
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(text, x, y);
      return y + lineHeight;
    };

    doc.setFontSize(18);
    doc.text("Detection History", 14, 22);
    let y = 30;

    history.forEach((item, i) => {
      doc.setFontSize(14);
      y = writeLine(`Detection ${i + 1}`, 14, y);
      doc.setFontSize(12);
      y = writeLine(`Date: ${new Date(item.uploaded_at).toLocaleString()}`, 14, y);
      y = writeLine(`Type: ${item.content_type}`, 14, y);
      y = writeLine(`Detected Bolts: ${item.bolts.length}`, 14, y);
      item.bolts.forEach((bolt) => {
        y = writeLine(
          `- Quality: ${bolt.quality ? "Good" : "Bad"}, Conf: ${bolt.conf.toFixed(2)}, Coords: (${bolt.x_min}, ${bolt.y_min}) → (${bolt.x_max}, ${bolt.y_max})`,
          14, y
        );
      });
      y += lineHeight;
    });

    doc.save("detection_history.pdf");
  };

  // ── Header extras (history button) ──────────────────────────────────────
  const headerExtras = (
    <button
      className="bqd-btn-ghost flex items-center gap-1.5"
      onClick={() => setIsHistoryOpen(true)}
    >
      <RiFileHistoryFill size={13} />
      History
    </button>
  );

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ fontFamily: "'Barlow', sans-serif", background: "#f0ebe3", color: "#2a2118" }}
    >
      <AppHeader extras={headerExtras} />

      {/* ── Body ── */}
      <div className="flex flex-1">

        {/* ── Sidebar ── */}
        <aside
          className="shrink-0 flex flex-col px-5 py-8"
          style={{ width: 210, background: "#e8e0d5", borderRight: "1px solid #d4c8b8" }}
        >
          {/* Mode selector */}
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8a7a6a", marginBottom: 14 }}>
            Input Mode
          </div>
          <div className="flex flex-col gap-2">
            {MODES.map((m) => (
              <button
                key={m.value}
                className={`bqd-radio-item${selectedMode === m.value ? " bqd-radio-item--active" : ""}`}
                onClick={() => handleModeChange(m.value)}
                style={{ border: "none", width: "100%", textAlign: "left" }}
              >
                <div className="bqd-radio-dot" style={selectedMode === m.value ? { background: "#c17f3a" } : undefined} />
                {m.label}
              </button>
            ))}
          </div>

          {/* YOLO config */}
          {selectedMode !== "live" && (
            <div style={{ marginTop: 28, borderTop: "1px solid #c8bca8", paddingTop: 20, display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8a7a6a" }}>
                YOLO Config
              </div>

              {/* Confidence */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="flex justify-between">
                  <label style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6a5a4a" }}>
                    Confidence
                  </label>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, color: "#2a2118" }}>
                    {confidence}
                  </span>
                </div>
                <input
                  type="range" min="0" max="1" step="0.01"
                  value={confidence}
                  onChange={(e) => setConfidence(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "#c17f3a" }}
                />
              </div>

              {/* NMS */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="flex justify-between">
                  <label style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6a5a4a" }}>
                    NMS
                  </label>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, color: "#2a2118" }}>
                    {nmsThreshold}
                  </span>
                </div>
                <input
                  type="range" min="0" max="1" step="0.01"
                  value={nmsThreshold}
                  onChange={(e) => setNmsThreshold(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "#c17f3a" }}
                />
              </div>

              <button className="bqd-btn-ghost" onClick={setDefaultYoloParameters} style={{ fontSize: 11 }}>
                Reset Defaults
              </button>
            </div>
          )}
        </aside>

        {/* ── Main workspace ── */}
        <main className="flex-1 flex flex-col p-8 gap-6">
          {selectedMode === "live" ? (
            <ProcessLiveStream />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-6" style={{ flex: 1 }}>
                {/* Input panel */}
                <div style={{ background: "#e8e0d5", border: "1px solid #d4c8b8", borderTop: "3px solid #2a2118", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8a7a6a" }}>
                    {selectedMode === "importVideo" ? "Video" : "Image"} Input
                  </div>

                  <label
                    htmlFor="file-upload"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", background: "#2a2118", color: "#f0ebe3", border: "none", borderRadius: 2, padding: "8px 16px", cursor: "pointer", alignSelf: "flex-start", transition: "background 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#c17f3a"; e.currentTarget.style.color = "#1a1208"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#2a2118"; e.currentTarget.style.color = "#f0ebe3"; }}
                  >
                    {selectedMode === "importVideo" ? "Choose Video" : "Choose Image"}
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept={selectedMode === "importVideo" ? "video/*" : "image/*"}
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {file && (
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: "0.05em", color: "#8a7a6a" }}>
                      {file.name}
                    </p>
                  )}

                  <div className="bqd-dropzone" style={{ flex: 1, minHeight: 200 }}>
                    {fileURL ? (
                      selectedMode === "importVideo"
                        ? <video src={fileURL} controls className="w-full h-full object-contain" />
                        : <img src={fileURL} alt="Input" className="w-full h-full object-contain" />
                    ) : (
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8a7a6a" }}>
                        No file selected
                      </span>
                    )}
                  </div>
                </div>

                {/* Output panel */}
                <div style={{ background: "#e8e0d5", border: "1px solid #d4c8b8", borderTop: "3px solid #c17f3a", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8a7a6a" }}>
                    Detection Output
                  </div>
                  <div className="bqd-dropzone" style={{ flex: 1, minHeight: 200 }}>
                    {outputURL ? (
                      selectedMode === "importVideo"
                        ? <video src={outputURL} controls className="w-full h-full object-contain" />
                        : <img src={outputURL} alt="Output" className="w-full h-full object-contain" />
                    ) : (
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8a7a6a" }}>
                        Output will appear here
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, letterSpacing: "0.06em", color: "#b85c3a", background: "rgba(184,92,58,0.08)", border: "1px solid rgba(184,92,58,0.3)", borderRadius: 2, padding: "10px 14px" }}>
                  {error}
                </div>
              )}

              {/* Run button */}
              <div className="flex justify-center pt-1">
                <button
                  className="bqd-btn-primary"
                  onClick={handlePredict}
                  style={{ fontSize: 14, padding: "12px 48px" }}
                >
                  Run Detection — {selectedMode === "importVideo" ? "Video" : "Image"}
                </button>
              </div>
            </>
          )}
        </main>
      </div>

      <AppFooter />

      {/* ── Loading overlay ── */}
      {loading && (
        <div className="bqd-overlay">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <ClipLoader color="#c17f3a" loading size={60} />
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8a7a6a" }}>
              Running Detection...
            </span>
          </div>
        </div>
      )}

      {/* ── History modal ── */}
      {isHistoryOpen && (
        <div className="bqd-overlay">
          <div className="bqd-modal" style={{ width: 680, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <SectionHeading num="—" title="Detection History" />

            {/* Modal actions */}
            <div className="flex gap-3 mb-4">
              <button
                className="bqd-btn-primary"
                onClick={exportHistoryToPDF}
                style={{ fontSize: 11 }}
                disabled={history.length === 0}
              >
                Export PDF
              </button>
              <button
                className="bqd-btn-danger"
                onClick={handleClearHistory}
                disabled={history.length === 0}
              >
                Clear All
              </button>
            </div>

            {/* History list */}
            <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              {history.length === 0 ? (
                <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: "#8a7a6a" }}>
                  No detection history found.
                </p>
              ) : (
                history.map((item, index) => (
                  <div
                    key={item.multimedia_id}
                    style={{ background: "#e8e0d5", border: "1px solid #d4c8b8", borderLeft: "3px solid #c17f3a", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    <div className="flex items-center justify-between">
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#2a2118" }}>
                        Detection {index + 1}
                      </span>
                      <button
                        className="bqd-btn-danger"
                        onClick={() => handleDeleteRecord(item.multimedia_id)}
                        style={{ fontSize: 11, padding: "4px 10px" }}
                      >
                        Delete
                      </button>
                    </div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: "0.08em", color: "#8a7a6a", display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <span>{new Date(item.uploaded_at).toLocaleString()}</span>
                      <span style={{ color: "#d4c8b8" }}>|</span>
                      <span>Type: {item.content_type}</span>
                      <span style={{ color: "#d4c8b8" }}>|</span>
                      <span>Bolts detected: {item.bolts.length}</span>
                    </div>
                    {item.bolts.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 4 }}>
                        {item.bolts.map((bolt, bi) => (
                          <div key={bi} className="flex items-center gap-2">
                            <span
                              className="bqd-badge"
                              style={bolt.quality
                                ? { background: "#d4e8c8", color: "#2a5218" }
                                : { background: "#f0d0c0", color: "#6a2010" }}
                            >
                              {bolt.quality ? "Good" : "Bad"}
                            </span>
                            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, color: "#6a5a4a" }}>
                              Conf: {bolt.conf.toFixed(2)} — ({bolt.x_min}, {bolt.y_min}) → ({bolt.x_max}, {bolt.y_max})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end mt-5">
              <button className="bqd-btn-ghost" onClick={() => setIsHistoryOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
