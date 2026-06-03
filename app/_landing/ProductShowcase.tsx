"use client";

import { useState } from "react";

const AMBER  = "#e5af5c";
const BG     = "#0c0e1c";
const CARD   = "#12152a";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED  = "#7a8299";
const TEXT   = "#f0f0f5";

const WORKFLOWS = [
  { id: "dashboard",    title: "דשבורד",       screen: "/screenshots/dashboard.png" },
  { id: "new-booking",  title: "הזמנה חדשה",   screen: "/screenshots/dashboard-parts/screen-new-booking.png" },
  { id: "bookings",     title: "ניהול הזמנות", screen: "/screenshots/dashboard-parts/screen-pending.png" },
  { id: "availability", title: "תפוסה",         screen: "/screenshots/dashboard-parts/screen-availability.png" },
  { id: "billing",      title: "גבייה",         screen: "/screenshots/dashboard-parts/screen-billing.png" },
] as const;

export default function ProductShowcase() {
  const [active, setActive] = useState(0);

  return (
    <section
      dir="rtl"
      style={{ padding: "4.5rem 0 4.75rem", borderTop: `1px solid ${BORDER}` }}
    >
      <style>{`
        .showcase-row::-webkit-scrollbar { display: none; }
        .showcase-row { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>

      {/* ── Intro ──────────────────────────────────────────── */}
      <div style={{ textAlign: "center", marginBottom: "2.75rem", padding: "0 1.25rem" }}>
        <p style={{
          color: AMBER, fontSize: "1rem", fontWeight: 800,
          letterSpacing: "0.1em", margin: "0 0 0.75rem",
        }}>
          כך זה נראה בפועל
        </p>
        <h2 style={{
          fontSize: "1.45rem", fontWeight: 800, color: TEXT,
          margin: "0 0 0.75rem", lineHeight: 1.3,
        }}>
          המערכת שמרכזת את כל הניהול היומיומי
        </h2>
        <p style={{
          color: MUTED, fontSize: "1rem", lineHeight: 1.75,
          margin: "0 auto", maxWidth: 340,
        }}>
          הזמנות, תפוסה, גבייה ומשימות — במסך אחד ברור ונוח לשימוש.
        </p>
      </div>

      {/* ── Main phone ─────────────────────────────────────── */}
      <div style={{
        width: "min(290px, 82%)",
        margin: "0 auto 3rem",
        position: "relative",
      }}>
        {/* Glow */}
        <div style={{
          position: "absolute", inset: "-30% -20%",
          background: "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(229,175,92,0.07) 0%, transparent 100%)",
          pointerEvents: "none", zIndex: 0,
        }} />

        {/* Shell */}
        <div style={{
          position: "relative", zIndex: 1,
          background: BG,
          border: `2px solid ${AMBER}`,
          borderRadius: "2.6rem",
          padding: "0.85rem 0.55rem",
          boxShadow:
            "0 32px 80px rgba(0,0,0,0.65), " +
            "0 0 0 1px rgba(255,255,255,0.04) inset, " +
            "0 0 40px rgba(229,175,92,0.05)",
        }}>
          <div style={{
            width: 54, height: 7, background: "#050710",
            borderRadius: "0 0 1rem 1rem",
            margin: "0 auto 0.65rem",
          }} />

          <div style={{
            borderRadius: "1.2rem", overflow: "hidden",
            position: "relative", background: CARD,
          }}>
            {WORKFLOWS.map((w, i) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={w.id}
                src={w.screen}
                alt={w.title}
                style={{
                  width: "100%", display: "block",
                  position: i === 0 ? "relative" : "absolute",
                  top: 0, left: 0,
                  ...(i !== 0 ? { bottom: 0, right: 0, objectFit: "cover", objectPosition: "top" } : {}),
                  opacity: i === active ? 1 : 0,
                  transition: "opacity 300ms ease",
                }}
              />
            ))}
          </div>

          <div style={{
            width: 38, height: 4, background: "rgba(255,255,255,0.12)",
            borderRadius: "2rem", margin: "0.65rem auto 0",
          }} />
        </div>

        {/* Reflection */}
        <div style={{
          position: "absolute", bottom: -16, left: "18%", right: "18%",
          height: 16, background: "rgba(229,175,92,0.09)",
          filter: "blur(12px)", borderRadius: "50%",
          pointerEvents: "none", zIndex: 0,
        }} />
      </div>

      {/* ── Mini phone gallery ──────────────────────────────── */}
      <div
        className="showcase-row"
        style={{
          display: "flex",
          justifyContent: "center",
          overflowX: "auto",
          padding: "0.25rem 0 0.75rem",
        }}
      >
        <div style={{
          display: "flex",
          gap: "0.7rem",
          padding: "0.5rem 1.5rem",
          flexShrink: 0,
        }}>
          {WORKFLOWS.map((w, i) => {
            const on = i === active;
            return (
              <div
                key={w.id}
                onClick={() => setActive(i)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === "Enter" && setActive(i)}
                style={{
                  position: "relative",
                  width: 78,
                  height: 152,
                  borderRadius: 13,
                  overflow: "hidden",
                  flexShrink: 0,
                  cursor: "pointer",
                  background: "#080a17",
                  border: `2px solid ${on ? AMBER : "rgba(255,255,255,0.18)"}`,
                  boxShadow: on
                    ? `0 0 0 1px rgba(229,175,92,0.25), 0 6px 24px rgba(229,175,92,0.22)`
                    : "0 2px 10px rgba(0,0,0,0.4)",
                  transition: "border-color 250ms, box-shadow 250ms",
                  userSelect: "none",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {/* Screenshot */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={w.screen}
                  alt=""
                  style={{
                    position: "absolute",
                    top: 0, left: 0,
                    width: "100%", height: "100%",
                    objectFit: "cover",
                    objectPosition: "top",
                    display: "block",
                    filter: "blur(0.8px) brightness(0.72)",
                    transform: "scale(1.04)",
                    transformOrigin: "top center",
                  }}
                />

                {/* Notch */}
                <div style={{
                  position: "absolute",
                  top: "0.32rem", left: "50%",
                  transform: "translateX(-50%)",
                  width: 18, height: 4,
                  background: "#050710",
                  borderRadius: "0 0 4px 4px",
                  zIndex: 3,
                }} />

                {/* Home indicator */}
                <div style={{
                  position: "absolute",
                  bottom: "0.85rem", left: "50%",
                  transform: "translateX(-50%)",
                  width: 20, height: 2.5,
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: 2,
                  zIndex: 3,
                }} />

                {/* Active top bar */}
                {on && (
                  <div style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0,
                    height: 2,
                    background: AMBER,
                    boxShadow: `0 0 8px ${AMBER}`,
                    zIndex: 4,
                  }} />
                )}

                {/* Bottom gradient */}
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to bottom, transparent 45%, rgba(5,7,18,0.88) 100%)",
                  zIndex: 1,
                }} />

                {/* Title */}
                <p style={{
                  position: "absolute",
                  bottom: "1.4rem", left: 0, right: 0,
                  margin: 0,
                  textAlign: "center",
                  fontSize: "0.58rem",
                  fontWeight: on ? 800 : 600,
                  color: on ? AMBER : "rgba(240,240,245,0.75)",
                  letterSpacing: "0.01em",
                  zIndex: 2,
                  transition: "color 250ms",
                  lineHeight: 1.2,
                  padding: "0 0.2rem",
                }}>
                  {w.title}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
