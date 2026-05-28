import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import VenueForm from "./VenueForm";
import UnitsManager from "./UnitsManager";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: venue } = await supabase
    .from("venues")
    .select("id, name, phone_primary, phone_secondary, email, mattress_price, package_type")
    .eq("owner_id", user.id)
    .single();

  if (!venue) redirect("/dashboard");

  const { data: units } = await supabase
    .from("units")
    .select("id, name, description, beds_count, max_mattresses, weekday_price, weekend_price, peak_price, is_whole_venue, sort_order")
    .eq("venue_id", venue.id)
    .order("sort_order");

  const CARD: React.CSSProperties = {
    background: "linear-gradient(160deg, #232b36 0%, #1c2330 100%)",
    border: "1px solid var(--card-border)",
    borderTop: "1px solid rgba(255,255,255,0.07)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.45)",
    borderRadius: "1.25rem",
    padding: "1.1rem 1rem 1.25rem",
    marginBottom: "1.25rem",
  };

  const CARD_HEADER: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "0.5rem",
    marginBottom: "0.9rem", paddingBottom: "0.75rem",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  };

  return (
    <main dir="rtl" style={{ minHeight: "100dvh", color: "var(--foreground)", padding: "1.5rem 1rem 4rem", fontFamily: "inherit" }}>

      {/* לוגו */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-wide1.neto.svg" alt="Good Night" style={{ height: "90px", width: "auto" }} />
      </div>

      {/* כותרת */}
      <h1 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "1.5rem" }}>
        <span style={{ color: "var(--amber)" }}>הגדרות</span>
        <span style={{ color: "var(--muted)", fontWeight: 400 }}> ← </span>
        <span>{venue.name}</span>
      </h1>

      {/* בלוק פרטי המתחם */}
      <div style={CARD}>
        <div style={CARD_HEADER}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9,22 9,12 15,12 15,22" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--amber)" }}>פרטי המתחם</span>
        </div>
        <VenueForm
          venueId={venue.id}
          initialData={{
            name: venue.name,
            phone_primary: venue.phone_primary ?? "",
            phone_secondary: venue.phone_secondary ?? "",
            email: venue.email ?? "",
            mattress_price: Number(venue.mattress_price),
            package_type: venue.package_type ?? "",
          }}
        />
      </div>

      {/* בלוק יחידות */}
      <div style={CARD}>
        <div style={CARD_HEADER}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--amber)" }}>יחידות</span>
        </div>
        <UnitsManager
          venueId={venue.id}
          initialUnits={(units ?? []).map((u) => ({
            ...u,
            weekday_price: Number(u.weekday_price),
            weekend_price: Number(u.weekend_price),
            peak_price: Number(u.peak_price),
          }))}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
        <Link href="/dashboard" style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
          ← חזרה לדשבורד
        </Link>
      </div>

    </main>
  );
}
