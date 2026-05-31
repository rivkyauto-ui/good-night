"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface PriceHistory {
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

export interface UnitInfo {
  id: string;
  name: string;
  weekday_price: number;
  weekend_price: number;
  peak_price: number;
  is_whole_venue: boolean;
}

type RawUnit = {
  id: string;
  mattresses_added: number | null;
  unit_total: number | string;
  price_per_night: number | string | null;
  units: { id: string; name: string } | { id: string; name: string }[] | null;
};

export interface Booking {
  id: string;
  booking_number: number;
  guest_name: string;
  guest_phone: string | null;
  guest_email: string | null;
  check_in: string;
  check_out: string;
  nights_count: number;
  season: string;
  booking_status: string;
  payment_status: string;
  discount_type: string | null;
  discount_amount: number | string | null;
  total_amount: number | string;
  amount_paid: number | string;
  balance_due: number | string;
  payment_method: string | null;
  booking_source: string | null;
  notes: string | null;
  has_conflict: boolean;
  created_at: string | null;
  mattress_price_used: number | string | null;
  booking_units: RawUnit[] | null;
}

const PAGE_SIZE = 10;

const BOOKING_STATUS_LABEL: Record<string, string> = {
  pending: "ממתינה",
  approved: "אושרה",
  cancelled: "בוטלה",
};


function fmtDate(d: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y.slice(2)}`;
}

function fmtMoney(n: number | string | null) {
  if (n == null) return "—";
  const num = Number(n);
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", minimumFractionDigits: 0 }).format(num);
}

function bookingRowColor(b: Booking): string {
  if (b.booking_status === "cancelled") return "var(--muted)";
  if (b.booking_status === "pending") return "var(--amber)";
  if (Number(b.balance_due) > 0) return "#fb923c";
  return "#4ade80";
}

interface Props {
  list: Booking[];
  historyList: PriceHistory[];
  unitList: UnitInfo[];
  venueMattressPrice: number;
}

export default function BookingsSearch({ list }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(b =>
      b.guest_name.toLowerCase().includes(q) ||
      `ORD-${String(b.booking_number).padStart(4, "0")}`.toLowerCase().includes(q) ||
      String(b.booking_number).includes(q)
    );
  }, [list, query]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      {/* שורת חיפוש */}
      <div style={{ marginBottom: "0.75rem", position: "relative" }}>
        <input
          type="search"
          placeholder="חיפוש לפי שם אורח או מספר הזמנה..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "0.6rem 1rem 0.6rem 2.5rem",
            borderRadius: "0.75rem",
            border: "1px solid rgba(245,158,11,0.25)",
            background: "rgba(245,158,11,0.07)",
            color: "var(--foreground)",
            fontSize: "0.85rem",
            outline: "none",
            boxSizing: "border-box",
            direction: "rtl",
          }}
        />
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
        >
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      {/* כמה תוצאות */}
      {query.trim() && (
        <div style={{ fontSize: "0.73rem", color: "var(--muted)", marginBottom: "0.6rem" }}>
          {filtered.length === 0 ? "לא נמצאו תוצאות" : `${filtered.length} מתוך ${list.length} הזמנות`}
        </div>
      )}

      {list.length === 0 && <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>אין הזמנות עדיין.</p>}

      {filtered.length > 0 && (
        <>
          {/* טבלה */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem", direction: "rtl" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                  {["#", "שם אורח", "כניסה", "יציאה", "ל׳", "סה״כ", "יתרה", "סטטוס"].map(h => (
                    <th key={h} style={{ padding: "0.4rem 0.5rem", color: "var(--muted)", fontWeight: 600, fontSize: "0.68rem", textAlign: "right", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((b, i) => {
                  const color = bookingRowColor(b);
                  const isOdd = i % 2 === 0;
                  return (
                    <tr key={b.id} onClick={() => router.push(`/bookings/${b.id}`)} style={{ background: isOdd ? "rgba(255,255,255,0.02)" : "transparent", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}>
                      <td style={{ padding: "0.5rem 0.5rem", fontFamily: "monospace", color: "var(--muted)", whiteSpace: "nowrap", fontSize: "0.7rem" }}>
                        {String(b.booking_number).padStart(4, "0")}
                      </td>
                      <td style={{ padding: "0.5rem 0.5rem", fontWeight: 600, maxWidth: "110px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {b.guest_name}
                      </td>
                      <td style={{ padding: "0.5rem 0.5rem", color: "var(--muted)", whiteSpace: "nowrap" }}>
                        {fmtDate(b.check_in)}
                      </td>
                      <td style={{ padding: "0.5rem 0.5rem", color: "var(--muted)", whiteSpace: "nowrap" }}>
                        {fmtDate(b.check_out)}
                      </td>
                      <td style={{ padding: "0.5rem 0.5rem", color: "var(--muted)", textAlign: "center" }}>
                        {b.nights_count}
                      </td>
                      <td style={{ padding: "0.5rem 0.5rem", whiteSpace: "nowrap", textAlign: "left" }}>
                        {fmtMoney(b.total_amount)}
                      </td>
                      <td style={{ padding: "0.5rem 0.5rem", whiteSpace: "nowrap", color, fontWeight: 600, textAlign: "left" }}>
                        {Number(b.balance_due) === 0 ? "✓" : fmtMoney(b.balance_due)}
                      </td>
                      <td style={{ padding: "0.5rem 0.5rem", whiteSpace: "nowrap" }}>
                        <span style={{
                          fontSize: "0.65rem", fontWeight: 600, padding: "0.15rem 0.4rem",
                          borderRadius: "999px", background: `${color}18`, color,
                        }}>
                          {BOOKING_STATUS_LABEL[b.booking_status] ?? b.booking_status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginTop: "0.9rem", fontSize: "0.8rem" }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ background: "var(--card-border)", border: "none", borderRadius: "0.5rem", padding: "0.3rem 0.7rem", color: page === 1 ? "var(--muted)" : "var(--foreground)", cursor: page === 1 ? "default" : "pointer" }}
              >
                ›
              </button>
              <span style={{ color: "var(--muted)" }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ background: "var(--card-border)", border: "none", borderRadius: "0.5rem", padding: "0.3rem 0.7rem", color: page === totalPages ? "var(--muted)" : "var(--foreground)", cursor: page === totalPages ? "default" : "pointer" }}
              >
                ‹
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
