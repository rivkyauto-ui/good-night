import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

function formatHebrewDate(date: Date) {
  return new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: venue }] = await Promise.all([
    supabase.from("users").select("full_name, role").eq("id", user.id).single(),
    supabase.from("venues").select("id, name").eq("owner_id", user.id).single(),
  ]);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  let currentGuests = 0, checkInsToday = 0, checkOutsToday = 0;
  let pendingApproval = 0, pendingPayment = 0, pendingRefund = 0;
  let totalUnits = 0, occupiedUnits = 0;

  if (venue) {
    const { data: units } = await supabase
      .from("units")
      .select("id")
      .eq("venue_id", venue.id)
      .eq("is_whole_venue", false);

    const unitIds = units?.map((u) => u.id) ?? [];
    totalUnits = unitIds.length;

    const [guests, checkIns, checkOuts, pending, payment, refund, occupied] =
      await Promise.all([
        supabase.from("bookings").select("*", { count: "exact", head: true })
          .eq("venue_id", venue.id).eq("booking_status", "approved")
          .lte("check_in", todayStr).gte("check_out", todayStr),
        supabase.from("bookings").select("*", { count: "exact", head: true })
          .eq("venue_id", venue.id).eq("booking_status", "approved").eq("check_in", todayStr),
        supabase.from("bookings").select("*", { count: "exact", head: true })
          .eq("venue_id", venue.id).eq("booking_status", "approved").eq("check_out", todayStr),
        supabase.from("bookings").select("*", { count: "exact", head: true })
          .eq("venue_id", venue.id).eq("booking_status", "pending"),
        supabase.from("bookings").select("*", { count: "exact", head: true })
          .eq("venue_id", venue.id).eq("booking_status", "approved")
          .lte("check_in", todayStr).gt("balance_due", 0),
        supabase.from("bookings").select("*", { count: "exact", head: true })
          .eq("venue_id", venue.id).eq("payment_status", "refund_pending"),
        unitIds.length > 0
          ? supabase.from("occupancy").select("*", { count: "exact", head: true })
              .eq("date", todayStr).eq("status", "booked").in("unit_id", unitIds)
          : Promise.resolve({ count: 0, data: null, error: null }),
      ]);

    currentGuests  = guests.count  ?? 0;
    checkInsToday  = checkIns.count ?? 0;
    checkOutsToday = checkOuts.count ?? 0;
    pendingApproval = pending.count ?? 0;
    pendingPayment  = payment.count ?? 0;
    pendingRefund   = refund.count  ?? 0;
    occupiedUnits   = occupied.count ?? 0;
  }

  const totalAttention = pendingApproval + pendingPayment + pendingRefund;
  const occupancyPercent = totalUnits > 0
    ? Math.round((occupiedUnits / totalUnits) * 100)
    : 0;

  return (
    <main className="min-h-dvh px-4 pt-6 pb-4 flex flex-col gap-4">

      {/* Header */}
      <header className="flex flex-col items-center text-center pb-2">
        <div className="w-full flex items-center mb-1" dir="ltr">
          <LogoutButton />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-wide1.neto.svg"
          alt="Good Night"
          className="h-[90px] md:h-[120px] w-auto"
        />
        <h1 className="text-2xl font-bold mt-3" style={{ color: "var(--foreground)" }}>
          {venue?.name ?? "המתחם שלי"}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
          שלום, {firstName || "אורח"} 👋 &nbsp;·&nbsp; {formatHebrewDate(today)}
        </p>
        {profile?.role === "admin" && (
          <Link
            href="/admin"
            className="mt-2 text-xs px-3 py-1 rounded-full font-medium"
            style={{ background: "rgba(229,175,92,0.12)", color: "var(--amber)", border: "1px solid rgba(229,175,92,0.3)" }}
          >
            ניהול מערכת →
          </Link>
        )}
      </header>

      {/* הזמנה חדשה */}
      <Link
        href="/bookings/new"
        className="w-full md:w-72 md:mr-auto py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-opacity active:opacity-80"
        style={{ background: "var(--amber)", color: "#1a1000" }}
      >
        הזמנה חדשה
        <span className="text-xl leading-none">+</span>
      </Link>

      {/* שוהים / כניסות / יציאות — mobile: שוהים full, 2-col מתחת | desktop: 3-col */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          className="col-span-2 md:col-span-1"
          label="שוהים עכשיו"
          count={currentGuests}
          empty="אין שוהים כרגע"
          icon={<GuestsIcon />}
          href="/bookings?filter=current"
        />
        <StatCard
          label="כניסות היום"
          count={checkInsToday}
          empty="אין כניסות"
          icon={<CheckInIcon />}
          href="/bookings?filter=checkin"
        />
        <StatCard
          label="יציאות היום"
          count={checkOutsToday}
          empty="אין יציאות"
          icon={<CheckOutIcon />}
          href="/bookings?filter=checkout"
        />
      </div>

      {/* דורש טיפול / תפוסה — mobile: stacked | desktop: 2-col */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

        {/* דורש טיפול */}
        <section
          className="rounded-2xl px-4 py-4"
          style={{ background: "linear-gradient(160deg, #232b36 0%, #1c2330 100%)", border: "1px solid var(--card-border)", borderTop: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 4px 20px rgba(0,0,0,0.45)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>דורש טיפול</h2>
            <AlertIcon />
          </div>
          {totalAttention === 0 ? (
            <div className="flex items-center gap-2">
              <CheckCircleIcon />
              <p className="text-sm" style={{ color: "var(--muted)" }}>הכל תקין</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {pendingApproval > 0 && (
                <AttentionRow label="ממתינות לאישור" count={pendingApproval} href="/bookings?filter=pending" />
              )}
              {pendingPayment > 0 && (
                <AttentionRow label="ממתינות לגביה" count={pendingPayment} href="/bookings?filter=payment" />
              )}
              {pendingRefund > 0 && (
                <AttentionRow label="ממתינות להחזר" count={pendingRefund} href="/bookings?filter=refund" />
              )}
            </div>
          )}
        </section>

        {/* תפוסה היום */}
        <Link
          href="/availability"
          className="rounded-2xl px-4 py-4 block active:opacity-75 transition-opacity"
          style={{ background: "linear-gradient(160deg, #232b36 0%, #1c2330 100%)", border: "1px solid var(--card-border)", borderTop: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 4px 20px rgba(0,0,0,0.45)", color: "var(--foreground)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>תפוסה היום</h2>
            <span className="text-xl font-bold" style={{ color: occupancyPercent > 0 ? "var(--amber)" : "var(--muted)" }}>
              {occupancyPercent}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--card-border)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${occupancyPercent}%`, background: "var(--amber)" }}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
            {totalUnits === 0
              ? "לא הוגדרו יחידות"
              : `${occupiedUnits} מתוך ${totalUnits} יחידות תפוסות`}
          </p>
        </Link>

      </div>

      {/* פנייה לתמיכה */}
      <Link
        href="/support/new"
        className="text-sm text-center py-2"
        style={{ color: "var(--muted)" }}
      >
        פנייה לתמיכה →
      </Link>

    </main>
  );
}

function StatCard({
  label, count, empty, icon, className = "", href,
}: {
  label: string; count: number; empty: string; icon: React.ReactNode; className?: string; href?: string;
}) {
  const sharedClass = `rounded-2xl px-4 py-4 ${className}`;
  const sharedStyle = {
    background: "linear-gradient(160deg, #232b36 0%, #1c2330 100%)",
    border: "1px solid var(--card-border)",
    borderTop: "1px solid rgba(255,255,255,0.07)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.45)",
  };
  const inner = (
    <>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{label}</h2>
        {icon}
      </div>
      <p className="text-3xl font-bold" style={{ color: count > 0 ? "var(--amber)" : "var(--muted)" }}>
        {count}
      </p>
      {count === 0 && (
        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{empty}</p>
      )}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={`${sharedClass} block active:opacity-75 transition-opacity`} style={{ ...sharedStyle, color: "var(--foreground)" }}>
        {inner}
      </Link>
    );
  }
  return (
    <section className={sharedClass} style={sharedStyle}>
      {inner}
    </section>
  );
}

function AttentionRow({ label, count, href }: { label: string; count: number; href: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-between py-2.5 px-3 rounded-xl"
      style={{ background: "rgba(229,175,92,0.12)", color: "inherit" }}
    >
      <span className="text-sm" style={{ color: "var(--foreground)" }}>{label}</span>
      <span className="text-sm font-bold" style={{ color: "var(--amber)" }}>{count}</span>
    </a>
  );
}

function GuestsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#60a5fa" }}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function CheckInIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 30 30" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style={{ color: "#4ade80" }}>
      <defs>
        <clipPath id="co-door"><path d="M 0.964844 0.417969 L 12.339844 0.417969 L 12.339844 18.613281 L 0.964844 18.613281 Z" clipRule="nonzero"/></clipPath>
        <clipPath id="co-arrow"><path d="M 14.160156 5.351562 L 25.535156 5.351562 L 25.535156 13.316406 L 14.160156 13.316406 Z" clipRule="nonzero"/></clipPath>
        <clipPath id="co-outer"><rect x="0" width="26" y="0" height="19"/></clipPath>
      </defs>
      <g transform="matrix(1, 0, 0, 1, 2, 5)">
        <g clipPath="url(#co-outer)">
          <g clipPath="url(#co-door)">
            <path fill="currentColor" fillRule="nonzero" d="M 8.261719 0.417969 C 8.242188 0.417969 8.222656 0.421875 8.203125 0.425781 L 1.304688 1.609375 C 1.082031 1.648438 0.972656 1.777344 0.972656 2 L 0.972656 17.03125 C 0.972656 17.253906 1.082031 17.382812 1.304688 17.421875 L 8.203125 18.609375 C 8.328125 18.628906 8.4375 18.601562 8.535156 18.523438 C 8.632812 18.441406 8.679688 18.34375 8.679688 18.21875 L 8.679688 0.8125 C 8.679688 0.703125 8.640625 0.605469 8.558594 0.53125 C 8.476562 0.453125 8.375 0.414062 8.261719 0.417969 Z M 7.867188 1.285156 L 7.867188 17.746094 L 1.78125 16.699219 L 1.78125 2.332031 Z M 9.898438 1.605469 C 9.785156 1.601562 9.6875 1.640625 9.605469 1.71875 C 9.527344 1.796875 9.484375 1.890625 9.484375 2 C 9.484375 2.109375 9.527344 2.203125 9.605469 2.28125 C 9.6875 2.359375 9.785156 2.398438 9.898438 2.394531 L 11.519531 2.394531 L 11.519531 16.636719 L 9.898438 16.636719 C 9.785156 16.636719 9.6875 16.671875 9.605469 16.75 C 9.527344 16.828125 9.484375 16.921875 9.484375 17.03125 C 9.484375 17.140625 9.527344 17.238281 9.605469 17.3125 C 9.6875 17.390625 9.785156 17.429688 9.898438 17.425781 L 11.925781 17.425781 C 12.039062 17.425781 12.132812 17.390625 12.210938 17.3125 C 12.292969 17.234375 12.332031 17.140625 12.332031 17.03125 L 12.332031 2 C 12.332031 1.890625 12.292969 1.796875 12.210938 1.71875 C 12.132812 1.644531 12.039062 1.605469 11.925781 1.605469 Z M 6.449219 9.121094 C 6.28125 9.121094 6.136719 9.179688 6.019531 9.292969 C 5.898438 9.410156 5.839844 9.550781 5.839844 9.714844 C 5.839844 9.878906 5.898438 10.019531 6.019531 10.132812 C 6.136719 10.25 6.28125 10.308594 6.449219 10.308594 C 6.617188 10.308594 6.761719 10.25 6.878906 10.132812 C 6.996094 10.019531 7.058594 9.878906 7.058594 9.714844 C 7.058594 9.550781 6.996094 9.410156 6.878906 9.292969 C 6.761719 9.179688 6.617188 9.121094 6.449219 9.121094 Z" />
          </g>
          <g clipPath="url(#co-arrow)">
            <path fill="currentColor" fillRule="nonzero" d="M 18.339844 5.355469 C 18.238281 5.355469 18.152344 5.394531 18.082031 5.460938 L 14.304688 9.078125 C 14.230469 9.148438 14.195312 9.234375 14.195312 9.332031 C 14.195312 9.433594 14.230469 9.519531 14.304688 9.589844 L 18.082031 13.203125 C 18.152344 13.277344 18.242188 13.316406 18.347656 13.316406 C 18.453125 13.316406 18.546875 13.28125 18.621094 13.210938 C 18.695312 13.136719 18.730469 13.050781 18.730469 12.949219 C 18.730469 12.847656 18.691406 12.761719 18.613281 12.691406 L 15.484375 9.695312 L 31.945312 9.695312 C 32.050781 9.695312 32.140625 9.660156 32.214844 9.589844 C 32.289062 9.519531 32.328125 9.433594 32.328125 9.332031 C 32.328125 9.234375 32.289062 9.148438 32.214844 9.074219 C 32.140625 9.003906 32.050781 8.96875 31.945312 8.972656 L 15.484375 8.972656 L 18.613281 5.972656 C 18.738281 5.859375 18.765625 5.726562 18.699219 5.574219 C 18.632812 5.421875 18.511719 5.347656 18.339844 5.355469 Z" />
          </g>
        </g>
      </g>
    </svg>
  );
}

function CheckOutIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 30 30" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style={{ color: "#ef4444" }}>
      <defs>
        <clipPath id="ci-door"><path d="M 2.964844 5.417969 L 13.855469 5.417969 L 13.855469 23.5625 L 2.964844 23.5625 Z" clipRule="nonzero"/></clipPath>
        <clipPath id="ci-arrow"><path d="M 16.136719 10.695312 L 27.023438 10.695312 L 27.023438 18.675781 L 16.136719 18.675781 Z" clipRule="nonzero"/></clipPath>
      </defs>
      <g clipPath="url(#ci-door)">
        <path fill="currentColor" fillRule="nonzero" d="M 9.949219 5.417969 C 9.929688 5.417969 9.910156 5.421875 9.894531 5.425781 L 3.296875 6.605469 C 3.082031 6.644531 2.972656 6.773438 2.972656 6.996094 L 2.972656 21.984375 C 2.972656 22.203125 3.082031 22.332031 3.296875 22.371094 L 9.894531 23.554688 C 10.011719 23.578125 10.117188 23.546875 10.210938 23.46875 C 10.300781 23.390625 10.347656 23.289062 10.347656 23.167969 L 10.347656 5.8125 C 10.347656 5.699219 10.308594 5.605469 10.230469 5.527344 C 10.152344 5.453125 10.058594 5.414062 9.949219 5.417969 Z M 9.574219 6.28125 L 9.574219 22.699219 L 3.75 21.652344 L 3.75 7.328125 Z M 11.511719 6.601562 C 11.40625 6.597656 11.3125 6.636719 11.234375 6.714844 C 11.160156 6.792969 11.121094 6.886719 11.121094 6.996094 C 11.121094 7.105469 11.160156 7.199219 11.234375 7.277344 C 11.3125 7.355469 11.40625 7.390625 11.511719 7.390625 L 13.066406 7.390625 L 13.066406 21.589844 L 11.511719 21.589844 C 11.40625 21.589844 11.3125 21.625 11.234375 21.703125 C 11.160156 21.78125 11.121094 21.875 11.121094 21.984375 C 11.121094 22.09375 11.160156 22.1875 11.234375 22.265625 C 11.3125 22.34375 11.40625 22.378906 11.511719 22.378906 L 13.453125 22.378906 C 13.5625 22.378906 13.652344 22.339844 13.730469 22.261719 C 13.804688 22.1875 13.84375 22.09375 13.84375 21.984375 L 13.84375 6.996094 C 13.84375 6.886719 13.804688 6.792969 13.730469 6.714844 C 13.652344 6.640625 13.5625 6.601562 13.453125 6.601562 Z M 8.214844 14.09375 C 8.054688 14.09375 7.917969 14.152344 7.800781 14.269531 C 7.6875 14.382812 7.632812 14.523438 7.632812 14.6875 C 7.632812 14.851562 7.6875 14.988281 7.800781 15.105469 C 7.917969 15.222656 8.054688 15.277344 8.214844 15.277344 C 8.375 15.277344 8.511719 15.222656 8.625 15.105469 C 8.738281 14.988281 8.796875 14.851562 8.796875 14.6875 C 8.796875 14.523438 8.738281 14.382812 8.625 14.269531 C 8.511719 14.152344 8.375 14.09375 8.214844 14.09375 Z" />
      </g>
      <g clipPath="url(#ci-arrow)">
        <path fill="currentColor" fillRule="nonzero" d="M 22.863281 18.675781 C 22.964844 18.675781 23.050781 18.636719 23.121094 18.566406 L 26.890625 14.941406 C 26.964844 14.871094 27.003906 14.785156 27.003906 14.6875 C 27.003906 14.585938 26.964844 14.5 26.890625 14.429688 L 23.121094 10.804688 C 23.046875 10.730469 22.960938 10.695312 22.855469 10.691406 C 22.75 10.691406 22.65625 10.726562 22.582031 10.800781 C 22.507812 10.871094 22.472656 10.957031 22.472656 11.058594 C 22.472656 11.160156 22.511719 11.246094 22.589844 11.316406 L 25.714844 14.324219 L 9.28125 14.324219 C 9.175781 14.320312 9.085938 14.355469 9.011719 14.429688 C 8.9375 14.5 8.898438 14.585938 8.898438 14.6875 C 8.898438 14.789062 8.9375 14.875 9.011719 14.945312 C 9.085938 15.015625 9.175781 15.050781 9.28125 15.046875 L 25.714844 15.046875 L 22.589844 18.054688 C 22.464844 18.171875 22.4375 18.304688 22.503906 18.457031 C 22.570312 18.609375 22.691406 18.679688 22.863281 18.675781 Z" />
      </g>
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#fb923c" }}>
      <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#4ade80" }}>
      <circle cx="12" cy="12" r="10" /><path d="M9 12l2 2 4-4" />
    </svg>
  );
}
