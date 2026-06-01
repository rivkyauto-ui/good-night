import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import BookingDetail, { type Booking } from "./BookingDetail";

function computeTimeStatus(checkIn: string, checkOut: string): string {
  const today = new Date().toISOString().split("T")[0];
  if (checkIn > today) return "future";
  if (checkOut < today) return "completed";
  return "active";
}

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { id } = await params;
  const { returnTo } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: venue } = await supabase
    .from("venues")
    .select("id, name, mattress_price")
    .eq("owner_id", user.id)
    .single();
  if (!venue) redirect("/dashboard");

  const { data: raw } = await supabase
    .from("bookings")
    .select(`
      id, booking_number, guest_name, guest_phone, guest_email,
      check_in, check_out, nights_count, season,
      booking_status, payment_status,
      discount_type, discount_amount,
      total_amount, amount_paid, balance_due,
      payment_method, booking_source, notes,
      has_conflict, created_at,
      booking_units(
        id, mattresses_added, unit_total,
        units(id, name, weekday_price, weekend_price, peak_price)
      )
    `)
    .eq("id", id)
    .eq("venue_id", venue.id)
    .single();

  if (!raw) notFound();

  type RawUnitData = {
    id: string;
    name: string;
    weekday_price: number | string;
    weekend_price: number | string;
    peak_price: number | string;
  };

  type RawUnit = {
    id: string;
    mattresses_added: number | null;
    unit_total: number | string;
    units: RawUnitData | RawUnitData[] | null;
  };

  const booking: Booking = {
    id: raw.id,
    booking_number: raw.booking_number,
    guest_name: raw.guest_name,
    guest_phone: raw.guest_phone,
    guest_email: raw.guest_email,
    check_in: raw.check_in,
    check_out: raw.check_out,
    nights_count: raw.nights_count,
    season: raw.season as Booking["season"],
    booking_status: raw.booking_status as Booking["booking_status"],
    payment_status: raw.payment_status as Booking["payment_status"],
    time_status: computeTimeStatus(raw.check_in, raw.check_out),
    discount_type: raw.discount_type,
    discount_amount: Number(raw.discount_amount),
    total_amount: Number(raw.total_amount),
    amount_paid: Number(raw.amount_paid),
    balance_due: Number(raw.balance_due),
    payment_method: raw.payment_method,
    booking_source: raw.booking_source,
    notes: raw.notes,
    has_conflict: raw.has_conflict ?? false,
    created_at: raw.created_at,
    booking_units: ((raw.booking_units ?? []) as unknown as RawUnit[]).map((bu) => {
      const unitRaw = Array.isArray(bu.units) ? (bu.units[0] ?? null) : bu.units;
      return {
        id: bu.id,
        mattresses_added: bu.mattresses_added ?? 0,
        unit_total: Number(bu.unit_total),
        units: unitRaw
          ? {
              id: unitRaw.id,
              name: unitRaw.name,
              weekday_price: Number(unitRaw.weekday_price),
              weekend_price: Number(unitRaw.weekend_price),
              peak_price: Number(unitRaw.peak_price),
            }
          : null,
      };
    }),
  };

  return <BookingDetail booking={booking} mattressPrice={Number(venue.mattress_price)} venueName={venue.name} returnTo={returnTo} />;
}
