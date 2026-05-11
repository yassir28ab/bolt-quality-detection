import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { SOCKET_URL } from "../lib/api";

function ProcessLiveStream() {
  const remoteVideoRef = useRef(null);
  const processedVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const socketRef = useRef(null);

  const [remoteDeviceName, setRemoteDeviceName] = useState("");
  const [connected, setConnected] = useState(false);
  const [confidence, setConfidence] = useState(0.1);
  const [nmsThreshold, setNmsThreshold] = useState(0.45);

  const confidenceRef = useRef(confidence);
  const nmsThresholdRef = useRef(nmsThreshold);

  useEffect(() => {
    confidenceRef.current = confidence;
  }, [confidence]);
  useEffect(() => {
    nmsThresholdRef.current = nmsThreshold;
  }, [nmsThreshold]);

  const setDefaultYoloParameters = () => {
    setConfidence(0.1);
    setNmsThreshold(0.45);
  };

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };

    peerConnectionRef.current = new RTCPeerConnection(configuration);

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) socket.emit("candidate", event.candidate);
    };

    peerConnectionRef.current.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream && remoteStream.getVideoTracks().length > 0) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play();
        setConnected(true);

        const sendFrameToServer = () => {
          if (
            !remoteVideoRef.current ||
            remoteVideoRef.current.readyState !== 4
          )
            return;
          const canvas = document.createElement("canvas");
          canvas.width = remoteVideoRef.current.videoWidth;
          canvas.height = remoteVideoRef.current.videoHeight;
          canvas
            .getContext("2d")
            .drawImage(
              remoteVideoRef.current,
              0,
              0,
              canvas.width,
              canvas.height,
            );
          socket.emit("frame", {
            dataURL: canvas.toDataURL("image/jpeg"),
            confidence: confidenceRef.current,
            nmsThreshold: nmsThresholdRef.current,
          });
        };

        frameIntervalRef.current = setInterval(sendFrameToServer, 100);
      }
    };

    socket.on("processedFrame", (data) => {
      const img = new Image();
      img.src = data;
      img.onload = () => {
        const canvas = processedVideoRef.current;
        if (!canvas) return;
        canvas
          .getContext("2d")
          .drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    });

    socket.on("offer", async ({ offer, deviceName }) => {
      setRemoteDeviceName(deviceName);
      try {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(offer),
        );
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socket.emit("answer", {
          answer: peerConnectionRef.current.localDescription,
          deviceName,
        });
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    });

    socket.on("candidate", (candidate) => {
      if (candidate) {
        peerConnectionRef.current
          .addIceCandidate(new RTCIceCandidate(candidate))
          .catch(console.error);
      }
    });

    // Server-initiated stop (e.g. sender disconnects)
    socket.on("stop", () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.pause();
        remoteVideoRef.current.srcObject = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      setConnected(false);
      socket.emit("stopped");
    });

    return () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      if (peerConnectionRef.current) peerConnectionRef.current.close();
      socket.off("offer");
      socket.off("candidate");
      socket.off("processedFrame");
      socket.off("stop");
      socket.disconnect();
    };
  }, []); // ← empty: WebRTC setup runs once only

  return (
    <main
      className="flex-1 flex flex-col p-8 gap-6"
      style={{ fontFamily: "'Barlow', sans-serif", background: "#f0ebe3" }}>
      {/* Status bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: connected ? "#6ab04c" : "#8a7a6a",
            boxShadow: connected ? "0 0 6px #6ab04c" : "none",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: connected ? "#6ab04c" : "#8a7a6a",
          }}>
          {connected ? "Stream Active" : "Awaiting Connection"}
        </span>
        {remoteDeviceName && (
          <>
            <div style={{ width: 1, height: 12, background: "#d4c8b8" }} />
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#8a7a6a",
              }}>
              Device: {remoteDeviceName}
            </span>
          </>
        )}
        {connected && (
          <>
            <div style={{ width: 1, height: 12, background: "#d4c8b8" }} />
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#8a7a6a",
              }}>
              To stream from a phone, open{" "}
              <span style={{ color: "#c17f3a" }}>
                {typeof window !== "undefined" ? window.location.hostname : ""}
                :3000/send-stream
              </span>
            </span>
          </>
        )}
      </div>

      {/* Video panels */}
      <div className="grid grid-cols-2 gap-6" style={{ flex: 1 }}>
        {/* Input */}
        <div
          style={{
            background: "#e8e0d5",
            border: "1px solid #d4c8b8",
            borderTop: "3px solid #2a2118",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}>
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#8a7a6a",
            }}>
            Live Input Feed
          </div>
          <div
            className="bqd-dropzone"
            style={{ flex: 1, minHeight: 220, position: "relative" }}>
            <video
              ref={remoteVideoRef}
              autoPlay
              muted
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
            {!connected && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 12,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#8a7a6a",
                  }}>
                  No signal
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Output */}
        <div
          style={{
            background: "#e8e0d5",
            border: "1px solid #d4c8b8",
            borderTop: "3px solid #c17f3a",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}>
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#8a7a6a",
            }}>
            Detection Output
          </div>
          <div className="bqd-dropzone" style={{ flex: 1, minHeight: 220 }}>
            <canvas
              ref={processedVideoRef}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
        </div>
      </div>

      {/* YOLO config — inline below panels */}
      <div
        style={{
          background: "#e8e0d5",
          border: "1px solid #d4c8b8",
          borderTop: "3px solid #2a2118",
          padding: "18px 24px",
          display: "flex",
          alignItems: "center",
          gap: 32,
          flexWrap: "wrap",
        }}>
        <span
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#8a7a6a",
            flexShrink: 0,
          }}>
          YOLO Config
        </span>

        {/* Confidence slider */}
        <div
          className="flex items-center gap-3"
          style={{ flex: 1, minWidth: 200 }}>
          <label
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#6a5a4a",
              flexShrink: 0,
            }}>
            Confidence
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={confidence}
            onChange={(e) => setConfidence(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: "#c17f3a" }}
          />
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 13,
              fontWeight: 700,
              color: "#2a2118",
              minWidth: 32,
              textAlign: "right",
            }}>
            {confidence}
          </span>
        </div>

        {/* NMS slider */}
        <div
          className="flex items-center gap-3"
          style={{ flex: 1, minWidth: 200 }}>
          <label
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#6a5a4a",
              flexShrink: 0,
            }}>
            NMS
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={nmsThreshold}
            onChange={(e) => setNmsThreshold(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: "#c17f3a" }}
          />
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 13,
              fontWeight: 700,
              color: "#2a2118",
              minWidth: 32,
              textAlign: "right",
            }}>
            {nmsThreshold}
          </span>
        </div>

        <button
          className="bqd-btn-ghost"
          onClick={setDefaultYoloParameters}
          style={{ flexShrink: 0 }}>
          Reset Defaults
        </button>
      </div>
    </main>
  );
}

export default ProcessLiveStream;
