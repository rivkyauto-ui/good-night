import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import LogoutButton from "@/components/LogoutButton";

export default async function PendingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, status")
    .eq("id", user.id)
    .single();

  if (profile?.status === "active") redirect("/dashboard");

  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.25rem",
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <Image
        src="/logo-wide1.neto.svg"
        alt="Good Night"
        width={200}
        height={85}
        style={{ marginBottom: "2.5rem" }}
      />

      <div
        style={{
          background: "linear-gradient(160deg, #232b36 0%, #1c2330 100%)",
          border: "1px solid var(--card-border)",
          borderRadius: "1.5rem",
          padding: "2rem 1.5rem",
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⏳</div>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          שלום{firstName ? ` ${firstName}` : ""}!
        </h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
          הבקשה שלך התקבלה ונמצאת בבדיקה.
          <br />
          נאשר את הגישה בהקדם ונעדכן אותך.
        </p>
        <p style={{ fontSize: "0.8rem", color: "var(--muted)", opacity: 0.7 }}>
          לשאלות ניתן לפנות לתמיכה
        </p>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <LogoutButton />
      </div>
    </main>
  );
}
