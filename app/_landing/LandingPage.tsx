"use client";

import { useState } from "react";
import ProductShowcase from "./ProductShowcase";

const BG = "#0c0e1c";
const AMBER = "#e5af5c";
const AMBER_LIGHT = "#ecca85";
const CARD = "#12152a";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED = "#7a8299";
const TEXT = "#f0f0f5";

// טיפוגרפיה קבועה
const FS_H1 = "1.6rem";        // כותרת Hero
const FS_H2 = "1.45rem";       // כותרת סקשן
const FS_SUBTITLE = "1rem";    // תת-כותרת / תיאור
const FS_BODY = "0.88rem";     // גוף, קלט, כרטיסיות
const FS_LABEL = "0.78rem";    // תוויות, כיתובים, פוטר


export default function LandingPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
    <div dir="rtl" style={{ background: BG, color: TEXT, minHeight: "100vh", fontFamily: "'Heebo', sans-serif" }}>
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
        <p style={{ fontWeight: 400, color: MUTED, fontSize: FS_SUBTITLE, lineHeight: 1.85, maxWidth: 360, margin: "0 auto 2rem" }}>
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
          fontWeight: 700, fontSize: FS_SUBTITLE, textDecoration: "none",
          boxShadow: "0 4px 32px rgba(212,168,67,0.3)",
        }}>
          מעניין אותי
          <span style={{ fontSize: "1.9rem", lineHeight: 1, display: "flex", alignItems: "center", position: "relative", top: "-2px" }}>›</span>
        </a>
      </section>

      <ProductShowcase />

      {/* ── Who is it for? ─────────────────────────────────── */}
      <section style={{ position: "relative", padding: "3rem 1.25rem 3.25rem", borderTop: `1px solid ${BORDER}`, overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/tzimar.png"
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center 72%",
            filter: "blur(0px)",
            userSelect: "none", pointerEvents: "none",
          }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(8, 10, 28, 0.72)",
        }} />
        <div style={{ maxWidth: 480, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <p style={{ textAlign: "center", color: AMBER, fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem", letterSpacing: "0.06em" }}>
            Good Night נבנתה במיוחד עבור
          </p>
          <h2 style={{ textAlign: "center", fontSize: FS_H2, fontWeight: 800, color: TEXT, margin: "0 0 2.75rem" }}>
            בעלי צימרים ומתחמי אירוח
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {[
              {
                title: "צימר או יחידת אירוח בודדת",
                desc: "למי שרוצה לנהל פניות, הזמנות ולידים בצורה מסודרת — בלי לפספס אורחים פוטנציאליים ובלי להסתמך על הזיכרון.",
              },
              {
                title: "מתחם אירוח עם מספר יחידות",
                desc: "למי שמתמודד עם ריבוי הזמנות, משימות ותשלומים וצריך תמונת מצב ברורה של כל המתחם במקום אחד.",
              },
            ].map((card, i) => (
              <div key={i} style={{
                display: "flex", gap: "1rem", alignItems: "flex-start",
                background: "linear-gradient(135deg, rgba(24,28,54,0.42) 0%, rgba(30,36,69,0.42) 100%)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "1.1rem", padding: "0.65rem 1.1rem",
                boxShadow: "0 4px 28px rgba(0,0,0,0.5)",
              }}>
                <div style={{
                  width: 46, height: 46, borderRadius: "0.65rem", flexShrink: 0,
                  background: "rgba(212,168,67,0.1)",
                  border: `1px solid rgba(212,168,67,0.28)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ color: AMBER, fontSize: "1.5rem", fontWeight: 700, lineHeight: 1 }}>✓</span>
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: FS_BODY, margin: "0 0 0.2rem" }}>{card.title}</p>
                  <p style={{ color: MUTED, fontSize: FS_BODY, lineHeight: 1.6, margin: 0 }}>{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section style={{ padding: "3rem 1.25rem", borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <p style={{ textAlign: "center", color: AMBER, fontSize: "1rem", fontWeight: 700, marginBottom: "0.4rem", letterSpacing: "0.06em" }}>
            למה דווקא Good Night?
          </p>
          <h2 style={{ textAlign: "center", fontSize: FS_H2, fontWeight: 800, marginBottom: "2rem" }}>
            יותר סדר. פחות התעסקות.
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e5af5c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                ),
                title: "הכל במקום אחד", desc: "הזמנות, תפוסה, תשלומים ומשימות במערכת אחת.",
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e5af5c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                ),
                title: "יותר זמן לפיתוח העסק", desc: "פחות מעקבים ידניים ויותר זמן לאירוח ולפיתוח העסק.",
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e5af5c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                ),
                title: "שליטה בפרטים הקטנים", desc: "פניות, משימות ותשלומים שלא נופלים בין הכיסאות.",
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e5af5c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                  </svg>
                ),
                title: "תמונת מצב ברורה", desc: "לדעת בכל רגע מה קורה במתחם בלי לחפש מידע.",
              },
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
                }}>
                  {f.icon}
                </div>
                <div>
                  <p style={{ fontWeight: 700, marginBottom: "0.2rem", fontSize: FS_BODY }}>{f.title}</p>
                  <p style={{ color: MUTED, fontSize: FS_BODY, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────── */}
      <section style={{ padding: "3rem 1.25rem", borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: FS_H2, fontWeight: 800, marginBottom: "0.4rem" }}>
            עד כאן נשמע מבטיח,<br /><span style={{ color: AMBER }}>תכל&apos;ס כמה יעלה לי?</span>
          </h2>
          <p style={{ textAlign: "center", color: MUTED, fontSize: FS_BODY, marginBottom: "0.75rem" }}>
            בלי הפתעות. בלי חבילות מסובכות.
          </p>
          <p style={{ textAlign: "center", color: MUTED, fontSize: FS_BODY, lineHeight: 1.7, marginBottom: "2rem" }}>
            Good Night מתומחרת לפי מספר יחידות האירוח במתחם,<br /><span style={{ color: AMBER }}>כך שאתם משלמים רק על מה שאתם באמת צריכים.</span>
          </p>
          {/* כותרת משנה */}
          <p style={{ textAlign: "center", color: MUTED, fontSize: "1rem", fontWeight: 700, marginBottom: "2rem", letterSpacing: "0.04em" }}>
            הצטרפות בשני שלבים:
          </p>

          {/* תרשים זרימה */}
          <div style={{ display: "flex", flexDirection: "row", alignItems: "stretch", gap: 0 }}>
            {/* Card 1 – הצטרפות */}
            <div style={{ flex: 1, background: `linear-gradient(135deg, rgba(212,168,67,0.07) 0%, rgba(212,168,67,0.02) 100%)`, border: `2px solid ${AMBER}`, borderRadius: "1.25rem", padding: "1rem" }}>
              {/* מספר שלב */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: AMBER, color: "#000",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.78rem", fontWeight: 800, flexShrink: 0,
                }}>1</div>
                <p style={{ color: MUTED, fontSize: "1rem", fontWeight: 700, margin: 0 }}>כניסה למערכת</p>
              </div>
              <p style={{ fontSize: "1.85rem", fontWeight: 800, color: TEXT, margin: "0 0 0.15rem" }}>₪1,990</p>
              <p style={{ color: MUTED, fontSize: FS_BODY, marginBottom: "1rem" }}>חד פעמי</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                {["פתיחת חשבון", "ליווי והדרכה ראשונית", "התאמת המערכת למתחם שלכם", "תמיכה בתקופת העלייה לאוויר"].map((item) => (
                  <p key={item} style={{ color: MUTED, fontSize: FS_BODY, margin: 0, display: "flex", gap: "0.5rem" }}>
                    <span style={{ color: AMBER, fontWeight: 700 }}>✔</span>{item}
                  </p>
                ))}
              </div>
            </div>

            {/* מרווח */}
            <div style={{ width: "0.75rem", flexShrink: 0 }} />

            {/* Card 2 – מנוי */}
            <div style={{
              flex: 1,
              background: `linear-gradient(135deg, rgba(212,168,67,0.07) 0%, rgba(212,168,67,0.02) 100%)`,
              border: `2px solid ${AMBER}`,
              borderRadius: "1.25rem", padding: "1rem", position: "relative",
            }}>
              {/* מספר שלב */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: AMBER, color: "#000",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.78rem", fontWeight: 800, flexShrink: 0,
                }}>2</div>
                <p style={{ color: MUTED, fontSize: "1rem", fontWeight: 700, margin: 0 }}>מנוי חודשי</p>
              </div>
              <p style={{ fontSize: "1.85rem", fontWeight: 800, color: AMBER, margin: "0 0 0.15rem" }}>
                ₪99<span style={{ fontSize: FS_BODY, fontWeight: 400, color: MUTED }}> ליחידה הראשונה</span>
              </p>
              <p style={{ color: MUTED, fontSize: FS_BODY, marginBottom: "1rem" }}>
                ₪30 לכל יחידה נוספת
              </p>
              <p style={{ color: MUTED, fontSize: FS_LABEL, fontWeight: 600, marginBottom: "0.45rem" }}>לדוגמה:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                {[
                  ["יחידה אחת", "99 ₪"],
                  ["2 יחידות", "129 ₪"],
                  ["3 יחידות", "159 ₪"],
                  ["5 יחידות", "219 ₪"],
                ].map(([label, price]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: FS_BODY, color: MUTED }}>
                    <span>{label}</span>
                    <span style={{ fontWeight: 600, color: TEXT }}>{price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
            {/* שורה תחתונה */}
            <p style={{ color: "#8e96ab", fontSize: "1rem", lineHeight: 1.7, textAlign: "center", margin: "2rem 0 0", fontWeight: 600 }}>
              פתרון ייעודי לעולם הצימרים והאירוח,<br />בעלות נמוכה משמעותית<br />מהקמה ופיתוח של מערכת מותאמת אישית.
            </p>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section style={{ padding: "3rem 1.25rem", borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: FS_H2, fontWeight: 800, marginBottom: "2rem" }}>
            שאלות נפוצות
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              {
                q: "האם המערכת מתאימה גם ליחידת אירוח אחת?",
                a: "כן. המערכת מתאימה גם לבעלי יחידת אירוח בודדת שמעוניינים לנהל את הפעילות בצורה מסודרת.",
              },
              {
                q: "האם אפשר לנהל מספר יחידות במקביל?",
                a: "כן. המערכת נבנתה במיוחד כדי לאפשר תמונת מצב ברורה של כל יחידות האירוח במקום אחד.",
              },
              {
                q: "האם צריך ידע טכני?",
                a: "לא. המערכת תוכננה להיות פשוטה ונוחה לשימוש, גם ללא רקע טכנולוגי.",
              },
              {
                q: "האם המערכת מותאמת לנייד?",
                a: "כן. ניתן לנהל את המתחם מכל מקום באמצעות הטלפון הנייד.",
              },
              {
                q: "האם המערכת מזהה תאריך עברי?",
                a: `כן, המערכת גם מזהה מה הפרשה בכל שבת כדי לסייע בזיהוי סופ"ש מבוקש.`,
              },
              {
                q: "כמה זמן לוקח להתחיל?",
                a: "לאחר ההצטרפות וההדרכה הראשונית, ניתן להתחיל לעבוד במערכת תוך זמן קצר.",
              },
            ].map(({ q, a }, i) => (
              <div
                key={q}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  background: CARD, border: `1px solid ${openFaq === i ? AMBER : BORDER}`,
                  borderRadius: "1.25rem", padding: "1.25rem", cursor: "pointer",
                  transition: "border-color 0.2s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                  <p style={{ fontWeight: 700, fontSize: FS_BODY, color: AMBER, margin: 0 }}>{q}</p>
                  <span style={{ color: AMBER, fontSize: "1.1rem", flexShrink: 0, transition: "transform 0.2s", transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)" }}>
                    ▾
                  </span>
                </div>
                {openFaq === i && (
                  <p style={{ fontSize: FS_BODY, color: MUTED, margin: "0.75rem 0 0", lineHeight: 1.7 }}>{a}</p>
                )}
              </div>
            ))}
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
          <h2 style={{ textAlign: "center", fontSize: FS_H2, fontWeight: 800, marginBottom: "0.4rem", color: AMBER }}>
            לבדיקת התאמה ואפיון צרכים ללא עלות:
          </h2>
          <p style={{ textAlign: "center", color: "#8e96ab", fontSize: "1rem", fontWeight: 600, marginBottom: "2rem" }}>
            כמה פרטים ונחזור אליך בהקדם
          </p>

          {sent ? (
            <div style={{
              background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.22)",
              borderRadius: "1.25rem", padding: "2.5rem", textAlign: "center",
            }}>
              <p style={{ fontSize: "2rem", margin: "0 0 0.5rem" }}>✓</p>
              <p style={{ fontWeight: 700, color: "#4ade80", marginBottom: "0.25rem" }}>הפרטים נשלחו!</p>
              <p style={{ color: MUTED, fontSize: FS_BODY, margin: 0 }}>נחזור אלייך בהקדם</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{
              background: CARD, border: `2px solid ${AMBER}`,
              borderRadius: "1.25rem", padding: "1.5rem",
              display: "flex", flexDirection: "column", gap: "1rem",
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: FS_LABEL, color: MUTED, display: "block", marginBottom: "0.35rem" }}>שם מלא *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="שם ומשפחה"
                    style={{
                      width: "100%", padding: "0.7rem 0.9rem",
                      borderRadius: "0.65rem", fontSize: FS_BODY,
                      background: BG, border: `1px solid ${BORDER}`,
                      color: TEXT, outline: "none", boxSizing: "border-box",
                    }} />
                </div>
                <div>
                  <label style={{ fontSize: FS_LABEL, color: MUTED, display: "block", marginBottom: "0.35rem" }}>טלפון *</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="050-0000000"
                    style={{
                      width: "100%", padding: "0.7rem 0.9rem",
                      borderRadius: "0.65rem", fontSize: FS_BODY,
                      background: BG, border: `1px solid ${BORDER}`,
                      color: TEXT, outline: "none", boxSizing: "border-box",
                    }} />
                </div>
              </div>
              {error && <p style={{ color: "#f87171", fontSize: FS_BODY, margin: 0 }}>{error}</p>}
              <button type="submit" disabled={loading} style={{
                background: `linear-gradient(135deg, ${AMBER_LIGHT}, ${AMBER})`,
                color: "#1a1000", padding: "0.85rem",
                borderRadius: "0.75rem", fontWeight: 700, fontSize: FS_BODY,
                border: "none", cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                boxShadow: "0 4px 15px rgba(212,168,67,0.28)",
              }}>
                {loading ? "שולח..." : "לתיאום בדיקת התאמה ←"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: "1.5rem 1.25rem", textAlign: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-wide1.neto.svg" alt="Good Night" style={{ height: 36, opacity: 0.45, marginBottom: "0.75rem" }} />
        <p style={{ color: MUTED, fontSize: FS_LABEL, margin: 0 }}>
          © 2026 Good Night · כל הזכויות שמורות
        </p>
      </footer>
    </div>
  );
}
