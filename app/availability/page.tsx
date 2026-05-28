"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { HDate, HebrewCalendar } from "@hebcal/core";
import { createClient } from "@/lib/supabase/client";

type BookingStatus = "approved" | "pending" | "cancelled";

interface Unit {
  id: string;
  name: string;
  beds_count: number;
  max_mattresses: number;
}

interface Booking {
  id: string;
  unit_id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  booking_status: BookingStatus;
}

type ModalState =
  | { type: "booking"; unit: Unit; booking: Booking }
  | { type: "empty"; unit: Unit; date: string };


// ── Helpers ──────────────────────────────────────────────────────────────────
const HEB_MONTHS = ["", "ניסן", "אייר", "סיון", "תמוז", "אב", "אלול",
  "תשרי", "חשון", "כסלו", "טבת", "שבט", "אדר א׳", "אדר ב׳"];

const HEB_NUMS = ["", "א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ז׳", "ח׳", "ט׳", "י׳",
  'י"א', 'י"ב', 'י"ג', 'י"ד', 'ט"ו', 'ט"ז', 'י"ז', 'י"ח', 'י"ט', "כ׳",
  'כ"א', 'כ"ב', 'כ"ג', 'כ"ד', 'כ"ה', 'כ"ו', 'כ"ז', 'כ"ח', 'כ"ט', "ל׳"];

const DAY_NAMES = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function parseDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function getWeekStart(d: Date) {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  r.setHours(0, 0, 0, 0);
  return r;
}

function hebrewShort(date: Date): string {
  try {
    const hd = new HDate(date);
    return `${HEB_NUMS[hd.getDate()] ?? hd.getDate()} ${HEB_MONTHS[hd.getMonth()] ?? ""}`;
  } catch {
    return "";
  }
}

function abbreviateHoliday(name: string): string {
  if (name.includes("ראש חודש")) return name.replace("ראש חודש", 'ר"ח');
  if (name.includes("ראש חדש")) return name.replace("ראש חדש", 'ר"ח');
  return name;
}

interface WeekData {
  events: Record<string, string[]>;
  parasha: string | null;
}

function getWeekData(weekStart: Date): WeekData {
  try {
    const weekEnd = addDays(weekStart, 6);
    const evList = HebrewCalendar.calendar({
      start: new HDate(weekStart),
      end: new HDate(weekEnd),
      il: true,
      sedrot: true,
      locale: "he",
    } as Parameters<typeof HebrewCalendar.calendar>[0]);

    const byDate: Record<string, string[]> = {};
    let parasha: string | null = null;

    for (const ev of evList) {
      const cats = ev.getCategories();
      if (cats.includes("candles") || cats.includes("havdalah")) continue;

      if (cats.includes("parashat")) {
        parasha = (ev as { renderBrief?: (l: string) => string }).renderBrief?.("he") ?? ev.render("he");
        continue;
      }

      let desc: string;
      const englishName = ev.render("en");
      if (englishName.toLowerCase().startsWith("rosh chodesh")) {
        const heWords = ev.render("he").trim().split(/\s+/);
        const month = heWords.slice(2).join(" "); // skip "ראש חודש"
        desc = month ? `ר"ח ${month}` : 'ר"ח';
      } else {
        desc = (ev as { renderBrief?: (l: string) => string }).renderBrief?.("he") ?? ev.render("he");
      }

      if (!desc) continue;
      const key = toDateStr((ev.getDate() as HDate).greg());
      if (!byDate[key]) byDate[key] = [];
      if (!byDate[key].includes(desc)) byDate[key].push(desc);
    }

    return { events: byDate, parasha };
  } catch {
    return { events: {}, parasha: null };
  }
}

function toHebrewYear(year: number): string {
  const y = year % 1000;
  const vals: [number, string][] = [
    [400,"ת"],[300,"ש"],[200,"ר"],[100,"ק"],
    [90,"צ"],[80,"פ"],[70,"ע"],[60,"ס"],[50,"נ"],
    [40,"מ"],[30,"ל"],[20,"כ"],[10,"י"],
    [9,"ט"],[8,"ח"],[7,"ז"],[6,"ו"],[5,"ה"],
    [4,"ד"],[3,"ג"],[2,"ב"],[1,"א"],
  ];
  let rem = y, result = "";
  for (const [v, l] of vals) { while (rem >= v) { result += l; rem -= v; } }
  return result.length > 1 ? result.slice(0,-1) + '"' + result.slice(-1) : result + "׳";
}

function getWeekMonthLabel(days: Date[]): { gregorian: string; hebrew: string } {
  const first = days[0], last = days[6];
  const fmt = (d: Date) => new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric" }).format(d);
  const fmtMonth = (d: Date) => new Intl.DateTimeFormat("he-IL", { month: "long" }).format(d);

  const gregorian = first.getMonth() !== last.getMonth()
    ? `${fmtMonth(first)} / ${fmt(last)}`
    : fmt(first);

  try {
    const hdFirst = new HDate(first);
    const hdLast = new HDate(last);
    const m1 = HEB_MONTHS[hdFirst.getMonth()] ?? "";
    const m2 = HEB_MONTHS[hdLast.getMonth()] ?? "";
    const year = toHebrewYear(hdLast.getFullYear());
    const hebrew = hdFirst.getMonth() !== hdLast.getMonth()
      ? `${m1} / ${m2} ${year}`
      : `${m1} ${year}`;
    return { gregorian, hebrew };
  } catch {
    return { gregorian, hebrew: "" };
  }
}

// ── Layout constants ─────────────────────────────────────────────────────────
const UNIT_COL = 78; // px, sticky right column

// ── Main page ────────────────────────────────────────────────────────────────
export default function AvailabilityPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [venueName, setVenueName] = useState("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: venue } = await supabase.from("venues").select("id, name").eq("owner_id", user.id).single();
      if (!venue) return;
      setVenueName(venue.name);

      const [{ data: unitsData }, { data: bookingsData }] = await Promise.all([
        supabase.from("units")
          .select("id, name, beds_count, max_mattresses")
          .eq("venue_id", venue.id)
          .eq("is_whole_venue", false)
          .order("sort_order"),
        supabase.from("bookings")
          .select("id, guest_name, check_in, check_out, booking_status, booking_units(unit_id)")
          .eq("venue_id", venue.id)
          .neq("booking_status", "cancelled"),
      ]);

      setUnits((unitsData ?? []) as Unit[]);

      const flat: Booking[] = [];
      for (const b of (bookingsData ?? []) as Array<{
        id: string; guest_name: string; check_in: string; check_out: string;
        booking_status: string; booking_units: { unit_id: string }[];
      }>) {
        for (const bu of b.booking_units) {
          flat.push({
            id: b.id,
            unit_id: bu.unit_id,
            guest_name: b.guest_name,
            check_in: b.check_in,
            check_out: b.check_out,
            booking_status: b.booking_status as BookingStatus,
          });
        }
      }
      setBookings(flat);
      setLoading(false);
    })();
  }, []);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayStr = toDateStr(today);

  const weekStart = useMemo(
    () => addDays(getWeekStart(today), weekOffset * 7),
    [weekOffset, today]
  );

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const { events: calEvents, parasha } = useMemo(() => getWeekData(weekStart), [weekStart]);
  const weekMonthLabel = useMemo(() => getWeekMonthLabel(days), [days]);

  return (
    <main className="flex flex-col flex-1">

      {/* ── Logo ── */}
      <div className="flex flex-col items-center pt-14 pb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-wide1.neto.svg" alt="Good Night" className="h-[90px] md:h-[120px] w-auto" />
      </div>

      {/* ── Week navigation ── */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ direction: "rtl", borderBottom: "1px solid var(--card-border)" }}
      >
        <h1 className="text-xl font-bold flex-1">
          <span style={{ color: "var(--amber)" }}>יומן תפוסה</span>
          {venueName && (
            <>
              <span style={{ color: "var(--muted)", fontWeight: 400 }}> ← </span>
              <span>{venueName}</span>
            </>
          )}
        </h1>

        <button
          aria-label="שבוע קודם"
          onClick={() => setWeekOffset((v) => v - 1)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
          style={{ background: "var(--card-border)", color: "var(--foreground)" }}
        >
          ‹
        </button>

        <div className="text-center" style={{ direction: "rtl" }}>
          <div className="text-sm font-semibold" style={{ color: "var(--foreground)", lineHeight: 1.3 }}>
            {weekMonthLabel.gregorian}
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--muted)", lineHeight: 1.3 }}>
            {weekMonthLabel.hebrew}
          </div>
        </div>

        <button
          aria-label="שבוע הבא"
          onClick={() => setWeekOffset((v) => v + 1)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
          style={{ background: "var(--card-border)", color: "var(--foreground)" }}
        >
          ›
        </button>

        {weekOffset !== 0 && (
          <button
            onClick={() => setWeekOffset(0)}
            className="text-xs px-2.5 py-1 rounded-lg font-medium"
            style={{ background: "rgba(229,175,92,0.15)", color: "var(--amber)" }}
          >
            היום
          </button>
        )}
      </div>

      {/* ── Calendar grid ── */}
      <div className="scrollbar-hide flex-1 overflow-x-auto" style={{ direction: "rtl" }}>
        <div style={{ width: "100%" }}>

          {/* Parasha banner — full row, anchored to Saturday side */}
          {parasha && (
            <div
              className="py-1 px-2"
              style={{ borderBottom: "1px solid rgba(229,175,92,0.15)", textAlign: "left" }}
            >
              <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--amber-light)", letterSpacing: "0.02em" }}>
                {parasha.replace(/[֑-ׇ]/g, "")}
              </span>
            </div>
          )}

          {/* Column headers */}
          <div
            className="flex"
            style={{ borderBottom: "2px solid var(--card-border)", position: "sticky", top: 0, zIndex: 10, background: "var(--background)" }}
          >
            {/* Unit col header */}
            <div
              style={{
                width: UNIT_COL, flexShrink: 0,
                position: "sticky", right: 0, zIndex: 11,
                background: "var(--background)",
                borderLeft: "1px solid var(--card-border)",
              }}
            />
            {/* Day headers */}
            {days.map((day, i) => {
              const dateStr = toDateStr(day);
              const isToday = dateStr === todayStr;
              const isSat = i === 6;

              return (
                <div
                  key={dateStr}
                  className="flex-1 py-1 text-center"
                  style={{
                    minWidth: 0,
                    overflow: "hidden",
                    borderRight: i > 0 ? "1px solid var(--card-border)" : undefined,
                    background: isSat
                      ? "rgba(229,175,92,0.07)"
                      : isToday
                        ? "rgba(229,175,92,0.04)"
                        : undefined,
                  }}
                >
                  <div style={{ fontSize: "0.65rem", fontWeight: 600, color: isSat ? "var(--amber)" : "var(--muted)", lineHeight: 1.2 }}>
                    {DAY_NAMES[i]}
                  </div>
                  <div className="flex justify-center">
                    <span
                      className="font-bold flex items-center justify-center"
                      style={{
                        fontSize: "0.8rem",
                        width: 22, height: 22, borderRadius: "50%",
                        background: isToday ? "var(--amber)" : "transparent",
                        color: isToday ? "#1a1000" : "var(--foreground)",
                        lineHeight: 1,
                      }}
                    >
                      {day.getDate()}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.6rem", lineHeight: 1.2, color: isSat ? "var(--amber-light)" : "var(--muted)", overflow: "hidden" }}>
                    {hebrewShort(day)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Events sub-row */}
          <div
            className="flex"
            style={{ borderBottom: "2px solid var(--card-border)", background: "var(--background)" }}
          >
            <div style={{ width: UNIT_COL, flexShrink: 0, position: "sticky", right: 0, zIndex: 2, background: "var(--background)" }} />
            {days.map((day, i) => {
              const dateStr = toDateStr(day);
              const isSat = i === 6;
              const events = calEvents[dateStr] ?? [];
              const holiday = events.length > 0 ? abbreviateHoliday(events[0]) : null;

              return (
                <div
                  key={dateStr}
                  className="flex-1 flex items-center justify-center"
                  style={{
                    minWidth: 0,
                    height: 20,
                    borderRight: i > 0 ? "1px solid var(--card-border)" : undefined,
                    background: isSat ? "rgba(229,175,92,0.07)" : undefined,
                    overflow: "hidden",
                  }}
                >
                  {holiday && (
                    <span
                      style={{
                        fontSize: "0.58rem",
                        lineHeight: 1,
                        color: "#fbbf24",
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                      title={events.join(", ")}
                    >
                      {holiday}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Unit rows */}
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)", fontSize: "0.85rem" }}>
              טוען...
            </div>
          ) : units.map((unit) => {
            const unitBookings = bookings.filter((b) => b.unit_id === unit.id);

            return (
              <div
                key={unit.id}
                className="flex"
                style={{ borderBottom: "1px solid var(--card-border)", height: 68, overflow: "hidden" }}
              >
                {/* Unit header — sticky */}
                <div
                  className="flex flex-col items-center justify-center p-1 text-center"
                  style={{
                    width: UNIT_COL, flexShrink: 0,
                    position: "sticky", right: 0, zIndex: 2,
                    background: "var(--background)",
                    borderLeft: "1px solid var(--card-border)",
                  }}
                >
                  <span
                    className="font-semibold leading-tight"
                    style={{
                      color: "var(--foreground)",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      fontSize: unit.name.length > 10 ? "0.65rem" : unit.name.length > 7 ? "0.75rem" : "0.875rem",
                    }}
                  >
                    {unit.name}
                  </span>
                  <span className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                    {unit.beds_count} מיטות
                    <br />
                    {unit.max_mattresses} מזרונים
                  </span>
                </div>

                {/* Day cells area */}
                <div className="flex-1 relative" style={{ minHeight: 68 }}>

                  {/* Background cells (clickable) */}
                  <div className="flex h-full absolute inset-0">
                    {days.map((day, i) => {
                      const dateStr = toDateStr(day);
                      const isSat = i === 6;
                      const isToday = dateStr === todayStr;

                      // Find if a booking covers this day (including checkout day)
                      const coveringBooking = unitBookings.find((b) => {
                        const ci = parseDate(b.check_in);
                        const co = parseDate(b.check_out);
                        return ci <= day && day <= co;
                      });

                      return (
                        <div
                          key={dateStr}
                          className="flex-1 cursor-pointer transition-colors"
                          style={{
                                    borderRight: i > 0 ? "1px solid var(--card-border)" : undefined,
                            background: isSat
                              ? "rgba(229,175,92,0.04)"
                              : isToday
                                ? "rgba(229,175,92,0.03)"
                                : "transparent",
                          }}
                          onClick={() => {
                            if (coveringBooking) {
                              setModal({ type: "booking", unit, booking: coveringBooking });
                            } else {
                              setModal({ type: "empty", unit, date: dateStr });
                            }
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Booking blocks */}
                  {unitBookings.map((booking) => {
                    const ci = parseDate(booking.check_in);
                    const co = parseDate(booking.check_out);
                    const visStart = days[0];
                    const visEnd = addDays(days[6], 1); // exclusive

                    // block includes checkout day
                    const coIncl = addDays(co, 1);
                    if (ci >= visEnd || coIncl <= visStart) return null;

                    const blockStart = ci < visStart ? visStart : ci;
                    const blockEnd = coIncl > visEnd ? visEnd : coIncl;
                    const startIdx = Math.round(
                      (blockStart.getTime() - visStart.getTime()) / 86400000
                    );
                    const spanDays = Math.round(
                      (blockEnd.getTime() - blockStart.getTime()) / 86400000
                    );
                    if (spanDays <= 0) return null;

                    const leftPct = (startIdx / 7) * 100;
                    const widthPct = (spanDays / 7) * 100;
                    const isPending = booking.booking_status === "pending";
                    const checkoutInView = days.some((d) => toDateStr(d) === toDateStr(co));

                    return (
                      <div
                        key={booking.id}
                        className="absolute cursor-pointer select-none"
                        style={{
                          top: "50%",
                          transform: "translateY(-50%)",
                          right: `calc(${leftPct}% + 3px)`,
                          width: `calc(${widthPct}% - 6px)`,
                          height: 38,
                          zIndex: 3,
                          background: isPending
                            ? "rgba(148,163,184,0.12)"
                            : "rgba(229,175,92,0.18)",
                          border: isPending
                            ? "1.5px solid rgba(148,163,184,0.75)"
                            : "1.5px solid rgba(229,175,92,0.7)",
                          borderRadius: 10,
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          direction: "rtl",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setModal({ type: "booking", unit, booking });
                        }}
                      >
                        <span
                          className="flex items-center justify-center gap-1 truncate"
                          style={{ flex: 1, paddingInline: 4 }}
                        >
                          {isPending && <ClockIcon />}
                          <span
                            className="text-xs font-medium truncate"
                            style={{ color: isPending ? "rgba(148,163,184,0.95)" : "var(--amber)" }}
                          >
                            {booking.guest_name}
                          </span>
                        </span>
                        {checkoutInView && (
                          <span style={{ flexShrink: 0, paddingLeft: 4 }}>
                            <CheckoutIcon />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Modal ── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={() => setModal(null)}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl px-6 pt-5 pb-8"
            style={{
              background: "linear-gradient(160deg, #232b36 0%, #1c2330 100%)",
              border: "1px solid var(--card-border)",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              direction: "rtl",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "var(--card-border)" }} />

            {modal.type === "booking" ? (
              <>
                <p className="text-xs mb-1 font-medium" style={{ color: "var(--muted)" }}>
                  {modal.unit.name}
                </p>
                <h2 className="text-xl font-bold mb-1" style={{ color: "var(--foreground)" }}>
                  {modal.booking.guest_name}
                </h2>
                <p className="text-sm mb-1" style={{ color: "var(--muted)" }}>
                  כניסה: {modal.booking.check_in} &nbsp;·&nbsp; יציאה: {modal.booking.check_out}
                </p>
                <p className="text-sm mb-5" style={{ color: modal.booking.booking_status === "pending" ? "#fb923c" : "#4ade80" }}>
                  {modal.booking.booking_status === "pending" ? "ממתינה לאישור" : "מאושרת"}
                </p>
                <Link
                  href={`/bookings/${modal.booking.id}`}
                  className="block w-full py-3.5 rounded-2xl text-center font-bold text-base"
                  style={{ background: "var(--amber)", color: "#1a1000" }}
                  onClick={() => setModal(null)}
                >
                  פרטי ההזמנה
                </Link>
              </>
            ) : (
              <>
                <p className="text-xs mb-1 font-medium" style={{ color: "var(--muted)" }}>
                  {modal.unit.name} &nbsp;·&nbsp; {modal.date}
                </p>
                <h2 className="text-lg font-bold mb-5" style={{ color: "var(--foreground)" }}>
                  מה תרצי לעשות?
                </h2>
                <div className="flex flex-col gap-3">
                  <Link
                    href={`/bookings/new?unit=${modal.unit.id}&date=${modal.date}`}
                    className="block w-full py-3.5 rounded-2xl text-center font-bold"
                    style={{ background: "var(--amber)", color: "#1a1000" }}
                    onClick={() => setModal(null)}
                  >
                    הזמנה חדשה
                  </Link>
                  <button
                    className="w-full py-3.5 rounded-2xl font-semibold"
                    style={{ background: "rgba(255,255,255,0.05)", color: "var(--foreground)", border: "1px solid var(--card-border)" }}
                    onClick={() => setModal(null)}
                  >
                    חסום תאריך זה
                  </button>
                </div>
              </>
            )}

            <button
              className="mt-4 w-full py-2 text-sm"
              style={{ color: "var(--muted)" }}
              onClick={() => setModal(null)}
            >
              ביטול
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function CheckoutIcon(_props: { color?: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 30 30" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style={{ color: "#ef4444" }}>
      <defs>
        <clipPath id="av-ci-door"><path d="M 2.964844 5.417969 L 13.855469 5.417969 L 13.855469 23.5625 L 2.964844 23.5625 Z" clipRule="nonzero"/></clipPath>
        <clipPath id="av-ci-arrow"><path d="M 16.136719 10.695312 L 27.023438 10.695312 L 27.023438 18.675781 L 16.136719 18.675781 Z" clipRule="nonzero"/></clipPath>
      </defs>
      <g clipPath="url(#av-ci-door)">
        <path fill="currentColor" fillRule="nonzero" d="M 9.949219 5.417969 C 9.929688 5.417969 9.910156 5.421875 9.894531 5.425781 L 3.296875 6.605469 C 3.082031 6.644531 2.972656 6.773438 2.972656 6.996094 L 2.972656 21.984375 C 2.972656 22.203125 3.082031 22.332031 3.296875 22.371094 L 9.894531 23.554688 C 10.011719 23.578125 10.117188 23.546875 10.210938 23.46875 C 10.300781 23.390625 10.347656 23.289062 10.347656 23.167969 L 10.347656 5.8125 C 10.347656 5.699219 10.308594 5.605469 10.230469 5.527344 C 10.152344 5.453125 10.058594 5.414062 9.949219 5.417969 Z M 9.574219 6.28125 L 9.574219 22.699219 L 3.75 21.652344 L 3.75 7.328125 Z M 11.511719 6.601562 C 11.40625 6.597656 11.3125 6.636719 11.234375 6.714844 C 11.160156 6.792969 11.121094 6.886719 11.121094 6.996094 C 11.121094 7.105469 11.160156 7.199219 11.234375 7.277344 C 11.3125 7.355469 11.40625 7.390625 11.511719 7.390625 L 13.066406 7.390625 L 13.066406 21.589844 L 11.511719 21.589844 C 11.40625 21.589844 11.3125 21.625 11.234375 21.703125 C 11.160156 21.78125 11.121094 21.875 11.121094 21.984375 C 11.121094 22.09375 11.160156 22.1875 11.234375 22.265625 C 11.3125 22.34375 11.40625 22.378906 11.511719 22.378906 L 13.453125 22.378906 C 13.5625 22.378906 13.652344 22.339844 13.730469 22.261719 C 13.804688 22.1875 13.84375 22.09375 13.84375 21.984375 L 13.84375 6.996094 C 13.84375 6.886719 13.804688 6.792969 13.730469 6.714844 C 13.652344 6.640625 13.5625 6.601562 13.453125 6.601562 Z M 8.214844 14.09375 C 8.054688 14.09375 7.917969 14.152344 7.800781 14.269531 C 7.6875 14.382812 7.632812 14.523438 7.632812 14.6875 C 7.632812 14.851562 7.6875 14.988281 7.800781 15.105469 C 7.917969 15.222656 8.054688 15.277344 8.214844 15.277344 C 8.375 15.277344 8.511719 15.222656 8.625 15.105469 C 8.738281 14.988281 8.796875 14.851562 8.796875 14.6875 C 8.796875 14.523438 8.738281 14.382812 8.625 14.269531 C 8.511719 14.152344 8.375 14.09375 8.214844 14.09375 Z" />
      </g>
      <g clipPath="url(#av-ci-arrow)">
        <path fill="currentColor" fillRule="nonzero" d="M 22.863281 18.675781 C 22.964844 18.675781 23.050781 18.636719 23.121094 18.566406 L 26.890625 14.941406 C 26.964844 14.871094 27.003906 14.785156 27.003906 14.6875 C 27.003906 14.585938 26.964844 14.5 26.890625 14.429688 L 23.121094 10.804688 C 23.046875 10.730469 22.960938 10.695312 22.855469 10.691406 C 22.75 10.691406 22.65625 10.726562 22.582031 10.800781 C 22.507812 10.871094 22.472656 10.957031 22.472656 11.058594 C 22.472656 11.160156 22.511719 11.246094 22.589844 11.316406 L 25.714844 14.324219 L 9.28125 14.324219 C 9.175781 14.320312 9.085938 14.355469 9.011719 14.429688 C 8.9375 14.5 8.898438 14.585938 8.898438 14.6875 C 8.898438 14.789062 8.9375 14.875 9.011719 14.945312 C 9.085938 15.015625 9.175781 15.050781 9.28125 15.046875 L 25.714844 15.046875 L 22.589844 18.054688 C 22.464844 18.171875 22.4375 18.304688 22.503906 18.457031 C 22.570312 18.609375 22.691406 18.679688 22.863281 18.675781 Z" />
      </g>
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(148,163,184,0.95)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3h14M5 21h14M7 3v4l5 5-5 5v4M17 3v4l-5 5 5 5v4" />
    </svg>
  );
}
