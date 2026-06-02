"use client";

import { useState } from "react";
import Link from "next/link";

const BG = "#0c0e1c";
const AMBER = "#d4a843";
const AMBER_LIGHT = "#e5c06a";
const CARD = "#12152a";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED = "#7a8299";
const TEXT = "#f0f0f5";

function IconDashboard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={AMBER} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={AMBER} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IconCard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={AMBER} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}
function IconBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={AMBER} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export default function LandingPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) { setError("יש למלא שם וטלפון"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
    });
    setLoading(false);
    if (res.ok) setSent(true);
    else setError("משהו השתבש, נסי שוב");
  }

  return (
    <div dir="rtl" style={{ background: BG, color: TEXT, minHeight: "100vh", fontFamily: "inherit" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&display=swap');`}</style>

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.75rem 1.5rem",
        background: "rgba(12,14,28,0.7)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <Link href="/login" style={{ fontSize: "0.82rem", color: MUTED, textDecoration: "none" }}>
          כניסה למערכת
        </Link>
        <a href="#contact" style={{
          fontSize: "0.82rem", fontWeight: 700,
          background: "rgba(212,168,67,0.12)", color: AMBER,
          padding: "0.4rem 1rem", borderRadius: "2rem",
          textDecoration: "none", border: `1px solid rgba(212,168,67,0.25)`,
        }}>
          דברי איתנו
        </a>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "5rem 1.25rem 3rem",
        textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        {/* Glow background */}
        <div style={{
          position: "absolute", top: "35%", left: "50%", transform: "translate(-50%, -50%)",
          width: 600, height: 600, borderRadius: "50%", pointerEvents: "none",
          background: "radial-gradient(circle, rgba(212,168,67,0.08) 0%, transparent 65%)",
        }} />

        {/* Logo */}
        <div style={{ marginBottom: "1rem" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-icon-small.png" alt="Good Night" style={{ width: 160, height: "auto" }} />
        </div>

        {/* Brand name */}
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "2.8rem", fontWeight: 600,
          color: AMBER, lineHeight: 1, marginBottom: "0.4rem", letterSpacing: "0.03em",
        }}>
          good night
        </div>

        {/* Hebrew tagline under brand */}
        <div style={{ color: TEXT, fontSize: "0.85rem", marginBottom: "2rem", opacity: 0.75, letterSpacing: "0.07em" }}>
          ניהול אירוח בראש שקט
        </div>

        {/* Main headline */}
        <h1 style={{
          fontSize: "clamp(1.35rem, 5vw, 1.9rem)", fontWeight: 800,
          lineHeight: 1.4, margin: "0 0 0.85rem", maxWidth: 460,
        }}>
          כל ההזמנות. כל התשלומים.{" "}
          <span style={{ display: "inline" }}>הכל במקום אחד.</span>
        </h1>

        {/* Ornamental divider */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.75rem",
          margin: "0 auto 1.5rem", width: "min(260px, 75%)",
        }}>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, rgba(212,168,67,0.45))` }} />
          <span style={{ color: AMBER, fontSize: "0.7rem" }}>✦</span>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, rgba(212,168,67,0.45))` }} />
        </div>

        {/* Description */}
        <p style={{ color: MUTED, fontSize: "0.92rem", lineHeight: 1.85, maxWidth: 360, margin: "0 auto 2rem" }}>
          מערכת חכמה לניהול מתחמי אירוח וצימרים.{" "}
          פשוטה להפעלה, מדויקת בניהול,{" "}
          <span style={{ color: AMBER, fontWeight: 600 }}>שקטה בראש.</span>
        </p>

        {/* Feature icons row */}
        <div style={{
          display: "flex", gap: "0.5rem", justifyContent: "center",
          marginBottom: "2.5rem", flexWrap: "wrap",
        }}>
          {[
            { icon: <IconDashboard />, label: "דשבורד ברור ונוח" },
            { icon: <IconCalendar />, label: "תפוסה בזמן אמת" },
            { icon: <IconCard />, label: "מעקב תשלומים" },
            { icon: <IconBell />, label: "תזכורות אוטומטיות" },
          ].map((f, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${BORDER}`,
              borderRadius: "2rem",
              padding: "0.45rem 0.9rem 0.45rem 0.55rem",
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "rgba(212,168,67,0.09)",
                border: `1px solid rgba(212,168,67,0.18)`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {f.icon}
              </div>
              <span style={{ fontSize: "0.78rem", color: TEXT, whiteSpace: "nowrap" }}>{f.label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <a href="#contact" style={{
          display: "inline-flex", alignItems: "center", gap: "0.6rem",
          background: `linear-gradient(135deg, ${AMBER_LIGHT}, ${AMBER})`,
          color: "#1a1000",
          padding: "1rem 2.5rem", borderRadius: "4rem",
          fontWeight: 700, fontSize: "1.05rem", textDecoration: "none",
          boxShadow: "0 4px 32px rgba(212,168,67,0.3)",
          marginBottom: "1.25rem",
        }}>
          הזמינו הדגמה אישית
          <span>←</span>
        </a>

        {/* Trust */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", color: MUTED }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          הקמה מהירה • ליווי אישי • תמיכה אמיתית
        </div>
      </section>

      {/* ── Pain ───────────────────────────────────────────────── */}
      <section style={{
        padding: "3rem 1.25rem",
        background: "linear-gradient(180deg, rgba(212,168,67,0.03) 0%, transparent 100%)",
        borderTop: `1px solid ${BORDER}`,
      }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <p style={{ textAlign: "center", color: MUTED, fontSize: "0.8rem", marginBottom: "0.4rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            מכירה את זה?
          </p>
          <h2 style={{ textAlign: "center", fontSize: "1.45rem", fontWeight: 800, marginBottom: "2rem" }}>
            ניהול ידני עולה ביוקר
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              { icon: "📋", text: "גיליון אקסל מבולגן + הזמנות בוואטסאפ שהולכות לאיבוד" },
              { icon: "😰", text: "הזמנה כפולה שמתגלה ברגע האחרון — מביכה ועולה כסף" },
              { icon: "⏰", text: "שעות ניהול ידני בשבוע שיכולות להיות מוקדשות לאורחים" },
            ].map((p, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "1rem",
                background: CARD, border: `1px solid ${BORDER}`,
                borderRadius: "1rem", padding: "1rem 1.25rem",
              }}>
                <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>{p.icon}</span>
                <p style={{ fontSize: "0.87rem", color: MUTED, lineHeight: 1.65, margin: 0 }}>{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section style={{ padding: "3rem 1.25rem", borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <p style={{ textAlign: "center", color: AMBER, fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.4rem", letterSpacing: "0.06em" }}>
            הפתרון
          </p>
          <h2 style={{ textAlign: "center", fontSize: "1.45rem", fontWeight: 800, marginBottom: "2rem" }}>
            כל מה שצריך, במקום אחד
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              { icon: "📅", title: "יומן תפוסה חכם", desc: "ראי את כל המתחם בהצצה — מי נכנס, מי יוצא, מה פנוי" },
              { icon: "⚡", title: "פעולות מהירות", desc: "אישור, גביה, ביטול — בלחיצה אחת, בלי לבזבז זמן" },
              { icon: "⚠️", title: "זיהוי חפיפות אוטומטי", desc: "המערכת מתריעה כשיש הזמנות חופפות — לפני שזה הופך לבעיה" },
              { icon: "📱", title: "מהטלפון, מכל מקום", desc: "עובד מושלם על מובייל — בלי מחשב, בלי כבלים" },
            ].map((f, i) => (
              <div key={i} style={{
                display: "flex", gap: "1rem", alignItems: "flex-start",
                background: `linear-gradient(135deg, ${CARD} 0%, #1a1f35 100%)`,
                border: `1px solid ${BORDER}`,
                borderRadius: "1.1rem", padding: "1.1rem 1.25rem",
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: "0.65rem", flexShrink: 0,
                  background: "rgba(212,168,67,0.1)",
                  border: `1px solid rgba(212,168,67,0.22)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.15rem",
                }}>
                  {f.icon}
                </div>
                <div>
                  <p style={{ fontWeight: 700, marginBottom: "0.2rem", fontSize: "0.9rem" }}>{f.title}</p>
                  <p style={{ color: MUTED, fontSize: "0.82rem", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────── */}
      <section style={{ padding: "3rem 1.25rem", borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: "1.45rem", fontWeight: 800, marginBottom: "0.4rem" }}>
            מחירון פשוט וברור
          </h2>
          <p style={{ textAlign: "center", color: MUTED, fontSize: "0.85rem", marginBottom: "2rem" }}>
            ₪0 עמלה על הזמנה · ללא הפתעות
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "1.25rem", padding: "1.35rem" }}>
              <p style={{ color: MUTED, fontSize: "0.78rem", marginBottom: "0.4rem", fontWeight: 600 }}>הקמה חד-פעמית</p>
              <p style={{ fontSize: "1.85rem", fontWeight: 800, color: TEXT, margin: "0 0 0.25rem" }}>₪1,990</p>
              <p style={{ color: MUTED, fontSize: "0.8rem", margin: 0 }}>הגדרת מערכת מלאה + הדרכה אישית</p>
            </div>
            <div style={{
              background: `linear-gradient(135deg, rgba(212,168,67,0.07) 0%, rgba(212,168,67,0.02) 100%)`,
              border: `2px solid ${AMBER}`,
              borderRadius: "1.25rem", padding: "1.35rem", position: "relative",
            }}>
              <div style={{
                position: "absolute", top: "-0.7rem", right: "1rem",
                background: AMBER, color: "#1a1000",
                fontSize: "0.68rem", fontWeight: 800,
                padding: "0.2rem 0.75rem", borderRadius: "2rem",
              }}>
                ✦ הכי פופולרי
              </div>
              <p style={{ color: MUTED, fontSize: "0.78rem", marginBottom: "0.4rem", fontWeight: 600 }}>מנוי חודשי</p>
              <p style={{ fontSize: "1.85rem", fontWeight: 800, color: AMBER, margin: "0 0 0.25rem" }}>
                ₪199<span style={{ fontSize: "0.88rem", fontWeight: 400, color: MUTED }}>/חודש</span>
              </p>
              <p style={{ color: MUTED, fontSize: "0.8rem", margin: 0 }}>ניהול הזמנות, תשלומים, יומן תפוסה</p>
            </div>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "1.25rem", padding: "1.35rem" }}>
              <p style={{ color: MUTED, fontSize: "0.78rem", marginBottom: "0.4rem", fontWeight: 600 }}>מנוי שנתי</p>
              <p style={{ fontSize: "1.85rem", fontWeight: 800, color: TEXT, margin: "0 0 0.25rem" }}>
                ₪1,990<span style={{ fontSize: "0.88rem", fontWeight: 400, color: MUTED }}>/שנה</span>
              </p>
              <p style={{ color: "#4ade80", fontSize: "0.8rem", fontWeight: 600, margin: 0 }}>✓ חודשיים מתנה לעומת מנוי חודשי</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact Form ───────────────────────────────────────── */}
      <section id="contact" style={{
        padding: "3rem 1.25rem",
        background: `linear-gradient(180deg, transparent, rgba(212,168,67,0.04))`,
        borderTop: `1px solid ${BORDER}`,
      }}>
        <div style={{ maxWidth: 420, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: "1.45rem", fontWeight: 800, marginBottom: "0.4rem" }}>
            רוצה לשמוע עוד?
          </h2>
          <p style={{ textAlign: "center", color: MUTED, fontSize: "0.88rem", marginBottom: "2rem" }}>
            השאירי פרטים ואחזור אלייך תוך יום עסקים
          </p>

          {sent ? (
            <div style={{
              background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.22)",
              borderRadius: "1.25rem", padding: "2.5rem", textAlign: "center",
            }}>
              <p style={{ fontSize: "2rem", margin: "0 0 0.5rem" }}>✓</p>
              <p style={{ fontWeight: 700, color: "#4ade80", marginBottom: "0.25rem" }}>הפרטים נשלחו!</p>
              <p style={{ color: MUTED, fontSize: "0.85rem", margin: 0 }}>נחזור אלייך בהקדם</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{
              background: CARD, border: `1px solid ${BORDER}`,
              borderRadius: "1.25rem", padding: "1.5rem",
              display: "flex", flexDirection: "column", gap: "1rem",
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: MUTED, display: "block", marginBottom: "0.35rem" }}>שם מלא *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="שם ומשפחה"
                    style={{
                      width: "100%", padding: "0.7rem 0.9rem",
                      borderRadius: "0.65rem", fontSize: "0.88rem",
                      background: BG, border: `1px solid ${BORDER}`,
                      color: TEXT, outline: "none", boxSizing: "border-box",
                    }} />
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", color: MUTED, display: "block", marginBottom: "0.35rem" }}>טלפון *</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="050-0000000"
                    style={{
                      width: "100%", padding: "0.7rem 0.9rem",
                      borderRadius: "0.65rem", fontSize: "0.88rem",
                      background: BG, border: `1px solid ${BORDER}`,
                      color: TEXT, outline: "none", boxSizing: "border-box",
                    }} />
                </div>
              </div>
              {error && <p style={{ color: "#f87171", fontSize: "0.82rem", margin: 0 }}>{error}</p>}
              <button type="submit" disabled={loading} style={{
                background: `linear-gradient(135deg, ${AMBER_LIGHT}, ${AMBER})`,
                color: "#1a1000", padding: "0.85rem",
                borderRadius: "0.75rem", fontWeight: 700, fontSize: "0.95rem",
                border: "none", cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                boxShadow: "0 4px 15px rgba(212,168,67,0.28)",
              }}>
                {loading ? "שולח..." : "שלחי פרטים ←"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: "1.5rem 1.25rem", textAlign: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-wide1.neto.svg" alt="Good Night" style={{ height: 36, opacity: 0.45, marginBottom: "0.75rem" }} />
        <p style={{ color: MUTED, fontSize: "0.78rem", margin: 0 }}>
          © 2026 Good Night · כל הזכויות שמורות
        </p>
      </footer>
    </div>
  );
}
