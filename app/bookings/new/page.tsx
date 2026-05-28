import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NewBookingForm from "./NewBookingForm";

export default async function NewBookingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: venue } = await supabase
    .from("venues")
    .select("id, name, mattress_price")
    .eq("owner_id", user.id)
    .single();

  if (!venue) redirect("/dashboard");

  const { data: units } = await supabase
    .from("units")
    .select("id, name, beds_count, max_mattresses, weekday_price, weekend_price, peak_price, is_whole_venue")
    .eq("venue_id", venue.id)
    .order("sort_order");

  return (
    <main className="min-h-dvh px-4 pt-6 pb-8">
      <NewBookingForm
        venueId={venue.id}
        venueName={venue.name}
        mattressPrice={Number(venue.mattress_price)}
        units={(units ?? []).map((u) => ({
          ...u,
          weekday_price: Number(u.weekday_price),
          weekend_price: Number(u.weekend_price),
          peak_price: Number(u.peak_price),
        }))}
      />
    </main>
  );
}
