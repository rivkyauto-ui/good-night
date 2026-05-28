import React from "react";
import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const SEASON: Record<string, string> = {
  weekday: 'אמצ"ש',
  weekend: 'סופ"ש',
  peak: "שיא / חגים",
};

const BOOKING_STATUS: Record<string, string> = {
  pending: "ממתינה לאישור",
  approved: "אושרה",
  cancelled: "בוטלה",
};

const PAYMENT_STATUS: Record<string, string> = {
  deposit: "מקדמה",
  paid: "שולם",
  refund_pending: "ממתין להחזר",
  refunded: "הוחזר",
};

interface PriceHistory {
  id: string;
  unit_id: string;
  venue_id: string;
  weekday_price: number;
  weekend_price: number;
  peak_price: number;
  mattress_price: number;
  valid_from: string;
  valid_until: string | null;
}

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

function computeTimeStatus(checkIn: string, checkOut: string) {
  const today = new Date().toISOString().split("T")[0];
  if (checkIn > today) return "עתידי";
  if (checkOut < today) return "הסתיים";
  return "שוהים עכשיו";
}

function findHistoricalPrice(unitId: string, checkIn: string, priceHistory: PriceHistory[]): PriceHistory | null {
  return priceHistory.find(ph =>
    ph.unit_id === unitId &&
    ph.valid_from.split("T")[0] <= checkIn &&
    (ph.valid_until === null || ph.valid_until.split("T")[0] > checkIn)
  ) ?? null;
}

export default async function DebugPage({ searchParams }: { searchParams: Promise<{ venueId?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { venueId } = await searchParams;
  if (!venueId) redirect("/admin");

  const admin = createAdminClient();

  const [{ data: venue }, { data: units }, { data: bookings }, { data: priceHistory }] = await Promise.all([
    admin.from("venues").select("id, name, mattress_price").eq("id", venueId).single(),
    admin.from("units").select("id, name, weekday_price, weekend_price, peak_price, is_whole_venue").eq("venue_id", venueId).order("sort_order"),
    admin.from("bookings").select(`
      id, booking_number, guest_name, guest_phone, guest_email,
      check_in, check_out, nights_count, season,
      booking_status, payment_status,
      discount_type, discount_amount,
      total_amount, amount_paid, balance_due,
      payment_method, booking_source, notes,
      has_conflict, created_at, mattress_price_used,
      booking_units(id, mattresses_added, unit_total, price_per_night, units(id, name))
    `).eq("venue_id", venueId).order("created_at", { ascending: false }),
    admin.from("price_history").select("*").eq("venue_id", venueId).order("valid_from"),
  ]);

  if (!venue) redirect("/admin");

  const list = bookings ?? [];
  const unitList = units ?? [];
  const historyList = (priceHistory ?? []) as PriceHistory[];

  return (
    <main dir="rtl" style={{
      minHeight: "100dvh",
      background: "var(--background)",
      color: "var(--foreground)",
      padding: "1.5rem 1rem 4rem",
      fontFamily: "inherit",
    }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-wide1.neto.svg" alt="Good Night" style={{ height: "90px", width: "auto" }} />
        </div>
        <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
          <span style={{
            fontSize: "0.75rem", padding: "0.25rem 0.75rem", borderRadius: "999px",
            background: "rgba(229,175,92,0.12)", color: "var(--amber)", border: "1px solid rgba(229,175,92,0.3)",
          }}>ניהול מערכת</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>בקרה — {venue.name}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{list.length} הזמנות</span>
          <Link href="/admin" style={{ fontSize: "0.8rem", color: "var(--muted)" }}>← חזור לניהול</Link>
        </div>
      </div>

      {/* מחירון נוכחי */}
      <div style={{
        background: "linear-gradient(160deg,#1a2030,#151c28)",
        border: "1px solid var(--card-border)",
        borderRadius: "1rem", padding: "1rem", marginBottom: "1rem", fontSize: "0.8rem",
      }}>
        <p style={{ color: "var(--muted)", fontSize: "0.7rem", fontWeight: 600, marginBottom: "0.6rem" }}>מחירון נוכחי</p>
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
          background: "linear-gradient(160deg,#1a2030,#151c28)",
          border: "1px solid var(--card-border)",
          borderRadius: "1rem", marginBottom: "1.5rem", fontSize: "0.75rem",
        }}>
          <summary style={{
            padding: "0.75rem 1rem", cursor: "pointer", listStyle: "none",
            color: "var(--muted)", display: "flex", justifyContent: "space-between",
          }}>
            <span>היסטוריית מחירונים ({new Set(historyList.filter(ph => ph.valid_until !== null).map(ph => ph.valid_until)).size} שינויים)</span>
            <span>▼</span>
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
                          <span>{unitList.find(u => u.id === r.unit_id)?.name ?? r.unit_id}</span>
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

      {list.length === 0 && <p style={{ color: "var(--muted)" }}>אין הזמנות עדיין.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {list.map((b) => {
          type RawUnit = {
            id: string;
            mattresses_added: number | null;
            unit_total: number | string;
            price_per_night: number | string | null;
            units: { id: string; name: string } | { id: string; name: string }[] | null;
          };

          const mattressPriceUsed = b.mattress_price_used != null
            ? Number(b.mattress_price_used)
            : Number(venue.mattress_price);

          const units = ((b.booking_units ?? []) as unknown as RawUnit[]).map((bu) => {
            const u = Array.isArray(bu.units) ? (bu.units[0] ?? null) : bu.units;
            const unitId = u?.id ?? null;

            let pricePerNight: number | null = bu.price_per_night != null ? Number(bu.price_per_night) : null;
            let effectiveMattressPrice = mattressPriceUsed;

            const bookingDate = b.created_at?.split("T")[0] ?? b.check_in;
            const histRecord = unitId ? findHistoricalPrice(unitId, bookingDate, historyList) : null;

            if (histRecord) {
              effectiveMattressPrice = histRecord.mattress_price;
              if (pricePerNight === null) {
                pricePerNight = b.season === "weekday" ? histRecord.weekday_price
                  : b.season === "weekend" ? histRecord.weekend_price
                  : histRecord.peak_price;
              }
            }

            const baseAmt = pricePerNight != null ? pricePerNight * b.nights_count : null;
            const mattressAmt = (bu.mattresses_added ?? 0) * effectiveMattressPrice * b.nights_count;
            const expectedTotal = baseAmt != null ? baseAmt + mattressAmt : null;

            return {
              name: u?.name ?? "—",
              mattresses: bu.mattresses_added ?? 0,
              pricePerNight,
              baseAmt,
              mattressAmt,
              expectedTotal,
              unitTotal: Number(bu.unit_total),
              histRecord,
              isSnapshot: bu.price_per_night != null,
            };
          });

          const subtotal = units.reduce((s, u) => s + u.unitTotal, 0);
          const discountAmt = Number(b.discount_amount) || 0;
          const discountFinal = b.discount_type === "לפי לילה" ? discountAmt * b.nights_count : discountAmt;
          const computedTotal = subtotal - discountFinal;
          const totalMatch = Math.abs(computedTotal - Number(b.total_amount)) < 0.01;
          const unitMismatches = units.filter(u => u.expectedTotal != null && Math.abs(u.expectedTotal - u.unitTotal) > 0.01);
          const borderColor = unitMismatches.length > 0 ? "#ef4444" : "var(--card-border)";

          return (
            <details key={b.id} style={{
              background: "linear-gradient(160deg,#232b36,#1c2330)",
              border: `1px solid ${borderColor}`,
              borderRadius: "1rem", fontSize: "0.8rem",
            }}>
              <summary style={{
                padding: "0.85rem 1rem", cursor: "pointer", listStyle: "none",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                  <span style={{ fontFamily: "monospace", color: "var(--muted)", whiteSpace: "nowrap" }}>
                    ORD-{String(b.booking_number).padStart(4, "0")}
                  </span>
                  <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {b.guest_name}
                  </span>
                  <span style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>
                    {fmtDate(b.check_in)} – {fmtDate(b.check_out)}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                  {unitMismatches.length > 0 && <span style={{ color: "#ef4444", fontSize: "0.7rem" }}>✗</span>}
                  <span style={{ color: Number(b.balance_due) > 0 ? "var(--amber)" : "#4ade80", fontWeight: 600, whiteSpace: "nowrap" }}>
                    {fmt(Number(b.total_amount))}
                  </span>
                  <span style={{ color: "var(--muted)", fontSize: "0.7rem" }}>▼</span>
                </div>
              </summary>

              <div style={{ borderTop: `1px solid ${borderColor}`, padding: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem 1rem", marginBottom: "0.75rem" }}>
                  <Row label="שם אורח" value={b.guest_name} />
                  <Row label="טלפון" value={b.guest_phone ?? "—"} />
                  <Row label="מייל" value={b.guest_email ?? "—"} />
                  <Row label="מקור" value={b.booking_source ?? "—"} />
                  <Row label="כניסה" value={fmtDate(b.check_in)} />
                  <Row label="יציאה" value={fmtDate(b.check_out)} />
                  <Row label="לילות" value={String(b.nights_count)} />
                  <Row label="עונה" value={SEASON[b.season] ?? b.season} />
                  <Row label="סטטוס הזמנה" value={BOOKING_STATUS[b.booking_status] ?? b.booking_status} highlight={b.booking_status === "pending" ? "amber" : b.booking_status === "cancelled" ? "red" : "green"} />
                  <Row label="סטטוס תשלום" value={PAYMENT_STATUS[b.payment_status] ?? b.payment_status} highlight={b.payment_status === "paid" ? "green" : b.payment_status === "refund_pending" ? "orange" : undefined} />
                  <Row label="זמן" value={computeTimeStatus(b.check_in, b.check_out)} />
                  <Row label="חפיפה" value={b.has_conflict ? "⚠ כן" : "לא"} highlight={b.has_conflict ? "red" : undefined} />
                  <Row label="אמצעי תשלום" value={b.payment_method ?? "—"} />
                  <Row label="נוצר" value={fmtDate(b.created_at?.split("T")[0] ?? "")} />
                </div>

                <div style={{ borderTop: "1px solid var(--card-border)", paddingTop: "0.75rem", marginBottom: "0.5rem" }}>
                  <p style={{ color: "var(--muted)", fontSize: "0.7rem", marginBottom: "0.4rem", fontWeight: 600 }}>פירוט חישוב</p>
                  {units.map((u, i) => {
                    const unitOk = u.expectedTotal == null || Math.abs(u.expectedTotal - u.unitTotal) < 0.01;
                    return (
                      <div key={i} style={{ marginBottom: "0.5rem", padding: "0.4rem 0.5rem", borderRadius: "0.5rem", background: unitOk ? "transparent" : "rgba(239,68,68,0.08)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 600 }}>{u.name}</span>
                          {!unitOk && <span style={{ color: "#ef4444", fontSize: "0.7rem" }}>✗ אי-התאמה</span>}
                        </div>
                        {u.histRecord && (
                          <details style={{ marginTop: "0.3rem" }}>
                            <summary style={{ color: "#60a5fa", fontSize: "0.65rem", cursor: "pointer", listStyle: "none" }}>
                              ▸ מחירון: {fmtPeriod(u.histRecord.valid_from, u.histRecord.valid_until)}
                            </summary>
                            <div style={{ marginTop: "0.4rem", padding: "0.5rem 0.6rem", borderRadius: "0.5rem", background: "rgba(96,165,250,0.07)", border: "1px solid rgba(96,165,250,0.18)", fontSize: "0.65rem" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "0.2rem 0.75rem", alignItems: "center" }}>
                                <span style={{ color: "var(--muted)", fontWeight: 600 }}>יחידה</span>
                                <span style={{ color: "var(--muted)", fontWeight: 600 }}>אמצ&quot;ש</span>
                                <span style={{ color: "var(--muted)", fontWeight: 600 }}>סופ&quot;ש</span>
                                <span style={{ color: "var(--muted)", fontWeight: 600 }}>שיא</span>
                                {historyList.filter(ph => ph.valid_from === u.histRecord!.valid_from).map(ph => (
                                  <React.Fragment key={ph.id}>
                                    <span>{unitList.find(ul => ul.id === ph.unit_id)?.name ?? "—"}</span>
                                    <span>₪{ph.weekday_price}</span>
                                    <span>₪{ph.weekend_price}</span>
                                    <span>₪{ph.peak_price}</span>
                                  </React.Fragment>
                                ))}
                              </div>
                              {u.histRecord.mattress_price > 0 && (
                                <p style={{ color: "var(--muted)", marginTop: "0.3rem" }}>מזרון: ₪{u.histRecord.mattress_price}</p>
                              )}
                            </div>
                          </details>
                        )}
                        <span style={{ color: "var(--muted)" }}>
                          {u.pricePerNight != null ? (
                            <>
                              ₪{u.pricePerNight} × {b.nights_count} ל׳ = {fmt(u.baseAmt)}
                              {u.mattresses > 0 && ` + ${u.mattresses} מזרון × ₪${u.histRecord?.mattress_price ?? mattressPriceUsed} × ${b.nights_count} = ${fmt(u.mattressAmt)}`}
                            </>
                          ) : (
                            <span style={{ color: "var(--amber)" }}>ישן — אין מידע על מחיר</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                  {discountFinal > 0 && (
                    <div style={{ color: "#fb923c" }}>
                      הנחה{b.discount_type === "לפי לילה" ? ` (₪${discountAmt}/ל × ${b.nights_count})` : ""}: −{fmt(discountFinal)}
                    </div>
                  )}
                  <div style={{ marginTop: "0.4rem", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                    <span>סה&quot;כ DB: <strong>{fmt(Number(b.total_amount))}</strong></span>
                    <span>סה&quot;כ מחושב: <strong>{fmt(computedTotal)}</strong></span>
                    <span style={{ color: totalMatch ? "#4ade80" : "#ef4444", fontWeight: 700 }}>
                      {totalMatch ? "✓ תואם" : "✗ אי-התאמה!"}
                    </span>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--card-border)", paddingTop: "0.6rem", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                  <span>שולם: <strong>{fmt(Number(b.amount_paid))}</strong></span>
                  <span>יתרה: <strong style={{ color: Number(b.balance_due) > 0 ? "var(--amber)" : "#4ade80" }}>{fmt(Number(b.balance_due))}</strong></span>
                </div>

                {b.notes && (
                  <div style={{ marginTop: "0.6rem", borderTop: "1px solid var(--card-border)", paddingTop: "0.6rem", color: "var(--muted)", fontStyle: "italic" }}>
                    {b.notes}
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </main>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: "amber" | "green" | "red" | "orange" }) {
  const color = highlight === "amber" ? "var(--amber)" : highlight === "green" ? "#4ade80" : highlight === "red" ? "#ef4444" : highlight === "orange" ? "#fb923c" : "var(--foreground)";
  return (
    <div>
      <div style={{ color: "var(--muted)", fontSize: "0.65rem", marginBottom: "0.1rem" }}>{label}</div>
      <div style={{ color, fontWeight: highlight ? 600 : 400 }}>{value}</div>
    </div>
  );
}
