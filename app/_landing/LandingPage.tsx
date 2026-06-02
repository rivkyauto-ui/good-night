"use client";

import { useState } from "react";

const BG = "#0c0e1c";
const AMBER = "#e5af5c";
const AMBER_LIGHT = "#ecca85";
const CARD = "#12152a";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED = "#7a8299";
const TEXT = "#f0f0f5";

// טיפוגרפיה קבועה
const FS_H1 = "1.6rem";     // כותרת ראשית
const FS_H2 = "1.05rem";    // כותרת משנית / תיאור
const FS_BODY = "0.85rem";  // גוף


export default function LandingPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: { preventDefault(): void }) {
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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;800&family=Cormorant+Garamond:wght@600&display=swap');`}</style>


      {/* ── Hero ───────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "2rem 1.25rem 3rem",
        textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        {/* Glow background */}
        <div style={{
          position: "absolute", top: "35%", left: "50%", transform: "translate(-50%, -50%)",
          width: 600, height: 600, borderRadius: "50%", pointerEvents: "none",
          background: "radial-gradient(circle, rgba(212,168,67,0.08) 0%, transparent 65%)",
        }} />

        {/* Logo */}
        <div style={{ marginBottom: "2.5rem" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-icon-small.png" alt="Good Night" style={{ width: 280, height: "auto" }} />
        </div>

        {/* Main headline */}
        <h1 style={{
          fontFamily: "'Heebo', sans-serif",
          fontSize: FS_H1, fontWeight: 800,
          lineHeight: 1.3, margin: "0 0 0", maxWidth: 460,
        }}>
          כל ההזמנות. כל התשלומים.<br />
          <span style={{ color: AMBER }}>במקום אחד.</span>
        </h1>

        {/* Ornamental divider */}
        <div style={{ margin: "2rem auto 2.75rem", width: "min(320px, 88%)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/divider-glow.svg" alt="" style={{ width: "100%", height: "auto", opacity: 0.75 }} />
        </div>

        {/* Description */}
        <p style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 400, color: MUTED, fontSize: FS_H2, lineHeight: 1.85, maxWidth: 360, margin: "0 auto 2rem" }}>
          מערכת חכמה לבעלי מתחמי אירוח שמאפשרת לנהל את העסק בראש שקט.<br />
          פחות זמן על ניהול שוטף.{" "}
          <span style={{ color: AMBER, fontWeight: 600 }}>יותר זמן לארח.</span>
        </p>

        {/* Feature icons row */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: "1rem", marginBottom: "2.5rem",
          width: "100%", maxWidth: 400,
        }}>
          {[
            { icon: "/icons/chart.svg",    title: "ניהול בראש שקט",     desc: "כל הנתונים החשובים במקום אחד." },
            { icon: "/icons/calendar.svg", title: "זמינות מלאה",        desc: "התפוסה מתעדכנת בזמן אמת." },
            { icon: "/icons/card.svg",     title: "שליטה בתשלומים",     desc: "מעקב ברור אחר גביה וטיפול בהחזרים." },
            { icon: "/icons/bell.svg",     title: "בלי פספוסים",        desc: "תזכורות אוטומטיות לפעולות החשובות." },
          ].map((f, i) => (
            <div key={i} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: "0.5rem", padding: "1rem 0.75rem",
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${BORDER}`, borderRadius: "1rem",
              textAlign: "center",
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.icon} alt="" width={26} height={26} />
              <span style={{ fontSize: FS_BODY, fontWeight: 700, color: TEXT }}>{f.title}</span>
              <span style={{ fontSize: FS_BODY, color: MUTED, lineHeight: 1.5 }}>{f.desc}</span>
            </div>
          ))}
        </div>

        {/* Trust */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: FS_BODY, color: MUTED, marginBottom: "1.25rem" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/shield_check_gold.svg" alt="" width={16} height={16} />
          הקמה מהירה
          <span style={{ color: AMBER }}>•</span>
          ליווי אישי
          <span style={{ color: AMBER }}>•</span>
          תמיכה אמיתית
        </div>

        {/* CTA */}
        <a href="#contact" style={{
          display: "inline-flex", alignItems: "center", gap: "0.6rem",
          background: `linear-gradient(135deg, ${AMBER_LIGHT}, ${AMBER})`,
          color: "#1a1000",
          padding: "1rem 2.5rem", borderRadius: "4rem",
          fontWeight: 700, fontSize: "1.05rem", textDecoration: "none",
          boxShadow: "0 4px 32px rgba(212,168,67,0.3)",
        }}>
          מעניין אותי
          <span style={{ fontSize: "1.9rem", lineHeight: 1, display: "flex", alignItems: "center", position: "relative", top: "-2px" }}>›</span>
        </a>
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

      {/* ── Dashboard Preview Intro ────────────────────────────── */}
      <section style={{
        padding: "4.5rem 1.25rem 4.75rem",
        borderTop: `1px solid ${BORDER}`,
        background: "linear-gradient(180deg, rgba(244,212,132,0.025) 0%, rgba(12,14,28,0) 58%)",
      }}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <div style={{ margin: "0 auto 2rem", width: "min(340px, 86%)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/divider-glow.svg" alt="" style={{ width: "100%", height: "auto", opacity: 0.82 }} />
          </div>

          <p style={{
            color: "#D4A843",
            fontSize: "0.78rem",
            fontWeight: 800,
            letterSpacing: "0.08em",
            margin: "0 0 0.65rem",
          }}>
            כך זה נראה בפועל
          </p>

          <h2 style={{
            color: "#f8fafc",
            fontSize: "clamp(1.55rem, 7vw, 2.35rem)",
            fontWeight: 800,
            lineHeight: 1.28,
            maxWidth: 540,
            margin: "0 auto 1rem",
          }}>
            כל מה שצריך כדי לנהל אירוח{" "}
            <span style={{ color: "#F4D484" }}>בראש שקט</span>
          </h2>

          <p style={{
            color: "#8f9ab3",
            fontSize: "0.96rem",
            lineHeight: 1.85,
            maxWidth: 430,
            margin: "0 auto",
          }}>
            הזמנות, תפוסה, תשלומים ומשימות — במסך אחד ברור ונוח לשימוש.
          </p>
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
