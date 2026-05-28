"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export type BookingStatus = "pending" | "approved" | "cancelled";
export type PaymentStatus = "deposit" | "paid" | "refund_pending" | "refunded";
export type Season = "weekday" | "weekend" | "peak";

export interface BookingUnit {
  id: string;
  mattresses_added: number;
  unit_total: number;
  units: {
    id: string;
    name: string;
    weekday_price: number;
    weekend_price: number;
    peak_price: number;
  } | null;
}

export interface Booking {
  id: string;
  booking_number: number;
  guest_name: string;
  guest_phone: string | null;
  guest_email: string | null;
  check_in: string;
  check_out: string;
  nights_count: number;
  season: Season;
  booking_status: BookingStatus;
  payment_status: PaymentStatus;
  time_status: string;
  discount_type: string | null;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  payment_method: string | null;
  booking_source: string | null;
  notes: string | null;
  has_conflict: boolean;
  created_at: string;
  booking_units: BookingUnit[];
}

const SEASON_KEY: Record<Season, "weekday_price" | "weekend_price" | "peak_price"> = {
  weekday: "weekday_price",
  weekend: "weekend_price",
  peak: "peak_price",
};

const SEASON_LABELS: Record<Season, string> = {
  weekday: 'אמצ"ש',
  weekend: 'סופ"ש',
  peak: "שיא עונה / חגים",
};

const TIME_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  future:    { label: "הזמנה עתידית",  color: "var(--muted)" },
  active:    { label: "שוהים עכשיו",   color: "#4ade80" },
  completed: { label: "הסתיים",         color: "var(--muted)" },
};

const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending:   "ממתינה לאישור",
  approved:  "אושרה",
  cancelled: "בוטלה",
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  deposit:        "מקדמה",
  paid:           "שולם במלואו",
  refund_pending: "ממתין להחזר",
  refunded:       "הוחזר",
};

const BOOKING_STATUS_STYLE: Record<BookingStatus, { bg: string; color: string }> = {
  pending:   { bg: "rgba(229,175,92,0.15)",  color: "var(--amber)" },
  approved:  { bg: "rgba(74,222,128,0.15)",  color: "#4ade80" },
  cancelled: { bg: "rgba(107,122,141,0.15)", color: "var(--muted)" },
};

const PAYMENT_STATUS_STYLE: Record<PaymentStatus, { bg: string; color: string }> = {
  deposit:        { bg: "rgba(96,165,250,0.15)",  color: "#60a5fa" },
  paid:           { bg: "rgba(74,222,128,0.15)",  color: "#4ade80" },
  refund_pending: { bg: "rgba(251,146,60,0.15)",  color: "#fb923c" },
  refunded:       { bg: "rgba(107,122,141,0.15)", color: "var(--muted)" },
};

const CARD: React.CSSProperties = {
  background: "linear-gradient(160deg, #232b36 0%, #1c2330 100%)",
  border: "1px solid var(--card-border)",
  borderTop: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "0 4px 20px rgba(0,0,0,0.45)",
};

const INPUT_STYLE: React.CSSProperties = {
  background: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  color: "var(--foreground)",
  outline: "none",
};

const PAYMENT_METHODS = ["מזומן", "העברה בנקאית", "ביט / פייבוקס", "כרטיס אשראי"];
const BOOKING_SOURCES = ["ישיר", "Booking.com", "Airbnb", "המלצה", "אחר"];

function fmt(amount: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency", currency: "ILS",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function fmtDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${day}.${month}.${year.slice(2)}`;
}

export default function BookingDetail({
  booking,
  mattressPrice,
  venueName,
}: {
  booking: Booking;
  mattressPrice: number;
  venueName: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justCreated = searchParams.get("created") === "1";

  // ── Quick actions state ───────────────────────────────────────
  const [actionLoading, setActionLoading] = useState(false);
  const [showDepositInput, setShowDepositInput] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  // ── Edit state ────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [ef, setEf] = useState({
    guest_name: booking.guest_name,
    guest_phone: booking.guest_phone ?? "",
    guest_email: booking.guest_email ?? "",
    check_in: booking.check_in,
    check_out: booking.check_out,
    season: booking.season as string,
    discount_type: booking.discount_type ?? "סכום קבוע",
    discount_amount: booking.discount_amount > 0 ? String(booking.discount_amount) : "",
    payment_method: booking.payment_method ?? "",
    booking_source: booking.booking_source ?? "",
    notes: booking.notes ?? "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  function updateEf(field: string, value: string) {
    setEf(prev => ({ ...prev, [field]: value }));
  }

  function openEdit() {
    setEf({
      guest_name: booking.guest_name,
      guest_phone: booking.guest_phone ?? "",
      guest_email: booking.guest_email ?? "",
      check_in: booking.check_in,
      check_out: booking.check_out,
      season: booking.season,
      discount_type: booking.discount_type ?? "סכום קבוע",
      discount_amount: booking.discount_amount > 0 ? String(booking.discount_amount) : "",
      payment_method: booking.payment_method ?? "",
      booking_source: booking.booking_source ?? "",
      notes: booking.notes ?? "",
    });
    setEditError(null);
    setIsEditing(true);
  }

  async function saveEdit() {
    if (!ef.guest_name.trim()) { setEditError("שם האורח הוא שדה חובה"); return; }
    if (!ef.check_in || !ef.check_out || ef.check_in >= ef.check_out) {
      setEditError("תאריכים לא תקינים"); return;
    }
    setEditLoading(true);
    setEditError(null);
    const supabase = createClient();

    const newNights = Math.round((Date.parse(ef.check_out) - Date.parse(ef.check_in)) / 86400000);
    const sKey = SEASON_KEY[ef.season as Season];
    const discAmt = Number(ef.discount_amount) || 0;
    const discFinal = discAmt > 0
      ? ef.discount_type === "לפי לילה" ? discAmt * newNights : discAmt
      : 0;

    let newSubtotal = 0;
    for (const bu of booking.booking_units) {
      const unitPrice = bu.units?.[sKey] ?? 0;
      const newUnitTotal = unitPrice * newNights + bu.mattresses_added * mattressPrice * newNights;
      newSubtotal += newUnitTotal;
      await supabase.from("booking_units").update({ unit_total: newUnitTotal }).eq("id", bu.id);
    }

    const newTotal = Math.max(0, newSubtotal - discFinal);

    const { error } = await supabase.from("bookings").update({
      guest_name: ef.guest_name.trim(),
      guest_phone: ef.guest_phone.trim() || null,
      guest_email: ef.guest_email.trim() || null,
      check_in: ef.check_in,
      check_out: ef.check_out,
      nights_count: newNights,
      season: ef.season,
      discount_type: ef.discount_type || null,
      discount_amount: discAmt,
      total_amount: newTotal,
      payment_method: ef.payment_method || null,
      booking_source: ef.booking_source || null,
      notes: ef.notes.trim() || null,
    }).eq("id", booking.id);

    setEditLoading(false);
    if (error) { setEditError(error.message); return; }
    setIsEditing(false);
    router.refresh();
  }

  // ── Quick actions ─────────────────────────────────────────────
  const orderNum = `ORD-${String(booking.booking_number).padStart(4, "0")}`;
  const seasonKey = SEASON_KEY[booking.season];
  const subtotal = booking.booking_units.reduce((s, bu) => s + bu.unit_total, 0);
  const discountFinal =
    booking.discount_amount > 0
      ? booking.discount_type === "לפי לילה"
        ? booking.discount_amount * booking.nights_count
        : booking.discount_amount
      : 0;

  const combinedState =
    booking.booking_status === "cancelled"
      ? "cancelled"
      : booking.payment_status === "refund_pending"
      ? "refund_pending"
      : booking.booking_status === "approved"
      ? "approved"
      : "pending";

  async function doAction(updates: Record<string, unknown>) {
    setActionLoading(true);
    setActionError(null);
    const supabase = createClient();
    const { error } = await supabase.from("bookings").update(updates).eq("id", booking.id);
    if (error) { setActionError(error.message); setActionLoading(false); return; }
    setActionLoading(false);
    setShowDepositInput(false);
    setDepositAmount("");
    router.refresh();
  }

  async function handleDepositConfirm() {
    const amount = Number(depositAmount);
    if (!depositAmount || amount <= 0) { setActionError("יש להזין סכום תקין"); return; }
    await doAction({
      booking_status: "approved",
      payment_status: amount >= booking.total_amount ? "paid" : "deposit",
      amount_paid: amount,
    });
  }

  const timeInfo = TIME_STATUS_LABELS[booking.time_status] ?? TIME_STATUS_LABELS.future;

  // ── Derived display for edit ─────────────────────────────────
  const editNights = ef.check_in && ef.check_out && ef.check_in < ef.check_out
    ? Math.round((Date.parse(ef.check_out) - Date.parse(ef.check_in)) / 86400000)
    : null;

  return (
    <main className="min-h-dvh px-4 pt-6 pb-4 flex flex-col gap-4" dir="rtl">

      {/* Logo */}
      <header className="flex flex-col items-center pb-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-wide1.neto.svg" alt="Good Night" className="h-[90px] w-auto" />
        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{venueName}</p>
      </header>

      {/* Top nav */}
      <div className="flex items-center justify-between">
        <Link href="/bookings" className="text-sm" style={{ color: "var(--muted)" }}>
          → הזמנות
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>{orderNum}</span>
          {booking.booking_status !== "cancelled" && !isEditing && (
            <button onClick={openEdit}
              className="text-xs px-2.5 py-1 rounded-lg font-medium"
              style={{ background: "rgba(229,175,92,0.15)", color: "var(--amber)", border: "1px solid rgba(229,175,92,0.3)" }}>
              ✎ ערוך
            </button>
          )}
        </div>
      </div>

      {/* ── Edit mode ─────────────────────────────────────────── */}
      {isEditing && (
        <div className="flex flex-col gap-4">

          {editError && (
            <p className="text-xs px-3 py-2 rounded-xl" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
              {editError}
            </p>
          )}

          {/* פרטי אורח */}
          <div className="rounded-2xl px-4 py-4 flex flex-col gap-3" style={CARD}>
            <p className="text-sm font-semibold pb-1.5" style={{ color: "var(--amber)", borderBottom: "1px solid var(--card-border)" }}>פרטי אורח</p>
            <EF label="שם אורח" required>
              <input type="text" value={ef.guest_name} onChange={e => updateEf("guest_name", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
            </EF>
            <div className="grid grid-cols-2 gap-3">
              <EF label="טלפון">
                <input type="tel" value={ef.guest_phone} onChange={e => updateEf("guest_phone", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
              </EF>
              <EF label="מייל">
                <input type="email" value={ef.guest_email} onChange={e => updateEf("guest_email", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
              </EF>
            </div>
          </div>

          {/* תאריכים ועונה */}
          <div className="rounded-2xl px-4 py-4 flex flex-col gap-3" style={CARD}>
            <p className="text-sm font-semibold pb-1.5" style={{ color: "var(--amber)", borderBottom: "1px solid var(--card-border)" }}>תאריכים ועונה</p>
            <div className="grid grid-cols-2 gap-3">
              <EF label="כניסה">
                <input type="date" value={ef.check_in} onChange={e => updateEf("check_in", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
              </EF>
              <EF label="יציאה">
                <input type="date" value={ef.check_out} onChange={e => updateEf("check_out", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
              </EF>
            </div>
            {editNights !== null && (
              <p className="text-xs" style={{ color: "var(--muted)" }}>{editNights} לילות</p>
            )}
            <EF label="עונה">
              <select value={ef.season} onChange={e => updateEf("season", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE}>
                <option value="weekday">אמצ&quot;ש</option>
                <option value="weekend">סופ&quot;ש</option>
                <option value="peak">שיא עונה / חגים</option>
              </select>
            </EF>
          </div>

          {/* הנחה */}
          <div className="rounded-2xl px-4 py-4 flex flex-col gap-3" style={CARD}>
            <p className="text-sm font-semibold pb-1.5" style={{ color: "var(--amber)", borderBottom: "1px solid var(--card-border)" }}>הנחה</p>
            <div className="grid grid-cols-2 gap-3">
              <EF label="סוג הנחה">
                <select value={ef.discount_type} onChange={e => updateEf("discount_type", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE}>
                  <option value="סכום קבוע">סכום קבוע</option>
                  <option value="לפי לילה">לפי לילה</option>
                </select>
              </EF>
              <EF label="סכום (₪)">
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: "var(--muted)" }}>₪</span>
                  <input type="number" min="0" value={ef.discount_amount}
                    onChange={e => updateEf("discount_amount", e.target.value)}
                    placeholder="0" className="w-full pr-6 pl-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
                </div>
              </EF>
            </div>
          </div>

          {/* פרטים נוספים */}
          <div className="rounded-2xl px-4 py-4 flex flex-col gap-3" style={CARD}>
            <p className="text-sm font-semibold pb-1.5" style={{ color: "var(--amber)", borderBottom: "1px solid var(--card-border)" }}>פרטים נוספים</p>
            <div className="grid grid-cols-2 gap-3">
              <EF label="אמצעי תשלום">
                <select value={ef.payment_method} onChange={e => updateEf("payment_method", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE}>
                  <option value="">—</option>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </EF>
              <EF label="מקור הזמנה">
                <select value={ef.booking_source} onChange={e => updateEf("booking_source", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE}>
                  <option value="">—</option>
                  {BOOKING_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </EF>
            </div>
            <EF label="הערות">
              <textarea value={ef.notes} onChange={e => updateEf("notes", e.target.value)}
                rows={3} className="w-full px-3 py-2.5 rounded-xl text-sm resize-none" style={INPUT_STYLE} />
            </EF>
          </div>

          {/* שמור / ביטול */}
          <div className="flex gap-2 pb-2">
            <button onClick={saveEdit} disabled={editLoading}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition-opacity active:opacity-80"
              style={{ background: "var(--amber)", color: "#1a1000", opacity: editLoading ? 0.6 : 1 }}>
              {editLoading ? "שומר..." : "שמור שינויים"}
            </button>
            <button onClick={() => setIsEditing(false)} disabled={editLoading}
              className="px-5 py-3 rounded-xl text-sm font-medium"
              style={{ background: "var(--card-border)", color: "var(--foreground)" }}>
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* ── View mode ─────────────────────────────────────────── */}
      {!isEditing && (
        <>
          {/* Success banner */}
          {justCreated && (
            <div className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
              style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.35)" }}>
              <p className="text-sm font-medium" style={{ color: "#4ade80" }}>✓ ההזמנה נשמרה בהצלחה</p>
              <Link href="/dashboard" className="text-xs px-3 py-1.5 rounded-lg font-medium shrink-0"
                style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80" }}>
                לדשבורד
              </Link>
            </div>
          )}

          {/* Guest heading + badges */}
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2 flex-wrap">
              <h1 className="text-xl font-bold flex-1 min-w-0">{booking.guest_name}</h1>
              <div className="flex gap-1.5 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={BOOKING_STATUS_STYLE[booking.booking_status]}>
                  {BOOKING_STATUS_LABELS[booking.booking_status]}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={PAYMENT_STATUS_STYLE[booking.payment_status]}>
                  {booking.payment_status === "deposit" && booking.amount_paid === 0
                    ? "טרם שולם"
                    : PAYMENT_STATUS_LABELS[booking.payment_status]}
                </span>
              </div>
            </div>
            {booking.guest_phone && (
              <a href={`tel:${booking.guest_phone}`} className="text-sm font-medium" style={{ color: "var(--amber)" }}>
                {booking.guest_phone}
              </a>
            )}
            {booking.guest_email && (
              <p className="text-sm" style={{ color: "var(--muted)" }}>{booking.guest_email}</p>
            )}
          </div>

          {/* Dates + season */}
          <div className="rounded-2xl px-4 py-4" style={CARD}>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <InfoCell label="כניסה" value={fmtDate(booking.check_in)} />
              <InfoCell label="יציאה" value={fmtDate(booking.check_out)} />
              <InfoCell label="לילות" value={String(booking.nights_count)} />
              <InfoCell label="עונה" value={SEASON_LABELS[booking.season]} />
            </div>
            <p className="text-xs mt-3" style={{ color: timeInfo.color }}>{timeInfo.label}</p>
          </div>

          {/* Calculation breakdown */}
          <div className="rounded-2xl px-4 py-4 flex flex-col gap-3" style={CARD}>
            <h2 className="text-sm font-semibold pb-2"
              style={{ color: "var(--muted)", borderBottom: "1px solid var(--card-border)" }}>
              פירוט חישוב
            </h2>
            {booking.booking_units.map((bu) => {
              const unitPrice = bu.units?.[seasonKey] ?? 0;
              const baseAmt = unitPrice * booking.nights_count;
              const mattressAmt = bu.mattresses_added * mattressPrice * booking.nights_count;
              return (
                <div key={bu.id} className="flex flex-col gap-1.5">
                  <p className="text-sm font-medium">{bu.units?.name ?? "יחידה"}</p>
                  <CalcRow label={`₪${unitPrice} × ${booking.nights_count} לילות`} value={fmt(baseAmt)} />
                  {bu.mattresses_added > 0 && (
                    <CalcRow
                      label={`${bu.mattresses_added} מזרונ${bu.mattresses_added === 1 ? "" : "ים"} × ₪${mattressPrice} × ${booking.nights_count} לילות`}
                      value={fmt(mattressAmt)}
                    />
                  )}
                  {booking.booking_units.length > 1 && (
                    <CalcRow label="סה״כ יחידה" value={fmt(bu.unit_total)} muted={false} />
                  )}
                </div>
              );
            })}
            <div className="flex flex-col gap-1.5 pt-2" style={{ borderTop: "1px solid var(--card-border)" }}>
              {booking.booking_units.length > 1 && (
                <CalcRow label="סכום ביניים" value={fmt(subtotal)} />
              )}
              {discountFinal > 0 && (
                <CalcRow
                  label={`הנחה${booking.discount_type === "לפי לילה" ? ` (₪${booking.discount_amount}/לילה × ${booking.nights_count})` : ""}`}
                  value={`−${fmt(discountFinal)}`}
                  valueColor="#fb923c"
                />
              )}
              <CalcRow label="סה״כ" value={fmt(booking.total_amount)} bold />
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-2xl px-4 py-4 flex flex-col gap-2" style={CARD}>
            <h2 className="text-sm font-semibold pb-2"
              style={{ color: "var(--muted)", borderBottom: "1px solid var(--card-border)" }}>
              תשלום
            </h2>
            <CalcRow label="שולם" value={fmt(booking.amount_paid)} />
            {booking.balance_due > 0 ? (
              <CalcRow label="יתרה לתשלום" value={fmt(booking.balance_due)} valueColor="var(--amber)" bold />
            ) : booking.payment_status === "paid" ? (
              <p className="text-xs" style={{ color: "#4ade80" }}>✓ שולם במלואו</p>
            ) : null}
            {booking.payment_method && (
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>אמצעי תשלום: {booking.payment_method}</p>
            )}
          </div>

          {/* Quick actions */}
          {combinedState !== "cancelled" && (
            <div className="rounded-2xl px-4 py-4 flex flex-col gap-3"
              style={{ ...CARD, borderColor: "rgba(229,175,92,0.3)" }}>
              <h2 className="text-sm font-semibold" style={{ color: "var(--amber)" }}>פעולות</h2>

              {actionError && (
                <p className="text-xs px-3 py-2 rounded-xl"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                  {actionError}
                </p>
              )}

              {combinedState === "pending" && (
                <>
                  {!showDepositInput ? (
                    <ActionBtn label="הועברה מקדמה" color="#4ade80" loading={actionLoading}
                      onClick={() => setShowDepositInput(true)} />
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs" style={{ color: "var(--muted)" }}>סכום המקדמה:</p>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
                            style={{ color: "var(--muted)" }}>₪</span>
                          <input type="number" min="1" value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            placeholder="0" className="w-full pr-7 pl-3 py-2.5 rounded-xl text-sm"
                            style={INPUT_STYLE} autoFocus />
                        </div>
                        <button onClick={handleDepositConfirm} disabled={actionLoading}
                          className="px-4 py-2.5 rounded-xl text-sm font-bold"
                          style={{ background: "#4ade80", color: "#0f1f0f", opacity: actionLoading ? 0.6 : 1 }}>
                          {actionLoading ? "..." : "אשר"}
                        </button>
                        <button onClick={() => { setShowDepositInput(false); setDepositAmount(""); }}
                          className="px-4 py-2.5 rounded-xl text-sm"
                          style={{ background: "var(--card-border)", color: "var(--foreground)" }}>
                          ביטול
                        </button>
                      </div>
                    </div>
                  )}
                  <ActionBtn label="בטל הזמנה" color="#ef4444" loading={actionLoading} outline
                    onClick={() => { if (confirm("לבטל הזמנה זו?")) doAction({ booking_status: "cancelled" }); }} />
                </>
              )}

              {combinedState === "approved" && (
                <>
                  {booking.payment_status !== "paid" && (
                    <ActionBtn label="סמן כשולם במלואו" color="#4ade80" loading={actionLoading}
                      onClick={() => doAction({ payment_status: "paid", amount_paid: booking.total_amount })} />
                  )}
                  <ActionBtn label="בקשת החזר" color="#fb923c" loading={actionLoading} outline
                    onClick={() => { if (confirm("לסמן הזמנה זו כממתינה להחזר?")) doAction({ payment_status: "refund_pending" }); }} />
                </>
              )}

              {combinedState === "refund_pending" && (
                <>
                  <ActionBtn label="החזר בוצע" color="#4ade80" loading={actionLoading}
                    onClick={() => doAction({ payment_status: "refunded" })} />
                  <ActionBtn label="בטל הזמנה" color="#ef4444" loading={actionLoading} outline
                    onClick={() => { if (confirm("לבטל הזמנה זו?")) doAction({ booking_status: "cancelled" }); }} />
                </>
              )}
            </div>
          )}

          {/* Notes */}
          {booking.notes && (
            <div className="rounded-2xl px-4 py-4" style={CARD}>
              <h2 className="text-sm font-semibold pb-2 mb-2"
                style={{ color: "var(--muted)", borderBottom: "1px solid var(--card-border)" }}>
                הערות
              </h2>
              <p className="text-sm" style={{ whiteSpace: "pre-wrap" }}>{booking.notes}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="flex flex-col gap-1.5 px-1 pb-2">
            {booking.booking_source && (
              <p className="text-xs" style={{ color: "var(--muted)" }}>מקור: {booking.booking_source}</p>
            )}
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              נוצר: {fmtDate(booking.created_at.split("T")[0])}
            </p>
            {booking.has_conflict && (
              <p className="text-xs px-2 py-1 rounded-lg"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                ⚠ קיים חפיפה בתפוסה
              </p>
            )}
          </div>
        </>
      )}

    </main>
  );
}

// ── Helpers ──────────────────────────────────────────────────────

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs" style={{ color: "var(--muted)" }}>{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function CalcRow({ label, value, bold, valueColor, muted = true }: {
  label: string; value: string; bold?: boolean; valueColor?: string; muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs" style={{ color: muted ? "var(--muted)" : "var(--foreground)" }}>{label}</span>
      <span className={`text-sm ${bold ? "font-bold" : ""}`} style={{ color: valueColor ?? "var(--foreground)" }}>
        {value}
      </span>
    </div>
  );
}

function ActionBtn({ label, color, loading, onClick, outline }: {
  label: string; color: string; loading: boolean; onClick: () => void; outline?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={loading}
      className="w-full py-3 rounded-xl text-sm font-bold transition-opacity active:opacity-80"
      style={outline
        ? { background: "transparent", border: `1px solid ${color}`, color, opacity: loading ? 0.6 : 1 }
        : { background: color, color: "#0f1f0f", opacity: loading ? 0.6 : 1 }}>
      {loading ? "..." : label}
    </button>
  );
}

function EF({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs" style={{ color: "var(--muted)" }}>
        {label}{required && <span style={{ color: "var(--amber)" }}> *</span>}
      </label>
      {children}
    </div>
  );
}
