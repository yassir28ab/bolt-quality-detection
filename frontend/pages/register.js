import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useRouter } from "next/router";
import { AppHeader } from "../components/AppHeader";
import { AppFooter } from "../components/AppFooter";
import { BoltIcon } from "../components/BoltIcon";
import { registerUser } from "../lib/api";

const validationSchema = Yup.object().shape({
  username: Yup.string().required("Username is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export default function RegisterPage() {
  const router = useRouter();

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    try {
      const res = await registerUser(values);
      const data = await res.json();
      if (res.ok) {
        router.push("/login");
      } else {
        setStatus(data.message || "Registration failed. Please try again.");
      }
    } catch {
      setStatus("Server error. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
        className="flex flex-1 items-center justify-center gap-16 px-10 py-16"
        style={{ background: "#2a2118" }}>
        {/* Left: decorative panel */}
        <div className="hidden lg:flex flex-col items-center gap-6">
          <BoltIcon size={80} />
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#3d3028",
                marginBottom: 6,
              }}>
              Bolt Quality Detection
            </div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "#f0ebe3",
                lineHeight: 1.1,
              }}>
              New
              <br />
              <span style={{ color: "#c17f3a" }}>Operator</span>
            </div>
          </div>
          <div style={{ width: 1, height: 80, background: "#3d3028" }} />
          {["Full System Access", "Shift Reporting", "Detection History"].map(
            (t) => (
              <div key={t} className="flex items-center gap-2">
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#c17f3a",
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 12,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#8a7a6a",
                  }}>
                  {t}
                </span>
              </div>
            ),
          )}
        </div>

        {/* Right: form card */}
        <div
          style={{
            background: "#f0ebe3",
            border: "1px solid #d4c8b8",
            borderTop: "3px solid #c17f3a",
            borderRadius: 2,
            padding: "36px 32px",
            width: "100%",
            maxWidth: 400,
          }}>
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#c17f3a",
              marginBottom: 6,
            }}>
            New Account
          </div>
          <h2
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#2a2118",
              marginBottom: 28,
            }}>
            Register
          </h2>

          <Formik
            initialValues={{ username: "", password: "" }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}>
            {({ isSubmitting, status }) => (
              <Form
                style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <label
                    htmlFor="username"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "#8a7a6a",
                      display: "block",
                      marginBottom: 6,
                    }}>
                    Username
                  </label>
                  <Field
                    id="username"
                    name="username"
                    type="text"
                    placeholder="choose a username"
                    className="bqd-input"
                  />
                  <ErrorMessage
                    name="username"
                    component="div"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 11,
                      color: "#b85c3a",
                      marginTop: 4,
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "#8a7a6a",
                      display: "block",
                      marginBottom: 6,
                    }}>
                    Password
                  </label>
                  <Field
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    className="bqd-input"
                  />
                  <ErrorMessage
                    name="password"
                    component="div"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 11,
                      color: "#b85c3a",
                      marginTop: 4,
                    }}
                  />
                </div>

                {status && (
                  <div
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 12,
                      color: "#b85c3a",
                      background: "rgba(184,92,58,0.08)",
                      border: "1px solid rgba(184,92,58,0.3)",
                      borderRadius: 2,
                      padding: "8px 12px",
                    }}>
                    {status}
                  </div>
                )}

                <button
                  type="submit"
                  className="bqd-btn-primary"
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    marginTop: 4,
                    opacity: isSubmitting ? 0.6 : 1,
                  }}>
                  {isSubmitting ? "Registering..." : "Create Account"}
                </button>

                <div style={{ height: 1, background: "#d4c8b8" }} />

                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 12,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#8a7a6a",
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                    padding: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#c17f3a";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#8a7a6a";
                  }}>
                  Already registered? Log in here
                </button>
              </Form>
            )}
          </Formik>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
