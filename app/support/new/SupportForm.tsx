"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SupportForm({
  venueId,
  ownerId,
}: {
  venueId: string;
  ownerId: string;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const CARD: React.CSSProperties = {
    background: "linear-gradient(160deg,#232b36,#1c2330)",
    border: "1px solid var(--card-border)",
    borderRadius: "1rem",
  };

  const INPUT: React.CSSProperties = {
    background: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    color: "var(--foreground)",
    outline: "none",
    borderRadius: "0.75rem",
    width: "100%",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.from("support_tickets").insert({
      venue_id: venueId,
      owner_id: ownerId,
      subject: subject.trim(),
      body: body.trim(),
    });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main dir="rtl" className="min-h-dvh px-4 pt-6 pb-10 flex flex-col gap-5"
      style={{ background: "var(--background)", color: "var(--foreground)" }}>

      <header className="flex items-center gap-3">
        <button onClick={() => router.back()}
          className="text-sm px-3 py-1.5 rounded-xl"
          style={{ background: "var(--card-border)", color: "var(--muted)" }}>
          ← חזרה
        </button>
        <h1 className="text-lg font-bold">פנייה לתמיכה</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div style={{ ...CARD, padding: "1.25rem" }} className="flex flex-col gap-4">

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>נושא הפנייה</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="תאר בקצרה את הנושא..."
              required
              className="px-4 py-2.5 text-sm"
              style={INPUT}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>פרטי הפנייה</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="תאר את הבעיה או השאלה בפירוט..."
              required
              rows={5}
              className="px-4 py-2.5 text-sm resize-none"
              style={{ ...INPUT, borderRadius: "0.75rem" }}
            />
          </div>

        </div>

        {error && (
          <p className="text-xs px-3 py-2 rounded-xl"
            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !subject.trim() || !body.trim()}
          className="w-full py-3.5 rounded-2xl font-bold text-base"
          style={{
            background: "var(--amber)",
            color: "#1a1000",
            opacity: loading || !subject.trim() || !body.trim() ? 0.5 : 1,
          }}>
          {loading ? "שולח..." : "שלח פנייה"}
        </button>
      </form>
    </main>
  );
}
