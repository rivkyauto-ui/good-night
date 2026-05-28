"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  venueId: string;
  initialData: {
    name: string;
    phone_primary: string;
    phone_secondary: string;
    email: string;
    mattress_price: number;
    package_type: string;
  };
}

const INPUT_STYLE = {
  background: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  color: "var(--foreground)",
  outline: "none",
} as const;

export default function VenueForm({ venueId, initialData }: Props) {
  const [form, setForm] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof typeof form, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.name.trim()) { setError("שם המתחם הוא שדה חובה"); return; }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: err } = await supabase
      .from("venues")
      .update({
        name: form.name.trim(),
        phone_primary: form.phone_primary.trim() || null,
        phone_secondary: form.phone_secondary.trim() || null,
        email: form.email.trim() || null,
        mattress_price: Number(form.mattress_price) || 0,
      })
      .eq("id", venueId);

    setLoading(false);
    if (err) { setError(err.message); return; }
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field label="שם המתחם" required>
          <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)}
            placeholder="שם המתחם" className="w-full px-3 py-3 rounded-xl text-sm" style={INPUT_STYLE} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="טלפון ראשי">
            <input type="tel" value={form.phone_primary} onChange={(e) => update("phone_primary", e.target.value)}
              placeholder="050-0000000" className="w-full px-3 py-3 rounded-xl text-sm" style={INPUT_STYLE} />
          </Field>
          <Field label="טלפון משני">
            <input type="tel" value={form.phone_secondary} onChange={(e) => update("phone_secondary", e.target.value)}
              placeholder="050-0000000" className="w-full px-3 py-3 rounded-xl text-sm" style={INPUT_STYLE} />
          </Field>
        </div>

        <Field label="מייל">
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)}
            placeholder="mail@example.com" className="w-full px-3 py-3 rounded-xl text-sm" style={INPUT_STYLE} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="מחיר מזרון (₪ ללילה)">
            <input type="number" min="0" value={form.mattress_price}
              onChange={(e) => update("mattress_price", e.target.value)}
              placeholder="0" className="w-full px-3 py-3 rounded-xl text-sm" style={INPUT_STYLE} />
          </Field>
          <Field label="סוג חבילה">
            <div className="w-full px-3 py-3 rounded-xl text-sm"
              style={{ ...INPUT_STYLE, color: "var(--muted)", cursor: "default" }}>
              {initialData.package_type || "בסיסי"}
            </div>
          </Field>
        </div>

        {error && (
          <p className="text-sm px-3 py-2 rounded-xl" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-sm transition-opacity active:opacity-80"
          style={{ background: "var(--amber)", color: "#1a1000", opacity: loading ? 0.6 : 1 }}>
          {loading ? "שומר..." : saved ? "✓ נשמר" : "שמור פרטי מתחם"}
        </button>
      </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>
        {label}{required && <span style={{ color: "var(--amber)" }}> *</span>}
      </label>
      {children}
    </div>
  );
}
