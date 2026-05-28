import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SupportForm from "./SupportForm";

export default async function SupportNewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: venue } = await supabase
    .from("venues")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!venue) redirect("/dashboard");

  return <SupportForm venueId={venue.id} ownerId={user.id} />;
}
