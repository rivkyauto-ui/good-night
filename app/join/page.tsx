"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Field = "full_name" | "phone" | "email" | "venue_name";

const FIELDS: { key: Field; label: string; type: string; placeholder: string }[] = [
  { key: "full_name", label: "שם מלא", type: "text", placeholder: "ישראל ישראלי" },
  { key: "phone", label: "טלפון", type: "tel", placeholder: "050-0000000" },
  { key: "email", label: "מייל", type: "email", placeholder: "your@email.com" },
  { key: "venue_name", label: "שם המתחם", type: "text", placeholder: "צימר הכוכבים" },
];

export default function JoinPage() {
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", venue_name: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("leads").insert(form);
    setLoading(false);
    if (error) { setError("משהו השתבש, נסי שוב"); return; }
    setDone(true);
  }

  const INPUT: React.CSSProperties = {
    width: "100%",
    padding: "0.875rem 1rem",
    borderRadius: "0.75rem",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "var(--foreground)",
    fontSize: "1rem",
    outline: "none",
  };

  return (
    <main dir="rtl" className="min-h-dvh flex flex-col items-center justify-center px-5 py-10"
      style={{ background: "var(--background)", color: "var(--foreground)" }}>

      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-wide1.neto.svg" alt="Good Night" className="h-[80px] w-auto" />
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            מערכת ניהול חכמה למתחמי אירוח
          </p>
        </div>

        {done ? (
          <div className="text-center flex flex-col gap-3 py-6"
            style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: "1rem", padding: "2rem" }}>
            <p className="text-2xl">✓</p>
            <p className="font-semibold">קיבלנו את פרטיך!</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              ניצור איתך קשר בהקדם
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {FIELDS.map((f) => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--muted)" }}>
                  {f.label}
                </label>
                <input
                  required
                  type={f.type}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  style={INPUT}
                />
              </div>
            ))}

            {error && (
              <p className="text-sm text-center" style={{ color: "#ef4444" }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm mt-1"
              style={{
                background: loading ? "rgba(229,175,92,0.4)" : "var(--amber)",
                color: "#1a1000",
                opacity: loading ? 0.7 : 1,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
              }}>
              {loading ? "שולח..." : "שליחה"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
