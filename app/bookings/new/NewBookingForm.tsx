"use client";

import { useState, useMemo, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import DateRangePicker from "./DateRangePicker";

type Season = "weekday" | "weekend" | "peak";
type DiscountType = "total" | "per_night";

interface Unit {
  id: string;
  name: string;
  beds_count: number;
  max_mattresses: number;
  weekday_price: number;
  weekend_price: number;
  peak_price: number;
  is_whole_venue: boolean;
}

interface Props {
  venueId: string;
  venueName: string;
  mattressPrice: number;
  units: Unit[];
}

const SEASON_OPTIONS: { value: Season; label: string }[] = [
  { value: "weekday", label: 'אמצ"ש' },
  { value: "weekend", label: 'סופ"ש' },
  { value: "peak", label: "שיא עונה / חגים" },
];

const PAYMENT_METHODS = ["מזומן", "העברה בנקאית", "ביט / פייבוקס", "כרטיס אשראי"];
const BOOKING_SOURCES = ["ישיר", "Booking.com", "Airbnb", "המלצה", "אחר"];

const INPUT_STYLE = {
  background: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  color: "var(--foreground)",
  outline: "none",
} as const;

export default function NewBookingForm({ venueId, venueName, mattressPrice, units }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [season, setSeason] = useState<Season>("weekday");

  const [selectedUnits, setSelectedUnits] = useState<Record<string, number>>({});

  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("total");
  const [discountValue, setDiscountValue] = useState("");

  const [bookingSource, setBookingSource] = useState("");
  const [notes, setNotes] = useState("");

  const [approvedByUnit, setApprovedByUnit] = useState<Map<string, Set<string>>>(new Map());
  const [pendingByUnit, setPendingByUnit] = useState<Map<string, Set<string>>>(new Map());

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("occupancy")
      .select("unit_id, date, bookings!booking_id(booking_status)")
      .in("unit_id", units.map((u) => u.id))
      .then(({ data }) => {
        const approved = new Map<string, Set<string>>();
        const pending = new Map<string, Set<string>>();
        for (const row of (data ?? [])) {
          const bArr = row.bookings as { booking_status: string }[] | null;
          const status = Array.isArray(bArr) ? bArr[0]?.booking_status : (bArr as unknown as { booking_status: string } | null)?.booking_status;
          const map = status === "approved" ? approved : status === "pending" ? pending : null;
          if (!map) continue;
          if (!map.has(row.unit_id)) map.set(row.unit_id, new Set<string>());
          map.get(row.unit_id)!.add(row.date);
        }
        setApprovedByUnit(approved);
        setPendingByUnit(pending);
      });
  }, [units]);

  // ── חישובים ──────────────────────────────────────────────────

  const nightsCount = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const [y1, m1, d1] = checkIn.split("-").map(Number);
    const [y2, m2, d2] = checkOut.split("-").map(Number);
    return Math.max(0, (Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
  }, [checkIn, checkOut]);

  function getUnitPrice(unit: Unit): number {
    if (season === "weekend") return unit.weekend_price;
    if (season === "peak") return unit.peak_price;
    return unit.weekday_price;
  }

  function calcUnitTotal(unit: Unit, mattresses: number): number {
    return (getUnitPrice(unit) + mattresses * mattressPrice) * nightsCount;
  }

  const discountFinal = useMemo(() => {
    const val = Number(discountValue) || 0;
    if (val <= 0) return 0;
    return discountType === "per_night" ? val * nightsCount : val;
  }, [discountValue, discountType, nightsCount]);

  const subtotal = useMemo(() => {
    if (nightsCount <= 0) return 0;
    let total = 0;
    for (const [unitId, mattresses] of Object.entries(selectedUnits)) {
      const unit = units.find((u) => u.id === unitId);
      if (!unit) continue;
      const price = season === "weekend" ? unit.weekend_price : season === "peak" ? unit.peak_price : unit.weekday_price;
      total += (price + mattresses * mattressPrice) * nightsCount;
    }
    return total;
  }, [selectedUnits, nightsCount, season, units, mattressPrice]);

  const totalAmount = Math.max(0, subtotal - discountFinal);

  const maxMattressesWholeVenue = useMemo(
    () => units.filter((u) => !u.is_whole_venue).reduce((sum, u) => sum + u.max_mattresses, 0),
    [units]
  );

  const { hardBlocked, softBusy } = useMemo(() => {
    const selectedIds = Object.keys(selectedUnits);
    if (selectedIds.length === 0) {
      const soft = new Set<string>();
      for (const dates of approvedByUnit.values()) for (const d of dates) soft.add(d);
      for (const dates of pendingByUnit.values()) for (const d of dates) soft.add(d);
      return { hardBlocked: new Set<string>(), softBusy: soft };
    }
    const hasWhole = selectedIds.some((id) => units.find((u) => u.id === id)?.is_whole_venue);
    const toCheck = hasWhole ? units.map((u) => u.id) : selectedIds;
    const hard = new Set<string>();
    const soft = new Set<string>();
    for (const id of toCheck) {
      for (const d of (approvedByUnit.get(id) ?? new Set<string>())) hard.add(d);
      for (const d of (pendingByUnit.get(id) ?? new Set<string>())) soft.add(d);
    }
    for (const d of hard) soft.delete(d);
    return { hardBlocked: hard, softBusy: soft };
  }, [approvedByUnit, pendingByUnit, selectedUnits, units]);

  // ── פעולות יחידות ────────────────────────────────────────────

  function toggleUnit(unit: Unit) {
    if (unit.is_whole_venue) {
      setSelectedUnits((prev) =>
        prev[unit.id] !== undefined ? {} : { [unit.id]: 0 }
      );
    } else {
      setSelectedUnits((prev) => {
        if (prev[unit.id] !== undefined) {
          const next = { ...prev };
          delete next[unit.id];
          return next;
        }
        const next: Record<string, number> = {};
        for (const [id, m] of Object.entries(prev)) {
          if (!units.find((u) => u.id === id)?.is_whole_venue) next[id] = m;
        }
        next[unit.id] = 0;
        return next;
      });
    }
  }

  function setMattresses(unitId: string, value: number) {
    setSelectedUnits((prev) => ({ ...prev, [unitId]: value }));
  }

  // ── שליחה ────────────────────────────────────────────────────

  function getDateRange(ci: string, co: string): string[] {
    const dates: string[] = [];
    const [y1, m1, d1] = ci.split("-").map(Number);
    const [y2, m2, d2] = co.split("-").map(Number);
    let cur = Date.UTC(y1, m1 - 1, d1);
    const end = Date.UTC(y2, m2 - 1, d2);
    while (cur < end) {
      const d = new Date(cur);
      dates.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`);
      cur += 86400000;
    }
    return dates;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!guestName.trim()) return setError("שם האורח הוא שדה חובה");
    if (!guestPhone.trim()) return setError("טלפון הוא שדה חובה");
    if (!checkIn || !checkOut) return setError("יש לבחור תאריכי כניסה ויציאה");
    if (nightsCount <= 0) return setError("תאריך היציאה חייב להיות אחרי הכניסה");
    if (Object.keys(selectedUnits).length === 0) return setError("יש לבחור לפחות יחידה אחת");

    const paid = Number(amountPaid) || 0;
    const bookingStatus = paid > 0 ? "approved" : "pending";
    const paymentStatus = paid >= totalAmount && totalAmount > 0 ? "paid" : paid > 0 ? "deposit" : "deposit";

    startTransition(async () => {
      const supabase = createClient();

      // בדיקת חפיפות לפני יצירת ההזמנה
      const hasWholeVenueCheck = Object.keys(selectedUnits).some(
        (id) => units.find((u) => u.id === id)?.is_whole_venue
      );
      const unitIdsToCheck = hasWholeVenueCheck
        ? units.map((u) => u.id)
        : Object.keys(selectedUnits);
      const datesToCheck = getDateRange(checkIn, checkOut);

      const { data: conflicts } = await supabase
        .from("occupancy")
        .select("unit_id")
        .in("unit_id", unitIdsToCheck)
        .in("date", datesToCheck);

      if (conflicts && conflicts.length > 0) {
        const conflictIds = [...new Set(conflicts.map((r: { unit_id: string }) => r.unit_id))];
        const conflictNames = conflictIds
          .map((id) => units.find((u) => u.id === id)?.name)
          .filter(Boolean)
          .join(", ");
        const plural = conflictIds.length > 1;
        setError(`חפיפה בתאריכים: ${conflictNames} כבר ${plural ? "תפוסות" : "תפוסה"} בחלק מהימים שנבחרו. בדוק את יומן הזמינות.`);
        return;
      }

      const { data: booking, error: bookingErr } = await supabase
        .from("bookings")
        .insert({
          venue_id: venueId,
          guest_name: guestName.trim(),
          guest_phone: guestPhone.trim(),
          guest_email: guestEmail.trim() || null,
          check_in: checkIn,
          check_out: checkOut,
          season,
          booking_status: bookingStatus,
          payment_status: paymentStatus,
          total_amount: totalAmount,
          amount_paid: paid,
          discount_type: discountFinal > 0 ? (discountType === "per_night" ? "לפי לילה" : "כוללת") : null,
          discount_amount: discountFinal,
          payment_method: paymentMethod || null,
          booking_source: bookingSource || null,
          notes: notes.trim() || null,
          mattress_price_used: mattressPrice,
        })
        .select("id")
        .single();

      if (bookingErr || !booking) {
        setError("שגיאה בשמירת ההזמנה, נסה שוב");
        return;
      }

      const hasWholeVenue = Object.keys(selectedUnits).some(
        (id) => units.find((u) => u.id === id)?.is_whole_venue
      );

      const unitRecords = hasWholeVenue
        ? units.map((u) => ({
            booking_id: booking.id,
            unit_id: u.id,
            mattresses_added: selectedUnits[u.id] ?? 0,
            unit_total: u.is_whole_venue ? calcUnitTotal(u, selectedUnits[u.id] ?? 0) : 0,
            price_per_night: getUnitPrice(u),
          }))
        : Object.entries(selectedUnits).map(([unitId, mattresses]) => {
            const unit = units.find((u) => u.id === unitId)!;
            return {
              booking_id: booking.id,
              unit_id: unitId,
              mattresses_added: mattresses,
              unit_total: calcUnitTotal(unit, mattresses),
              price_per_night: getUnitPrice(unit),
            };
          });

      const { error: unitsErr } = await supabase.from("booking_units").insert(unitRecords);
      if (unitsErr) { setError("שגיאה בשמירת היחידות, נסה שוב"); return; }

      const dates = getDateRange(checkIn, checkOut);
      const occupancy = unitRecords.flatMap((bu) =>
        dates.map((date) => ({ unit_id: bu.unit_id, booking_id: booking.id, date, status: "booked" as const }))
      );

      const { error: occErr } = await supabase.from("occupancy").insert(occupancy);
      if (occErr) { setError("שגיאה בשמירת התפוסה, נסה שוב"); return; }

      router.push(`/bookings/${booking.id}?created=1`);
    });
  }

  const regularUnits = units.filter((u) => !u.is_whole_venue);
  const wholeVenueUnit = units.find((u) => u.is_whole_venue);
  const selectedCount = Object.keys(selectedUnits).length;

  // ── תצוגה ────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} dir="rtl" className="flex flex-col gap-5">

      {/* לוגו */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.25rem" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-wide1.neto.svg" alt="Good Night" style={{ height: "90px", width: "auto" }} />
      </div>

      {/* כותרת */}
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: "1.3rem", fontWeight: 700 }}>
          <span style={{ color: "var(--amber)" }}>הזמנה חדשה</span>
          {venueName && (
            <>
              <span style={{ color: "var(--muted)", fontWeight: 400 }}> ← </span>
              <span>{venueName}</span>
            </>
          )}
        </h1>
        <Link href="/bookings" className="text-sm" style={{ color: "var(--muted)" }}>
          → הזמנות
        </Link>
      </div>

      {/* פרטי אורח */}
      <Section title="פרטי אורח" icon={
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
      }>
        <Field label="שם אורח" required>
          <input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)}
            placeholder="שם מלא" className="w-full px-3 py-3 rounded-xl text-sm" style={INPUT_STYLE} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="טלפון" required>
            <input type="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="050-0000000" className="w-full px-3 py-3 rounded-xl text-sm" style={INPUT_STYLE} />
          </Field>
          <Field label="מייל">
            <input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="mail@example.com" className="w-full px-3 py-3 rounded-xl text-sm" style={INPUT_STYLE} />
          </Field>
        </div>
      </Section>

      {/* תאריכים */}
      <Section title="תאריכים" icon={
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      }>
        <DateRangePicker
          checkIn={checkIn}
          checkOut={checkOut}
          blockedDates={hardBlocked}
          busyDates={softBusy}
          onChange={(ci, co) => { setCheckIn(ci); setCheckOut(co); }}
        />
        {nightsCount > 0 && (
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {nightsCount === 1 ? "לילה אחד" : `${nightsCount} לילות`}
          </p>
        )}
        <Field label="עונה" required>
          <div className="grid grid-cols-3 gap-2">
            {SEASON_OPTIONS.map((opt) => (
              <button key={opt.value} type="button" onClick={() => setSeason(opt.value)}
                className="py-2.5 rounded-xl text-sm font-medium"
                style={{
                  background: season === opt.value ? "var(--amber)" : "var(--card-bg)",
                  color: season === opt.value ? "#1a1000" : "var(--muted)",
                  border: `1px solid ${season === opt.value ? "var(--amber)" : "var(--card-border)"}`,
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      {/* יחידות */}
      <Section title="יחידות" icon={
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      }>
        <div className="flex flex-col gap-2">
          {regularUnits.map((unit) => {
            const isSelected = selectedUnits[unit.id] !== undefined;
            const mattresses = selectedUnits[unit.id] ?? 0;
            return (
              <div key={unit.id} className="rounded-xl px-4 py-3"
                style={{
                  background: isSelected ? "rgba(229,175,92,0.08)" : "var(--card-bg)",
                  border: `1px solid ${isSelected ? "var(--amber)" : "var(--card-border)"}`,
                }}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={isSelected} onChange={() => toggleUnit(unit)}
                    className="w-5 h-5 rounded" style={{ accentColor: "var(--amber)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{unit.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      {unit.beds_count} מיטות
                      {unit.max_mattresses > 0 && ` · מקס׳ ${unit.max_mattresses} מזרונים`}
                      {getUnitPrice(unit) > 0 && ` · ₪${getUnitPrice(unit)}/ל׳`}
                    </p>
                  </div>
                  {isSelected && nightsCount > 0 && (
                    <span className="text-sm font-bold shrink-0" style={{ color: "var(--amber)" }}>
                      ₪{calcUnitTotal(unit, mattresses).toLocaleString("he-IL")}
                    </span>
                  )}
                </label>
                {isSelected && unit.max_mattresses > 0 && (
                  <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: "1px solid var(--card-border)" }}>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>מזרונים נוספים:</span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setMattresses(unit.id, Math.max(0, mattresses - 1))}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
                        style={{ background: "var(--card-border)" }}>−</button>
                      <span className="text-sm w-4 text-center">{mattresses}</span>
                      <button type="button" onClick={() => setMattresses(unit.id, Math.min(unit.max_mattresses, mattresses + 1))}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
                        style={{ background: "var(--card-border)" }}>+</button>
                    </div>
                    {mattressPrice > 0 && (
                      <span className="text-xs" style={{ color: "var(--muted)" }}>₪{mattressPrice}/מזרון/ל׳</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {wholeVenueUnit && (
            <div className="rounded-xl px-4 py-3"
              style={{
                background: selectedUnits[wholeVenueUnit.id] !== undefined ? "rgba(229,175,92,0.08)" : "var(--card-bg)",
                border: `1px solid ${selectedUnits[wholeVenueUnit.id] !== undefined ? "var(--amber)" : "var(--card-border)"}`,
              }}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={selectedUnits[wholeVenueUnit.id] !== undefined}
                  onChange={() => toggleUnit(wholeVenueUnit)}
                  className="w-5 h-5" style={{ accentColor: "var(--amber)" }} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{wholeVenueUnit.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--amber)" }}>
                    כל המתחם · {getUnitPrice(wholeVenueUnit) > 0 ? `₪${getUnitPrice(wholeVenueUnit)}/ל׳` : ""}
                  </p>
                </div>
                {selectedUnits[wholeVenueUnit.id] !== undefined && nightsCount > 0 && (
                  <span className="text-sm font-bold shrink-0" style={{ color: "var(--amber)" }}>
                    ₪{calcUnitTotal(wholeVenueUnit, selectedUnits[wholeVenueUnit.id] ?? 0).toLocaleString("he-IL")}
                  </span>
                )}
              </label>
              {selectedUnits[wholeVenueUnit.id] !== undefined && maxMattressesWholeVenue > 0 && (
                <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: "1px solid var(--card-border)" }}>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>מזרונים נוספים (מקס׳ {maxMattressesWholeVenue}):</span>
                  <div className="flex items-center gap-2">
                    <button type="button"
                      onClick={() => setMattresses(wholeVenueUnit.id, Math.max(0, (selectedUnits[wholeVenueUnit.id] ?? 0) - 1))}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{ background: "var(--card-border)" }}>−</button>
                    <span className="text-sm w-4 text-center">{selectedUnits[wholeVenueUnit.id] ?? 0}</span>
                    <button type="button"
                      onClick={() => setMattresses(wholeVenueUnit.id, Math.min(maxMattressesWholeVenue, (selectedUnits[wholeVenueUnit.id] ?? 0) + 1))}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{ background: "var(--card-border)" }}>+</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Section>

      {/* תשלום */}
      <Section title="תשלום" icon={
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      }>
        {/* הנחה */}
        <div className="rounded-xl px-4 py-3 flex flex-col gap-3"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
          <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>הנחה</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: "total" as const, label: "כוללת" },
              { value: "per_night" as const, label: "לפי לילה" },
            ]).map((opt) => (
              <button key={opt.value} type="button" onClick={() => setDiscountType(opt.value)}
                className="py-2 rounded-lg text-sm font-medium"
                style={{
                  background: discountType === opt.value ? "rgba(229,175,92,0.15)" : "transparent",
                  color: discountType === opt.value ? "var(--amber)" : "var(--muted)",
                  border: `1px solid ${discountType === opt.value ? "var(--amber)" : "var(--card-border)"}`,
                }}>
                {opt.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: "var(--muted)" }}>₪</span>
            <input type="number" min="0" value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder="0" className="w-full pr-7 pl-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
          </div>
          {discountFinal > 0 && nightsCount > 0 && (
            <p className="text-xs" style={{ color: "var(--amber)" }}>
              הנחה סופית: ₪{discountFinal.toLocaleString("he-IL")}
              {discountType === "per_night" && ` (₪${Number(discountValue)} × ${nightsCount} לילות)`}
            </p>
          )}
        </div>

        {/* סיכום מחיר */}
        {selectedCount > 0 && nightsCount > 0 && (
          <div className="rounded-xl px-4 py-3 flex flex-col gap-1.5"
            style={{ background: "rgba(229,175,92,0.08)", border: "1px solid var(--amber)" }}>
            {discountFinal > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--muted)" }}>לפני הנחה</span>
                <span style={{ color: "var(--muted)" }}>₪{subtotal.toLocaleString("he-IL")}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: "var(--muted)" }}>
                {selectedCount} יחידות · {nightsCount === 1 ? "לילה" : `${nightsCount} לילות`}
              </span>
              <span className="text-base font-bold" style={{ color: "var(--amber)" }}>
                ₪{totalAmount.toLocaleString("he-IL")}
              </span>
            </div>
          </div>
        )}

        {/* שולם */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="שולם">
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: "var(--muted)" }}>₪</span>
              <input type="number" min="0" value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0" className="w-full pr-7 pl-3 py-3 rounded-xl text-sm" style={INPUT_STYLE} />
            </div>
          </Field>
          <Field label="אמצעי תשלום">
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-3 rounded-xl text-sm" style={{ ...INPUT_STYLE, direction: "rtl" }}>
              <option value="">בחר...</option>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
        </div>

        {Number(amountPaid) > 0 ? (
          <p className="text-xs px-1" style={{ color: "#4ade80" }}>✓ ההזמנה תישמר כ&quot;אושרה&quot;</p>
        ) : (
          <p className="text-xs px-1" style={{ color: "var(--muted)" }}>ללא תשלום — ההזמנה תישמר כ&quot;ממתינה לאישור&quot;</p>
        )}
      </Section>

      {/* נוספות */}
      <Section title="נוספות" icon={
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      }>
        <Field label="מקור הזמנה">
          <select value={bookingSource} onChange={(e) => setBookingSource(e.target.value)}
            className="w-full px-3 py-3 rounded-xl text-sm" style={{ ...INPUT_STYLE, direction: "rtl" }}>
            <option value="">בחר...</option>
            {BOOKING_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="הערות">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="הערות נוספות..." rows={3}
            className="w-full px-3 py-3 rounded-xl text-sm resize-none" style={INPUT_STYLE} />
        </Field>
      </Section>

      {/* שגיאה */}
      {error && (
        <p className="text-sm px-3 py-2.5 rounded-xl" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
          {error}
        </p>
      )}

      <button type="submit" disabled={isPending}
        className="w-full py-4 rounded-2xl font-bold text-base transition-opacity active:opacity-80"
        style={{ background: "var(--amber)", color: "#1a1000", opacity: isPending ? 0.6 : 1 }}>
        {isPending ? "שומר..." : "שמור הזמנה"}
      </button>

    </form>
  );
}

// ── Helpers ───────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{
      background: "linear-gradient(160deg, #232b36 0%, #1c2330 100%)",
      border: "1px solid var(--card-border)",
      borderTop: "1px solid rgba(255,255,255,0.07)",
      boxShadow: "0 4px 20px rgba(0,0,0,0.45)",
      borderRadius: "1.25rem",
      padding: "1.1rem 1rem 1.25rem",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "0.5rem",
        marginBottom: "0.9rem", paddingBottom: "0.75rem",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        {icon}
        <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--amber)" }}>{title}</span>
      </div>
      <div className="flex flex-col gap-3">
        {children}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>
        {label}{required && <span style={{ color: "var(--amber)" }}> *</span>}
      </label>
      {children}
    </div>
  );
}
