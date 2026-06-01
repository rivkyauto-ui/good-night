import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import BookingsListClient, { type BookingRow } from "./BookingsListClient";

type FilterType = "current" | "checkin" | "checkout" | "pending" | "payment" | "refund" | "";

const FILTER_TABS: { value: FilterType; label: string }[] = [
  { value: "", label: "הכל" },
  { value: "current", label: "שוהים עכשיו" },
  { value: "checkin", label: "כניסות היום" },
  { value: "checkout", label: "יציאות היום" },
  { value: "pending", label: "ממתינות לאישור" },
  { value: "payment", label: "ממתינות לגביה" },
  { value: "refund", label: "להחזר" },
];

const EMPTY_MESSAGES: Record<FilterType, string> = {
  "": "אין הזמנות עדיין",
  current: "אין שוהים עכשיו",
  checkin: "אין כניסות היום",
  checkout: "אין יציאות היום",
  pending: "אין הזמנות ממתינות לאישור",
  payment: "אין הזמנות ממתינות לגביה",
  refund: "אין הזמנות ממתינות להחזר",
};

const VALID_FILTERS: FilterType[] = ["current", "checkin", "checkout", "pending", "payment", "refund", ""];

export default async function BookingsPage(props: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: rawFilter = "" } = await props.searchParams;
  const filter: FilterType = VALID_FILTERS.includes(rawFilter as FilterType)
    ? (rawFilter as FilterType)
    : "";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: venue } = await supabase
    .from("venues")
    .select("id, name")
    .eq("owner_id", user.id)
    .single();

  if (!venue) redirect("/dashboard");

  const today = new Date().toISOString().split("T")[0];

  const SELECT = `
    id, booking_number, guest_name, guest_phone,
    check_in, check_out, nights_count,
    booking_status, payment_status,
    total_amount, amount_paid, balance_due,
    has_conflict,
    booking_units(units(name))
  `;

  const base = () => supabase.from("bookings").select(SELECT).eq("venue_id", venue.id);
  const cnt  = () => supabase.from("bookings").select("*", { count: "exact", head: true }).eq("venue_id", venue.id);

  const [
    { data: bookings },
    { count: cCurrent },
    { count: cCheckin },
    { count: cCheckout },
    { count: cPending },
    { count: cPayment },
    { count: cRefund },
  ] = await Promise.all([
    (() => {
      switch (filter) {
        case "current":
          return base().eq("booking_status", "approved").lte("check_in", today).gte("check_out", today).order("check_in");
        case "checkin":
          return base().eq("booking_status", "approved").eq("check_in", today).order("check_in");
        case "checkout":
          return base().eq("booking_status", "approved").eq("check_out", today).order("check_out");
        case "pending":
          return base().eq("booking_status", "pending").order("created_at");
        case "payment":
          return base().eq("booking_status", "approved").gt("balance_due", 0).gte("check_out", today).order("check_in");
        case "refund":
          return base().eq("payment_status", "refund_pending").order("created_at");
        default:
          return base().order("check_in", { ascending: false }).limit(50);
      }
    })(),
    cnt().eq("booking_status", "approved").lte("check_in", today).gte("check_out", today),
    cnt().eq("booking_status", "approved").eq("check_in", today),
    cnt().eq("booking_status", "approved").eq("check_out", today),
    cnt().eq("booking_status", "pending"),
    cnt().eq("booking_status", "approved").gt("balance_due", 0).gte("check_out", today),
    cnt().eq("payment_status", "refund_pending"),
  ]);

  const counts: Record<FilterType, number> = {
    "": 0,
    current:  cCurrent  ?? 0,
    checkin:  cCheckin  ?? 0,
    checkout: cCheckout ?? 0,
    pending:  cPending  ?? 0,
    payment:  cPayment  ?? 0,
    refund:   cRefund   ?? 0,
  };

  const list = (bookings ?? []) as BookingRow[];

  return (
    <main className="min-h-dvh px-4 pt-6 pb-4 flex flex-col gap-4" dir="rtl">

      {/* Logo */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.25rem" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-wide1.neto.svg" alt="Good Night" className="h-[90px] w-auto" />
      </div>

      {/* כותרת + כפתור */}
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: "1.3rem", fontWeight: 700 }}>
          <span style={{ color: "var(--amber)" }}>הזמנות</span>
          <span style={{ color: "var(--muted)", fontWeight: 400 }}> ← </span>
          <span>{venue.name}</span>
        </h1>
        <Link href="/bookings/new"
          className="text-sm font-bold px-4 py-2 rounded-xl"
          style={{ background: "var(--amber)", color: "#1a1000" }}>
          + חדשה
        </Link>
      </div>

      {/* Filter chips */}
      <div
        className="scrollbar-hide flex gap-2 overflow-x-auto pb-1"
        style={{ marginInline: "-1rem", paddingInline: "1rem" }}
      >
        {FILTER_TABS.map((tab) => {
          const isActive = filter === tab.value;
          const count = counts[tab.value];
          return (
            <Link
              key={tab.value}
              href={tab.value ? `/bookings?filter=${tab.value}` : "/bookings"}
              className="shrink-0 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5"
              style={{
                background: isActive ? "var(--amber)" : "transparent",
                color: isActive ? "#1a1000" : "var(--muted)",
                border: `1px solid ${isActive ? "var(--amber)" : "var(--card-border)"}`,
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
              {tab.value !== "" && count > 0 && (
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded-full leading-none"
                  style={{
                    background: isActive ? "rgba(0,0,0,0.2)" : "rgba(229,175,92,0.2)",
                    color: isActive ? "#1a1000" : "var(--amber)",
                    minWidth: "1.25rem",
                    textAlign: "center",
                  }}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* רשימה + חיפוש */}
      <BookingsListClient list={list} emptyMessage={EMPTY_MESSAGES[filter]} filter={filter} />

    </main>
  );
}
