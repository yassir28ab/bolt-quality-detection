import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { SOCKET_URL } from "../lib/api";
import { AppHeader } from "../components/AppHeader";
import { AppFooter } from "../components/AppFooter";

export default function StreamVideoPage() {
  const localVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);

  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Guard: camera requires HTTPS (except localhost)
    if (!window.isSecureContext) {
      setError(
        "Camera access requires a secure connection (HTTPS). See setup instructions in the README.",
      );
      return;
    }

    // Permission-first pattern: prompt for camera access, then enumerate
    // so device.label is populated (browsers hide labels until permission granted)
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        stream.getTracks().forEach((track) => track.stop()); // stop immediately — just needed permission
        return navigator.mediaDevices.enumerateDevices();
      })
      .then((allDevices) => {
        const videoDevices = allDevices.filter((d) => d.kind === "videoinput");
        setDevices(videoDevices);
        if (videoDevices.length > 0)
          setSelectedDeviceId(videoDevices[0].deviceId);
      })
      .catch((err) => {
        console.error("Camera permission denied or device error:", err);
        setError(
          "Camera permission denied. Please allow camera access and reload.",
        );
      });

    socketRef.current = io(SOCKET_URL);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const startStream = (deviceId) => {
    setError("");
    navigator.mediaDevices
      .getUserMedia({ video: { deviceId }, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;

        const peerConnection = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        stream
          .getTracks()
          .forEach((track) => peerConnection.addTrack(track, stream));

        peerConnection
          .createOffer()
          .then((offer) => peerConnection.setLocalDescription(offer))
          .then(() => {
            const device = devices.find((d) => d.deviceId === deviceId);
            const name = device ? device.label : "Unknown Device";
            setDeviceName(name);
            socketRef.current.emit("offer", {
              offer: peerConnection.localDescription,
              deviceName: name,
            });
          });

        peerConnection.onicecandidate = (event) => {
          if (event.candidate)
            socketRef.current.emit("candidate", event.candidate);
        };

        socketRef.current.on("answer", ({ answer }) => {
          if (answer?.type && answer?.sdp) {
            peerConnection
              .setRemoteDescription(new RTCSessionDescription(answer))
              .catch(console.error);
          } else {
            console.error("Invalid answer received:", answer);
          }
        });

        socketRef.current.on("candidate", (candidate) => {
          if (candidate) {
            peerConnection
              .addIceCandidate(new RTCIceCandidate(candidate))
              .catch(console.error);
          }
        });

        peerConnectionRef.current = peerConnection;
        setStreaming(true);
      })
      .catch((err) => {
        console.error("Error accessing camera:", err);
        setError(
          "Could not access the selected camera. Check permissions and try again.",
        );
      });
  };

  const stopStream = () => {
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      localVideoRef.current.srcObject = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    socketRef.current.emit("stop");
    setStreaming(false);
    setDeviceName("");
  };

  const handleDeviceChange = (e) => {
    const newId = e.target.value;
    setSelectedDeviceId(newId);
    if (streaming) stopStream();
    startStream(newId);
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{
        fontFamily: "'Barlow', sans-serif",
        background: "#f0ebe3",
        color: "#2a2118",
      }}>
      <AppHeader />

      <main
        className="flex flex-1 flex-col p-8 gap-6"
        style={{ maxWidth: 860, width: "100%", margin: "0 auto" }}>
        {/* Page title */}
        <div>
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#c17f3a",
              marginBottom: 4,
            }}>
            Camera Streaming
          </div>
          <h1
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#2a2118",
            }}>
            Send Stream
          </h1>
          <p
            style={{
              fontSize: 13,
              fontWeight: 300,
              color: "#8a7a6a",
              marginTop: 6,
              lineHeight: 1.7,
            }}>
            Use this page on a camera device (e.g. your phone). The stream will
            be received on the Detection page in Live Feed mode.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 12,
              letterSpacing: "0.06em",
              color: "#b85c3a",
              background: "rgba(184,92,58,0.08)",
              border: "1px solid rgba(184,92,58,0.3)",
              borderRadius: 2,
              padding: "12px 16px",
            }}>
            {error}
          </div>
        )}

        {/* Camera selector */}
        {!error && (
          <div
            style={{
              background: "#e8e0d5",
              border: "1px solid #d4c8b8",
              borderTop: "3px solid #2a2118",
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}>
            <label
              htmlFor="videoSource"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#8a7a6a",
                flexShrink: 0,
              }}>
              Select Camera
            </label>

            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <select
                id="videoSource"
                value={selectedDeviceId}
                onChange={handleDeviceChange}
                disabled={streaming}
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  background: "#f0ebe3",
                  border: "1px solid #c8bca8",
                  borderRadius: 2,
                  padding: "8px 36px 8px 12px",
                  color: "#2a2118",
                  outline: "none",
                  width: "100%",
                  cursor: streaming ? "not-allowed" : "pointer",
                  appearance: "none",
                  opacity: streaming ? 0.5 : 1,
                }}>
                {devices.length === 0 ? (
                  <option>No cameras found</option>
                ) : (
                  devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${d.deviceId.slice(0, 8)}...`}
                    </option>
                  ))
                )}
              </select>
              <svg
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none">
                <path
                  d="M1 1l4 4 4-4"
                  stroke="#8a7a6a"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Start / Stop */}
            {streaming ? (
              <button
                className="bqd-btn-danger"
                onClick={stopStream}
                style={{ flexShrink: 0, padding: "8px 20px", fontSize: 12 }}>
                Stop Stream
              </button>
            ) : (
              <button
                className="bqd-btn-primary"
                onClick={() => startStream(selectedDeviceId)}
                disabled={!selectedDeviceId || devices.length === 0}
                style={{ flexShrink: 0, opacity: selectedDeviceId ? 1 : 0.5 }}>
                Start Stream
              </button>
            )}

            {/* Live indicator */}
            <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: streaming ? "#6ab04c" : "#8a7a6a",
                  boxShadow: streaming ? "0 0 6px #6ab04c" : "none",
                  transition: "all 0.3s",
                }}
              />
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: streaming ? "#6ab04c" : "#8a7a6a",
                }}>
                {streaming ? "Live" : "Offline"}
              </span>
            </div>
          </div>
        )}

        {/* Video preview */}
        {!error && (
          <div
            style={{
              background: "#e8e0d5",
              border: "1px solid #d4c8b8",
              borderTop: "3px solid #c17f3a",
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              flex: 1,
            }}>
            <div className="flex items-center justify-between">
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#8a7a6a",
                }}>
                Local Preview
              </div>
              {deviceName && (
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 11,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#c17f3a",
                  }}>
                  {deviceName}
                </span>
              )}
            </div>

            <div
              className="bqd-dropzone"
              style={{ flex: 1, minHeight: 320, position: "relative" }}>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
              {!streaming && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}>
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <rect
                      x="3"
                      y="10"
                      width="30"
                      height="20"
                      rx="2"
                      stroke="#c8bca8"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx="18"
                      cy="20"
                      r="5"
                      stroke="#c8bca8"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M12 10l2-4h8l2 4"
                      stroke="#c8bca8"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 12,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "#8a7a6a",
                    }}>
                    Select a camera and press Start Stream
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
