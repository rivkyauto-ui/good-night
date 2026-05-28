"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    venue_name: "",
    phone_primary: "",
    phone_secondary: "",
    mattress_price: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.full_name,
          venue_name: form.venue_name,
          phone_primary: form.phone_primary,
          phone_secondary: form.phone_secondary,
          mattress_price: parseFloat(form.mattress_price) || 0,
        },
      },
    });

    if (signUpError || !data.user) {
      setError(signUpError?.message || "אירעה שגיאה, נסי שוב");
      setLoading(false);
      return;
    }

    router.push("/register/success");
  }

  return (
    <main className="min-h-dvh flex flex-col px-5 py-10 max-w-[480px] mx-auto w-full">

      {/* לוגו */}
      <div className="flex justify-center mb-8">
        <Image
          src="/logo-wide.png"
          alt="Good Night"
          width={400}
          height={170}
          priority
          style={{ height: "auto", width: "min(280px, 80vw)" }}
        />
      </div>

      <h2 className="text-xl font-bold text-center mb-6" style={{ color: "var(--foreground)" }}>
        הצטרפות למערכת
      </h2>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">

        {/* פרטים אישיים */}
        <section className="flex flex-col gap-4">
          <h3 className="text-base font-semibold" style={{ color: "var(--amber)" }}>פרטים אישיים</h3>

          <Field label="שם מלא">
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => update("full_name", e.target.value)}
              required
              placeholder="ישראל ישראלי"
            />
          </Field>

          <Field label="כתובת מייל">
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
              placeholder="your@email.com"
            />
          </Field>

          <Field label="סיסמה">
            <input
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
              placeholder="לפחות 6 תווים"
              minLength={6}
            />
          </Field>
        </section>

        {/* פרטי מתחם */}
        <section className="flex flex-col gap-4">
          <h3 className="text-base font-semibold" style={{ color: "var(--amber)" }}>פרטי המתחם</h3>

          <Field label="שם המתחם">
            <input
              type="text"
              value={form.venue_name}
              onChange={(e) => update("venue_name", e.target.value)}
              required
              placeholder="מתחם האורחים שלי"
            />
          </Field>

          <Field label="טלפון ראשי">
            <input
              type="tel"
              value={form.phone_primary}
              onChange={(e) => update("phone_primary", e.target.value)}
              required
              placeholder="050-0000000"
            />
          </Field>

          <Field label="טלפון נוסף (אופציונלי)">
            <input
              type="tel"
              value={form.phone_secondary}
              onChange={(e) => update("phone_secondary", e.target.value)}
              placeholder="050-0000000"
            />
          </Field>

          <Field label="מחיר מזרון (₪)">
            <input
              type="number"
              value={form.mattress_price}
              onChange={(e) => update("mattress_price", e.target.value)}
              required
              placeholder="100"
              min={0}
            />
          </Field>
        </section>

        {error && (
          <p className="text-base text-red-400 text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl font-bold text-base mt-1 transition-opacity disabled:opacity-60"
          style={{ background: "var(--amber)", color: "#1a1000" }}
        >
          {loading ? "שולח פרטים..." : "שליחת בקשת הצטרפות"}
        </button>

      </form>

      <p className="mt-8 text-base text-center" style={{ color: "var(--muted)" }}>
        כבר רשום?{" "}
        <Link href="/login" style={{ color: "var(--amber)" }} className="underline underline-offset-2 font-medium">
          כניסה למערכת
        </Link>
      </p>

    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactElement }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-base" style={{ color: "var(--muted)" }}>{label}</label>
      <div
        className="w-full px-4 py-4 rounded-xl text-base outline-none transition-colors [&>input]:w-full [&>input]:bg-transparent [&>input]:outline-none"
        style={{
          background: "var(--card)",
          border: "1px solid var(--card-border)",
          color: "var(--foreground)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
