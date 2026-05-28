import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BookingsSearch, { type Booking, type PriceHistory, type UnitInfo } from "./BookingsSearch";

function fmt(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", minimumFractionDigits: 0 }).format(n);
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y.slice(2)}`;
}

function fmtPeriod(validFrom: string, validUntil: string | null) {
  const from = fmtDate(validFrom.split("T")[0]);
  const until = validUntil ? fmtDate(validUntil.split("T")[0]) : "כיום";
  return `${from} – ${until}`;
}

export default async function ControlPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: venue } = await supabase
    .from("venues")
    .select("id, name, mattress_price")
    .eq("owner_id", user.id)
    .single();

  if (!venue) redirect("/dashboard");

  const [{ data: units }, { data: bookings }, { data: priceHistory }] = await Promise.all([
    supabase.from("units").select("id, name, weekday_price, weekend_price, peak_price, is_whole_venue").eq("venue_id", venue.id).order("sort_order"),
    supabase.from("bookings").select(`
      id, booking_number, guest_name, guest_phone, guest_email,
      check_in, check_out, nights_count, season,
      booking_status, payment_status,
      discount_type, discount_amount,
      total_amount, amount_paid, balance_due,
      payment_method, booking_source, notes,
      has_conflict, created_at, mattress_price_used,
      booking_units(id, mattresses_added, unit_total, price_per_night, units(id, name))
    `).eq("venue_id", venue.id).order("created_at", { ascending: false }),
    supabase.from("price_history").select("*").eq("venue_id", venue.id).order("valid_from"),
  ]);

  const list = (bookings ?? []) as Booking[];
  const unitList = (units ?? []) as UnitInfo[];
  const historyList = (priceHistory ?? []) as PriceHistory[];

  return (
    <main dir="rtl" style={{
      minHeight: "100dvh",
      color: "var(--foreground)",
      padding: "1.5rem 1rem 4rem",
      fontFamily: "inherit",
    }}>

      {/* לוגו */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-wide1.neto.svg" alt="Good Night" style={{ height: "90px", width: "auto" }} />
      </div>

      {/* כותרת */}
      <h1 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "1.5rem" }}>
        <span style={{ color: "var(--amber)" }}>בקרה</span>
        <span style={{ color: "var(--muted)", fontWeight: 400 }}> ← </span>
        <span>{venue.name}</span>
      </h1>

      {/* בלוק תמחור */}
      <div style={{
        background: "linear-gradient(160deg, #232b36 0%, #1c2330 100%)",
        border: "1px solid var(--card-border)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.45)",
        borderRadius: "1.25rem",
        padding: "1.1rem 1rem 1.25rem",
        marginBottom: "1.25rem",
      }}>
        {/* כותרת תמחור */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          marginBottom: "0.9rem", paddingBottom: "0.75rem",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--amber)" }}>תמחור</span>
        </div>

        {/* מחירון נוכחי */}
        <div style={{
          background: "rgba(245,158,11,0.07)",
          border: "1px solid rgba(245,158,11,0.25)",
          borderRadius: "1rem",
          padding: "1rem",
          marginBottom: "0.75rem",
          fontSize: "0.8rem",
        }}>
          <p style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.6rem", paddingBottom: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>מחירון נוכחי</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "0.3rem 1rem", alignItems: "center" }}>
          <span style={{ color: "var(--muted)", fontSize: "0.65rem", fontWeight: 600 }}>יחידה</span>
          <span style={{ color: "var(--muted)", fontSize: "0.65rem", fontWeight: 600 }}>אמצ&quot;ש</span>
          <span style={{ color: "var(--muted)", fontSize: "0.65rem", fontWeight: 600 }}>סופ&quot;ש</span>
          <span style={{ color: "var(--muted)", fontSize: "0.65rem", fontWeight: 600 }}>שיא</span>
          {unitList.map((u) => (
            <React.Fragment key={u.id}>
              <span>{u.name}</span>
              <span>₪{u.weekday_price}</span>
              <span>₪{u.weekend_price}</span>
              <span>₪{u.peak_price}</span>
            </React.Fragment>
          ))}
        </div>
        <div style={{ marginTop: "0.6rem", paddingTop: "0.6rem", borderTop: "1px solid var(--card-border)", color: "var(--muted)" }}>
          תוספת מזרון: <strong style={{ color: "var(--foreground)" }}>{fmt(Number(venue.mattress_price))}</strong> ללילה
        </div>
        </div>

        {/* היסטוריית מחירונים */}
        {historyList.filter(ph => ph.valid_until !== null).length > 0 && (
          <details style={{
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: "1rem",
            fontSize: "0.75rem",
          }}>
            <summary style={{
              padding: "0.75rem 1rem", cursor: "pointer", listStyle: "none",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ color: "var(--muted)" }}>תעריפים קודמים</span>
              <span style={{ color: "var(--muted)" }}>▼</span>
            </summary>
          <div style={{ borderTop: "1px solid var(--card-border)", padding: "0.75rem 1rem" }}>
            {Array.from(new Set(historyList.filter(ph => ph.valid_until !== null).map(ph => ph.valid_from)))
              .sort((a, b) => b.localeCompare(a))
              .map(validFrom => {
                const records = historyList.filter(ph => ph.valid_from === validFrom);
                const first = records[0];
                return (
                  <div key={validFrom} style={{ marginBottom: "0.75rem" }}>
                    <p style={{ color: "#60a5fa", fontSize: "0.65rem", marginBottom: "0.3rem", fontWeight: 600 }}>
                      תוקף: {fmtPeriod(first.valid_from, first.valid_until)}
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "0.2rem 1rem" }}>
                      <span style={{ color: "var(--muted)", fontSize: "0.6rem" }}>יחידה</span>
                      <span style={{ color: "var(--muted)", fontSize: "0.6rem" }}>אמצ&quot;ש</span>
                      <span style={{ color: "var(--muted)", fontSize: "0.6rem" }}>סופ&quot;ש</span>
                      <span style={{ color: "var(--muted)", fontSize: "0.6rem" }}>שיא</span>
                      {records.map(r => (
                        <React.Fragment key={r.id}>
                          <span>{unitList.find(u => u.id === r.unit_id)?.name ?? "—"}</span>
                          <span>₪{r.weekday_price}</span>
                          <span>₪{r.weekend_price}</span>
                          <span>₪{r.peak_price}</span>
                        </React.Fragment>
                      ))}
                    </div>
                    {first.mattress_price && (
                      <p style={{ color: "var(--muted)", marginTop: "0.2rem" }}>מזרון: ₪{first.mattress_price}</p>
                    )}
                  </div>
                );
              })}
          </div>
          </details>
        )}
      </div>{/* סגירת בלוק תמחור */}

      {/* בלוק הזמנות */}
      <div style={{
        background: "linear-gradient(160deg, #232b36 0%, #1c2330 100%)",
        border: "1px solid rgba(245,158,11,0.22)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.45)",
        borderRadius: "1.25rem",
        padding: "1.1rem 1rem 1.25rem",
      }}>
        {/* כותרת הבלוק */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "0.9rem", paddingBottom: "0.75rem",
          borderBottom: "1px solid rgba(245,158,11,0.12)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="2" />
              <path d="M9 12h6M9 16h4" />
            </svg>
            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--amber)" }}>הזמנות</span>
          </div>
          <span style={{
            background: "rgba(245,158,11,0.15)",
            color: "var(--amber)",
            padding: "0.2rem 0.65rem",
            borderRadius: "999px",
            fontSize: "0.72rem",
            fontWeight: 700,
          }}>
            {list.length}
          </span>
        </div>

        <BookingsSearch
          list={list}
          historyList={historyList}
          unitList={unitList}
          venueMattressPrice={Number(venue.mattress_price)}
        />
      </div>
    </main>
  );
}
