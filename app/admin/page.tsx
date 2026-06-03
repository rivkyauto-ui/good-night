import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminDashboard, { type VenueWithOwner, type PendingUser, type Lead, type SupportTicket, type Announcement } from "./AdminDashboard";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  const admin = createAdminClient();

  const [
    { data: venues },
    { data: pendingUsers },
    { data: leads },
    { data: tickets },
    { data: announcements },
    { data: unreadMessages },
  ] = await Promise.all([
    admin.from("venues").select(`
      id, name, status, created_at, units_limit, subscription_expires_at,
      owner:users!owner_id!left(id, full_name, email, status)
    `).order("created_at", { ascending: false }),
    admin.from("users").select(`
      id, full_name, email, status, created_at, subscription_paid,
      venues(id, name)
    `).eq("status", "pending").eq("role", "owner").order("created_at"),
    admin.from("leads").select("*").order("created_at", { ascending: false }),
    admin.from("support_tickets").select("id, subject, body, status, created_at, venue:venues(name, phone_primary)").in("status", ["pending", "in_progress"]).order("created_at", { ascending: false }),
    admin.from("announcements").select("id, title, body, created_at").order("created_at", { ascending: false }),
    admin.from("ticket_messages").select("ticket_id").eq("sender_role", "owner").eq("is_read", false),
  ]);

  const unreadSet = new Set(unreadMessages?.map((m: { ticket_id: string }) => m.ticket_id) ?? []);
  const ticketsWithUnread = (tickets ?? []).map(t => ({ ...t, has_unread: unreadSet.has(t.id) }));

  return (
    <AdminDashboard
      venues={(venues ?? []) as unknown as VenueWithOwner[]}
      pendingUsers={(pendingUsers ?? []) as unknown as PendingUser[]}
      leads={(leads ?? []) as unknown as Lead[]}
      tickets={ticketsWithUnread as unknown as SupportTicket[]}
      announcements={(announcements ?? []) as unknown as Announcement[]}
    />
  );
}
