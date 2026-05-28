"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type BookingStatus = "pending" | "approved" | "cancelled";
type PaymentStatus = "deposit" | "paid" | "refund_pending" | "refunded";

export interface BookingRow {
  id: string;
  booking_number: number;
  guest_name: string;
  guest_phone: string | null;
  check_in: string;
  check_out: string;
  nights_count: number;
  booking_status: BookingStatus;
  payment_status: PaymentStatus;
  total_amount: number;
  amount_paid: number;
  balance_due: number | null;
  booking_units: Array<{ units: Array<{ name: string }> | null }>;
}

const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "ממתינה",
  approved: "אושרה",
  cancelled: "בוטלה",
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  deposit: "מקדמה",
  paid: "שולם",
  refund_pending: "ממתין להחזר",
  refunded: "הוחזר",
};

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${day}.${month}.${year.slice(2)}`;
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency", currency: "ILS",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

export default function BookingsListClient({
  list,
  emptyMessage,
}: {
  list: BookingRow[];
  emptyMessage: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(b =>
      b.guest_name.toLowerCase().includes(q) ||
      String(b.booking_number).includes(q) ||
      `ord-${String(b.booking_number).padStart(4, "0")}`.includes(q)
    );
  }, [list, query]);

  return (
    <>
      {/* שורת חיפוש */}
      <div style={{ position: "relative" }}>
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
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          {filtered.length === 0 ? "לא נמצאו תוצאות" : `${filtered.length} מתוך ${list.length} הזמנות`}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center pt-16">
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {query.trim() ? "לא נמצאו תוצאות" : emptyMessage}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(booking => <BookingCard key={booking.id} booking={booking} />)}
        </div>
      )}
    </>
  );
}

function BookingCard({ booking }: { booking: BookingRow }) {
  const unitNames = booking.booking_units
    .flatMap(bu => bu.units ?? [])
    .map(u => u.name)
    .join(", ");

  const orderNum = `ORD-${String(booking.booking_number).padStart(4, "0")}`;
  const balanceDue = booking.balance_due ?? 0;
  const nightsLabel = booking.nights_count === 1 ? "לילה" : `${booking.nights_count} לילות`;

  return (
    <Link href={`/bookings/${booking.id}`}
      className="block rounded-2xl px-4 py-4 active:opacity-75 transition-opacity"
      style={{
        background: "linear-gradient(160deg, #232b36 0%, #1c2330 100%)",
        border: "1px solid var(--card-border)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.45)",
        color: "var(--foreground)",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>{orderNum}</span>
        <div className="flex gap-1.5">
          <StatusBadge status={booking.booking_status} />
          <PaymentBadge status={booking.payment_status} amountPaid={booking.amount_paid} />
        </div>
      </div>

      <p className="text-base font-semibold mb-2">{booking.guest_name}</p>

      <div className="flex items-center gap-3 mb-1">
        <div className="flex flex-col">
          <span className="text-xs" style={{ color: "var(--muted)" }}>כניסה</span>
          <span className="text-sm font-semibold">{formatDate(booking.check_in)}</span>
        </div>
        <span className="text-xs pb-0.5" style={{ color: "var(--muted)" }}>←</span>
        <div className="flex flex-col">
          <span className="text-xs" style={{ color: "var(--muted)" }}>יציאה</span>
          <span className="text-sm font-semibold">{formatDate(booking.check_out)}</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full ms-auto"
          style={{ background: "var(--card-border)", color: "var(--muted)" }}>
          {nightsLabel}
        </span>
      </div>

      {unitNames && (
        <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>{unitNames}</p>
      )}

      <div className="flex items-center justify-between pt-3"
        style={{ borderTop: "1px solid var(--card-border)" }}>
        <span className="text-sm font-bold">{formatAmount(booking.total_amount)}</span>
        {balanceDue > 0 ? (
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: "rgba(229,175,92,0.15)", color: "var(--amber)" }}>
            יתרה: {formatAmount(balanceDue)}
          </span>
        ) : booking.payment_status === "paid" ? (
          <span className="text-xs" style={{ color: "#4ade80" }}>✓ שולם במלואו</span>
        ) : null}
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const styles: Record<BookingStatus, { bg: string; color: string }> = {
    pending:   { bg: "rgba(229,175,92,0.15)",  color: "var(--amber)" },
    approved:  { bg: "rgba(74,222,128,0.15)",  color: "#4ade80" },
    cancelled: { bg: "rgba(107,122,141,0.15)", color: "var(--muted)" },
  };
  const s = styles[status];
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: s.bg, color: s.color }}>
      {BOOKING_STATUS_LABELS[status]}
    </span>
  );
}

function PaymentBadge({ status, amountPaid }: { status: PaymentStatus; amountPaid: number }) {
  const styles: Record<PaymentStatus, { bg: string; color: string }> = {
    deposit:        { bg: "rgba(96,165,250,0.15)",  color: "#60a5fa" },
    paid:           { bg: "rgba(74,222,128,0.15)",  color: "#4ade80" },
    refund_pending: { bg: "rgba(251,146,60,0.15)",  color: "#fb923c" },
    refunded:       { bg: "rgba(107,122,141,0.15)", color: "var(--muted)" },
  };
  const s = styles[status];
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: s.bg, color: s.color }}>
      {status === "deposit" && amountPaid === 0 ? "טרם שולם" : PAYMENT_STATUS_LABELS[status]}
    </span>
  );
}
