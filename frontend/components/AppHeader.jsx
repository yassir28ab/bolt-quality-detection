import { useRouter } from "next/router";
import { useAuth } from "../contexts/authContext";
import { BoltIcon } from "./BoltIcon";

export function AppHeader({ extras }) {
  const router = useRouter();
  const { isAuthenticated, logout, userName } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/home");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@300;400;500&display=swap');
      `}</style>

      <header
        className="w-full flex justify-between items-center px-7 shrink-0"
        style={{
          fontFamily: "'Barlow', sans-serif",
          background: "#2a2118",
          borderBottom: "3px solid #c17f3a",
          height: 58,
        }}>
        {/* ── Logo ── */}
        <button
          onClick={() => router.push("/home")}
          className="flex items-center gap-3"
          style={{ background: "none", border: "none", cursor: "pointer" }}>
          <BoltIcon size={32} />
          <div style={{ textAlign: "left" }}>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: 20,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#f0ebe3",
              }}>
              Bolt <span style={{ color: "#c17f3a" }}>QD</span>
            </div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#8a7a6a",
              }}>
              Quality Detection System
            </div>
          </div>
        </button>

        {/* ── Right side ── */}
        <nav className="flex items-center gap-2">
          {extras}

          {extras && (
            <div
              style={{
                width: 1,
                height: 20,
                background: "#c17f3a",
                opacity: 0.3,
                margin: "0 4px",
              }}
            />
          )}

          {isAuthenticated && (
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 13,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#c17f3a",
                marginRight: 4,
              }}>
              @{userName}
            </span>
          )}

          <div
            style={{
              width: 1,
              height: 20,
              background: "#c17f3a",
              opacity: 0.3,
              margin: "0 4px",
            }}
          />

          <button
            className="bqd-btn-ghost"
            onClick={() => router.push("/help")}>
            Help
          </button>

          {isAuthenticated ? (
            <button className="bqd-btn-danger" onClick={handleLogout}>
              Log Out
            </button>
          ) : (
            <button
              className="bqd-btn-login"
              onClick={() => router.push("/login")}>
              Log In
            </button>
          )}
        </nav>
      </header>
    </>
  );
}
