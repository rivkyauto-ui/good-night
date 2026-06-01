"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";

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
  pending: "ממתינה לאישור",
  approved: "אושרה",
  cancelled: "בוטלה",
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  deposit: "מקדמה",
  paid: "שולם במלואו",
  refund_pending: "ממתין להחזר",
  refunded: "הוחזר",
};

const SEASON_LABEL: Record<string, string> = {
  weekday: 'אמצ"ש',
  weekend: 'סופ"ש',
  peak: "שיא / חגים",
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y.slice(2)}`;
}

function fmtMoney(n: number | string | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", minimumFractionDigits: 0 }).format(Number(n));
}

function bookingRowColor(b: Booking): string {
  if (b.booking_status === "cancelled") return "var(--muted)";
  if (b.booking_status === "pending") return "var(--amber)";
  if (Number(b.balance_due) > 0) return "#fb923c";
  return "#4ade80";
}

function getUnitNames(b: Booking): string {
  const units = (b.booking_units ?? []) as RawUnit[];
  return units
    .map((bu) => {
      const u = Array.isArray(bu.units) ? bu.units[0] : bu.units;
      return u?.name ?? null;
    })
    .filter(Boolean)
    .join(", ") || "—";
}

interface Props {
  list: Booking[];
  historyList: PriceHistory[];
  unitList: UnitInfo[];
  venueMattressPrice: number;
}

export default function BookingsSearch({ list }: Props) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Booking | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(b =>
      b.guest_name.toLowerCase().includes(q) ||
      `ORD-${String(b.booking_number).padStart(4, "0")}`.toLowerCase().includes(q) ||
      String(b.booking_number).includes(q)
    );
  }, [list, query]);

  useEffect(() => { setPage(1); }, [query]);

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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      {query.trim() && (
        <div style={{ fontSize: "0.73rem", color: "var(--muted)", marginBottom: "0.6rem" }}>
          {filtered.length === 0 ? "לא נמצאו תוצאות" : `${filtered.length} מתוך ${list.length} הזמנות`}
        </div>
      )}

      {list.length === 0 && <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>אין הזמנות עדיין.</p>}

      {filtered.length > 0 && (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem", direction: "rtl" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                  {["#", "שם אורח", "כניסה", "יציאה", "ל׳", "סה״כ", "יתרה", "סטטוס", ""].map((h, i) => (
                    <th key={i} style={{ padding: "0.4rem 0.5rem", color: "var(--muted)", fontWeight: 600, fontSize: "0.68rem", textAlign: "right", whiteSpace: "nowrap" }}>
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
                    <tr key={b.id}
                      onClick={() => setSelected(b)}
                      style={{
                        background: isOdd ? "rgba(255,255,255,0.02)" : "transparent",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        cursor: "pointer",
                        transition: "background 0.1s",
                      }}>
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
                          borderRadius: "999px", background: `${color}22`, color,
                        }}>
                          {BOOKING_STATUS_LABEL[b.booking_status] ?? b.booking_status}
                        </span>
                      </td>
                      <td style={{ padding: "0.5rem 0.4rem", color: "var(--muted)", fontSize: "0.75rem" }}>
                        ›
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginTop: "0.9rem", fontSize: "0.8rem" }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ background: "var(--card-border)", border: "none", borderRadius: "0.5rem", padding: "0.3rem 0.7rem", color: page === 1 ? "var(--muted)" : "var(--foreground)", cursor: page === 1 ? "default" : "pointer" }}>
                ›
              </button>
              <span style={{ color: "var(--muted)" }}>{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ background: "var(--card-border)", border: "none", borderRadius: "0.5rem", padding: "0.3rem 0.7rem", color: page === totalPages ? "var(--muted)" : "var(--foreground)", cursor: page === totalPages ? "default" : "pointer" }}>
                ‹
              </button>
            </div>
          )}
        </>
      )}

      {/* Bottom sheet */}
      {selected && (
        <BookingSheet booking={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

// ── Bottom Sheet ──────────────────────────────────────────────────

function BookingSheet({ booking: b, onClose }: { booking: Booking; onClose: () => void }) {
  const color = bookingRowColor(b);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
          zIndex: 40, backdropFilter: "blur(2px)",
        }}
      />

      {/* Sheet */}
      <div
        dir="rtl"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          zIndex: 50,
          background: "linear-gradient(160deg, #232b36 0%, #1c2330 100%)",
          border: "1px solid var(--card-border)",
          borderBottom: "none",
          borderRadius: "1.25rem 1.25rem 0 0",
          padding: "1.25rem 1rem 2rem",
          maxHeight: "80dvh",
          overflowY: "auto",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
        }}
      >
        {/* ידית + סגירה */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--muted)" }}>
              ORD-{String(b.booking_number).padStart(4, "0")}
            </span>
            <span style={{ fontWeight: 700, fontSize: "1rem" }}>{b.guest_name}</span>
          </div>
          <button onClick={onClose}
            style={{ color: "var(--muted)", background: "transparent", border: "none", fontSize: "1.4rem", lineHeight: 1, cursor: "pointer", padding: "0.2rem 0.5rem" }}>
            ×
          </button>
        </div>

        {/* סטטוסים */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <Badge label={BOOKING_STATUS_LABEL[b.booking_status] ?? b.booking_status} color={color} />
          <Badge label={PAYMENT_STATUS_LABEL[b.payment_status] ?? b.payment_status}
            color={b.payment_status === "paid" ? "#4ade80" : b.payment_status === "refund_pending" ? "#fb923c" : "var(--muted)"} />
          {b.has_conflict && <Badge label="⚠ חפיפה" color="#ef4444" />}
        </div>

        {/* פרטים */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem 1rem", marginBottom: "1rem" }}>
          <InfoRow label="כניסה" value={fmtDate(b.check_in)} />
          <InfoRow label="יציאה" value={fmtDate(b.check_out)} />
          <InfoRow label="לילות" value={String(b.nights_count)} />
          <InfoRow label="עונה" value={SEASON_LABEL[b.season] ?? b.season} />
          <InfoRow label="יחידות" value={getUnitNames(b)} />
          {b.guest_phone && <InfoRow label="טלפון" value={b.guest_phone} />}
          {b.booking_source && <InfoRow label="מקור" value={b.booking_source} />}
          {b.payment_method && <InfoRow label="אמצעי תשלום" value={b.payment_method} />}
        </div>

        {/* סיכום כספי */}
        <div style={{
          background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: "0.75rem", padding: "0.75rem 1rem", marginBottom: "1rem",
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", textAlign: "center",
        }}>
          <div>
            <div style={{ fontSize: "0.65rem", color: "var(--muted)", marginBottom: "0.2rem" }}>סה״כ</div>
            <div style={{ fontWeight: 700, color: "var(--amber)" }}>{fmtMoney(b.total_amount)}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.65rem", color: "var(--muted)", marginBottom: "0.2rem" }}>שולם</div>
            <div style={{ fontWeight: 700 }}>{fmtMoney(b.amount_paid)}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.65rem", color: "var(--muted)", marginBottom: "0.2rem" }}>יתרה</div>
            <div style={{ fontWeight: 700, color: Number(b.balance_due) > 0 ? "#fb923c" : "#4ade80" }}>
              {Number(b.balance_due) === 0 ? "✓ אפס" : fmtMoney(b.balance_due)}
            </div>
          </div>
        </div>

        {/* הערות */}
        {b.notes && (
          <div style={{
            background: "rgba(255,255,255,0.04)", borderRadius: "0.75rem",
            padding: "0.6rem 0.75rem", marginBottom: "1rem",
            fontSize: "0.8rem", color: "var(--muted)", fontStyle: "italic",
          }}>
            {b.notes}
          </div>
        )}

        {/* כפתור עריכה */}
        <Link href={`/bookings/${b.id}`}
          style={{
            display: "block", width: "100%", padding: "0.9rem",
            background: "var(--amber)", color: "#1a1000",
            borderRadius: "0.875rem", textAlign: "center",
            fontWeight: 700, fontSize: "0.95rem", textDecoration: "none",
          }}>
          פתח / ערוך הזמנה
        </Link>
      </div>
    </>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: "0.7rem", fontWeight: 600, padding: "0.2rem 0.6rem",
      borderRadius: "999px", background: `${color}20`, color,
      border: `1px solid ${color}40`,
    }}>
      {label}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: "0.65rem", color: "var(--muted)", marginBottom: "0.15rem" }}>{label}</div>
      <div style={{ fontSize: "0.82rem", fontWeight: 500 }}>{value}</div>
    </div>
  );
}
