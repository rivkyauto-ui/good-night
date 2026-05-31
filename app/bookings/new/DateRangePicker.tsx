"use client";

import { useState, useMemo } from "react";

const DAYS_HE = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
const MONTHS_HE = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

interface Props {
  checkIn: string;
  checkOut: string;
  /** תאריכים חסומים לחלוטין (לפי יחידות שנבחרו) */
  blockedDates: Set<string>;
  /** תאריכים עם תפוסה חלקית (כשאין יחידות נבחרות — אינדיקציה בלבד) */
  busyDates: Set<string>;
  onChange: (checkIn: string, checkOut: string) => void;
}

export default function DateRangePicker({ checkIn, checkOut, blockedDates, busyDates, onChange }: Props) {
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const nowYear = new Date().getFullYear();
  const nowMonth = new Date().getMonth();

  const [year, setYear] = useState(() => checkIn ? Number(checkIn.slice(0, 4)) : nowYear);
  const [month, setMonth] = useState(() => checkIn ? Number(checkIn.slice(5, 7)) - 1 : nowMonth);

  const isSelectingOut = !!checkIn && !checkOut;
  const atMinMonth = year === nowYear && month === nowMonth;

  // התאריך החסום הראשון אחרי check-in — הוא המקסימום לצ'ק-אאוט
  const maxCheckOut = useMemo(() => {
    if (!checkIn || !blockedDates.size) return null;
    const sorted = [...blockedDates].filter(d => d > checkIn).sort();
    return sorted[0] ?? null;
  }, [checkIn, blockedDates]);

  const cells = useMemo(() => {
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const arr: (string | null)[] = Array(firstDow).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [year, month]);

  function prev() {
    if (atMinMonth) return;
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function next() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  function pick(date: string) {
    if (isSelectingOut) {
      if (date <= checkIn) return;
      if (maxCheckOut && date > maxCheckOut) return;
      onChange(checkIn, date);
    } else {
      if (date < today || blockedDates.has(date)) return;
      onChange(date, "");
    }
  }

  function fmt(d: string) {
    return `${Number(d.slice(8))} ב${MONTHS_HE[Number(d.slice(5, 7)) - 1]}`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>

      {/* שבבי כניסה/יציאה */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
        <button type="button" onClick={() => onChange("", "")}
          style={{
            padding: "0.5rem", borderRadius: "0.75rem", cursor: "pointer", textAlign: "center",
            border: `1px solid ${!isSelectingOut ? "var(--amber)" : "var(--card-border)"}`,
            background: !isSelectingOut ? "rgba(229,175,92,0.1)" : "var(--card-bg)",
          }}>
          <div style={{ fontSize: "0.65rem", color: "var(--amber)", marginBottom: "0.15rem" }}>כניסה *</div>
          <div style={{ fontSize: "0.82rem", color: checkIn ? "var(--foreground)" : "var(--muted)", fontWeight: checkIn ? 600 : 400 }}>
            {checkIn ? fmt(checkIn) : "בחר תאריך"}
          </div>
        </button>
        <button type="button" onClick={() => { if (checkIn) onChange(checkIn, ""); }}
          style={{
            padding: "0.5rem", borderRadius: "0.75rem", cursor: checkIn ? "pointer" : "default", textAlign: "center",
            border: `1px solid ${isSelectingOut ? "var(--amber)" : "var(--card-border)"}`,
            background: isSelectingOut ? "rgba(229,175,92,0.1)" : "var(--card-bg)",
          }}>
          <div style={{ fontSize: "0.65rem", color: "var(--amber)", marginBottom: "0.15rem" }}>יציאה *</div>
          <div style={{ fontSize: "0.82rem", color: checkOut ? "var(--foreground)" : "var(--muted)", fontWeight: checkOut ? 600 : 400 }}>
            {checkOut ? fmt(checkOut) : checkIn ? "בחר תאריך" : "—"}
          </div>
        </button>
      </div>

      {/* הנחיה */}
      <p style={{ fontSize: "0.7rem", textAlign: "center", margin: 0, color: isSelectingOut ? "var(--amber)" : "var(--muted)", minHeight: "1em" }}>
        {isSelectingOut ? "כעת בחרי תאריך יציאה" : !checkIn ? "בחרי תאריך כניסה" : ""}
      </p>

      {/* ניווט חודשים */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }} dir="ltr">
        <button type="button" onClick={prev} disabled={atMinMonth}
          style={{ padding: "0.2rem 0.6rem", fontSize: "1.2rem", color: atMinMonth ? "var(--card-border)" : "var(--amber)", cursor: atMinMonth ? "default" : "pointer" }}>
          ‹
        </button>
        <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{MONTHS_HE[month]} {year}</span>
        <button type="button" onClick={next}
          style={{ padding: "0.2rem 0.6rem", fontSize: "1.2rem", color: "var(--amber)" }}>
          ›
        </button>
      </div>

      {/* כותרות ימים */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center" }}>
        {DAYS_HE.map(d => (
          <div key={d} style={{ fontSize: "0.68rem", color: "var(--muted)", paddingBottom: "0.2rem" }}>{d}</div>
        ))}
      </div>

      {/* גריד ימים */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} />;

          const isPast = date < today;
          const isBlocked = blockedDates.has(date);
          const isBusy = !isBlocked && busyDates.has(date);
          const isCI = date === checkIn;
          const isCO = date === checkOut;
          const inRange = !!(checkIn && checkOut && date > checkIn && date < checkOut);
          const isConflictInRange = inRange && isBlocked;
          const isMaxCO = !!(date === maxCheckOut && isSelectingOut);
          const isToday = date === today;

          let disabled: boolean;
          if (isSelectingOut) {
            disabled = date <= checkIn || !!(maxCheckOut && date > maxCheckOut);
          } else {
            disabled = isPast || (isBlocked && !isConflictInRange);
          }

          let bg = "transparent";
          let color = "var(--foreground)";
          let border = "none";

          if (isCI || isCO) {
            bg = "var(--amber)"; color = "#1a1000";
          } else if (isConflictInRange) {
            bg = "rgba(239,68,68,0.25)"; color = "#ef4444";
          } else if (inRange) {
            bg = "rgba(229,175,92,0.18)";
          } else if (isMaxCO) {
            border = "1px solid rgba(229,175,92,0.6)"; color = "var(--amber)";
          } else if (isBlocked && !isPast) {
            bg = "rgba(239,68,68,0.12)"; color = "#ef4444";
          } else if (disabled || isPast) {
            color = "var(--muted)";
          }

          if (isToday && !isCI && !isCO && !inRange) border = "1px solid rgba(229,175,92,0.45)";

          return (
            <button key={date} type="button" disabled={disabled} onClick={() => pick(date)}
              style={{
                padding: "0.42rem 0",
                borderRadius: "0.375rem",
                fontSize: "0.8rem",
                fontWeight: isCI || isCO || isToday ? 700 : 400,
                background: bg,
                color,
                border,
                opacity: isPast ? 0.3 : (disabled && !isConflictInRange) ? 0.4 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
                position: "relative",
                textAlign: "center",
              }}>
              {Number(date.slice(8))}
              {isBusy && (
                <span style={{
                  position: "absolute", bottom: "2px", left: "50%",
                  transform: "translateX(-50%)",
                  width: "3px", height: "3px", borderRadius: "50%",
                  background: "var(--amber)",
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* מקרא */}
      {(blockedDates.size > 0 || busyDates.size > 0) && (
        <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.65rem", color: "var(--muted)", flexWrap: "wrap" }}>
          {blockedDates.size > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "rgba(239,68,68,0.3)", display: "inline-block", flexShrink: 0 }} />
              תפוס
            </span>
          )}
          {busyDates.size > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--amber)", display: "inline-block", flexShrink: 0 }} />
              חלקית תפוס
            </span>
          )}
        </div>
      )}
    </div>
  );
}
