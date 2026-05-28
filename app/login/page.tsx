"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("מייל או סיסמה שגויים");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-5 py-10 max-w-[480px] mx-auto w-full">

      {/* לוגו */}
      <div className="w-full flex justify-center mb-8">
        <Image
          src="/logo-icon-small.png"
          alt="Good Night"
          width={320}
          height={320}
          priority
          style={{ height: "auto", width: "min(320px, 80vw)" }}
        />
      </div>

      {/* טופס */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">

        <div className="flex flex-col gap-2">
          <label className="text-base" style={{ color: "var(--muted)" }}>כתובת מייל</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
            className="w-full px-4 py-4 rounded-xl text-base outline-none transition-colors"
            style={{
              background: "var(--card)",
              border: "1px solid var(--card-border)",
              color: "var(--foreground)",
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-base" style={{ color: "var(--muted)" }}>סיסמה</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full px-4 py-4 rounded-xl text-base outline-none transition-colors"
            style={{
              background: "var(--card)",
              border: "1px solid var(--card-border)",
              color: "var(--foreground)",
            }}
          />
        </div>

        {error && (
          <p className="text-base text-red-400 text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl font-bold text-base mt-1 transition-opacity disabled:opacity-60"
          style={{ background: "var(--amber)", color: "#1a1000" }}
        >
          {loading ? "מתחבר..." : "כניסה"}
        </button>

      </form>

      {/* קישור להרשמה */}
      <p className="mt-8 text-base" style={{ color: "var(--muted)" }}>
        עדיין לא רשום?{" "}
        <Link href="/register" style={{ color: "var(--amber)" }} className="underline underline-offset-2 font-medium">
          הצטרף עכשיו
        </Link>
      </p>

    </main>
  );
}
