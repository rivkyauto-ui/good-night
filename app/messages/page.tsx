import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MessagesPage from "./MessagesPage";

export default async function MessagesRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: venue } = await supabase.from("venues").select("name").eq("owner_id", user.id).single();

  const [{ data: tickets }, { data: announcements }] = await Promise.all([
    supabase.from("support_tickets")
      .select("id, subject, status, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("announcements")
      .select("id, title, body, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const ticketIds = (tickets ?? []).map(t => t.id);
  const { data: unreadMessages } = ticketIds.length
    ? await supabase
        .from("ticket_messages")
        .select("ticket_id")
        .in("ticket_id", ticketIds)
        .eq("sender_role", "admin")
        .eq("is_read", false)
    : { data: [] };
  const unreadTicketIds = [...new Set((unreadMessages ?? []).map((m: { ticket_id: string }) => m.ticket_id))];

  return (
    <MessagesPage
      tickets={(tickets ?? []) as Parameters<typeof MessagesPage>[0]["tickets"]}
      announcements={(announcements ?? []) as Parameters<typeof MessagesPage>[0]["announcements"]}
      unreadTicketIds={unreadTicketIds}
      userId={user.id}
      venueName={venue?.name ?? ""}
    />
  );
}
