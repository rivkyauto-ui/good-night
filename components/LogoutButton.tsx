"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="text-sm px-3 py-1.5 rounded-lg transition-colors"
      style={{ color: "var(--muted)", border: "1px solid var(--card-border)" }}
    >
      יציאה
    </button>
  );
}
