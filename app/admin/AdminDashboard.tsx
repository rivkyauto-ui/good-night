"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface VenueWithOwner {
  id: string;
  name: string;
  status: string;
  created_at: string;
  owner: {
    id: string;
    full_name: string;
    email: string;
    status: string;
  } | { id: string; full_name: string; email: string; status: string; }[] | null;
}

export interface PendingUser {
  id: string;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
  venues: { id: string; name: string }[] | null;
}

export interface Lead {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  venue_name: string;
  status: string;
  payment_confirmed: boolean;
  admin_notes: string | null;
  created_at: string;
}

interface LeadActivity {
  id: string;
  lead_id: string;
  type: "task" | "note";
  content: string;
  due_date: string | null;
  completed: boolean;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  body: string;
  status: string;
  created_at: string;
  has_unread?: boolean;
  venue: { name: string; phone_primary: string | null } | null;
}

const TICKET_STATUS_LABEL: Record<string, string> = {
  pending: "בהמתנה",
  in_progress: "בטיפול",
  closed: "הסתיימה",
};

const TICKET_STATUS_COLOR: Record<string, string> = {
  pending: "var(--amber)",
  in_progress: "#60a5fa",
  closed: "#4ade80",
};

export interface TicketMessage {
  id: string;
  sender_role: "admin" | "owner";
  body: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

export interface AdminStats {
  activeVenues: number;
  pendingApprovals: number;
  openTickets: number;
  newLeads: number;
  inProgressLeads: number;
}

function fmtDate(d: string) {
  const [y, m, day] = d.split("T")[0].split("-");
  return `${day}.${m}.${y.slice(2)}`;
}

const USER_STATUS_LABEL: Record<string, string> = {
  active: "פעיל",
  pending: "ממתין",
  suspended: "מושהה",
};

const VENUE_STATUS_LABEL: Record<string, string> = {
  active: "פעיל",
  inactive: "לא פעיל",
};

const USER_STATUS_COLOR: Record<string, string> = {
  active: "#4ade80",
  pending: "var(--amber)",
  suspended: "#ef4444",
};

const LEAD_STATUS_LABEL: Record<string, string> = {
  new: "חדש",
  in_progress: "בטיפול",
  client: "לקוח",
  irrelevant: "לא רלוונטי",
};

const LEAD_STATUS_COLOR: Record<string, string> = {
  new: "var(--amber)",
  in_progress: "#60a5fa",
  client: "#4ade80",
  irrelevant: "#6b7a8d",
};

interface LeadRowProps {
  lead: Lead;
  selectedLead: Lead | null;
  activities: LeadActivity[];
  activitiesLoading: boolean;
  newType: "task" | "note";
  newContent: string;
  newDate: string;
  addingActivity: boolean;
  isPending: boolean;
  INPUT: React.CSSProperties;
  openLead: (lead: Lead) => void;
  setSelectedLead: (lead: Lead | null) => void;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  toggleActivity: (id: string, completed: boolean) => void;
  setNewType: (t: "task" | "note") => void;
  setNewContent: (v: string) => void;
  setNewDate: (v: string) => void;
  addActivity: () => void;
  fmtDate: (d: string) => string;
}

function LeadRow({ lead, selectedLead, activities, activitiesLoading, newType, newContent, newDate, addingActivity, isPending, INPUT, openLead, setSelectedLead, updateLead, toggleActivity, setNewType, setNewContent, setNewDate, addActivity, fmtDate }: LeadRowProps) {
  if (selectedLead?.id !== lead.id) {
    return (
      <button onClick={() => openLead(lead)} className="w-full text-right"
        style={{ padding: "1rem", display: "block" }}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">{lead.full_name}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              {lead.venue_name} · {lead.phone}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{fmtDate(lead.created_at)}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.06)", color: LEAD_STATUS_COLOR[lead.status] ?? "var(--muted)" }}>
                {LEAD_STATUS_LABEL[lead.status] ?? lead.status}
              </span>
              <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>▼</span>
            </div>
            {lead.payment_confirmed && (
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80" }}>
                ✓ שילם
              </span>
            )}
          </div>
        </div>
      </button>
    );
  }

  return (
    <div style={{ padding: "1rem" }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-base">{selectedLead.full_name}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{selectedLead.email}</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>{selectedLead.phone}</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>{selectedLead.venue_name}</p>
        </div>
        <button onClick={() => setSelectedLead(null)}
          className="text-xs px-2 py-1 rounded-lg"
          style={{ background: "var(--card-border)", color: "var(--muted)" }}>▲</button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {Object.entries(LEAD_STATUS_LABEL).map(([val, lbl]) => (
          <button key={val} disabled={isPending}
            onClick={() => updateLead(selectedLead.id, { status: val })}
            className="text-xs px-2.5 py-1 rounded-full"
            style={{
              background: selectedLead.status === val ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
              color: selectedLead.status === val ? LEAD_STATUS_COLOR[val] : "var(--muted)",
              border: `1px solid ${selectedLead.status === val ? LEAD_STATUS_COLOR[val] : "transparent"}`,
            }}>
            {lbl}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 mb-4 cursor-pointer text-sm">
        <input type="checkbox" checked={selectedLead.payment_confirmed} disabled={isPending}
          onChange={(e) => {
            const patch: Partial<Lead> = { payment_confirmed: e.target.checked };
            if (e.target.checked) patch.status = "client";
            updateLead(selectedLead.id, patch);
          }}
          style={{ accentColor: "#4ade80", width: "1rem", height: "1rem" }} />
        <span style={{ color: selectedLead.payment_confirmed ? "#4ade80" : "var(--muted)" }}>
          תשלום אושר
        </span>
      </label>

      <div style={{ borderTop: "1px solid var(--card-border)", marginBottom: "0.75rem" }} />

      {activitiesLoading ? (
        <p className="text-xs text-center py-3" style={{ color: "var(--muted)" }}>טוען...</p>
      ) : activities.length === 0 ? (
        <p className="text-xs text-center py-2 mb-2" style={{ color: "var(--muted)" }}>אין משימות או הערות</p>
      ) : (
        <div className="flex flex-col gap-2 mb-3">
          {activities.map((act) => (
            <div key={act.id} className="flex gap-2 items-start"
              style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", background: "rgba(255,255,255,0.03)" }}>
              {act.type === "task" ? (
                <input type="checkbox" checked={act.completed}
                  onChange={(e) => toggleActivity(act.id, e.target.checked)}
                  style={{ accentColor: "#4ade80", width: "0.9rem", height: "0.9rem", marginTop: "0.15rem", flexShrink: 0 }} />
              ) : (
                <span style={{ color: "#60a5fa", fontSize: "0.7rem", marginTop: "0.2rem", flexShrink: 0 }}>📝</span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{
                  color: act.completed ? "var(--muted)" : "var(--foreground)",
                  textDecoration: act.completed ? "line-through" : "none",
                }}>
                  {act.content}
                </p>
                {act.due_date && (
                  <p className="text-xs mt-0.5" style={{ color: act.completed ? "var(--muted)" : "var(--amber)" }}>
                    {fmtDate(act.due_date)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex gap-1.5">
          {(["task", "note"] as const).map((t) => (
            <button key={t} onClick={() => setNewType(t)}
              className="flex-1 py-1.5 rounded-lg text-xs"
              style={{
                background: newType === t ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                color: newType === t ? "var(--foreground)" : "var(--muted)",
                border: `1px solid ${newType === t ? "var(--card-border)" : "transparent"}`,
              }}>
              {t === "task" ? "משימה" : "הערה"}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder={newType === "task" ? "תיאור המשימה..." : "תוכן ההערה..."}
          className="w-full px-3 py-2 text-xs"
          style={INPUT}
          onKeyDown={(e) => { if (e.key === "Enter") addActivity(); }}
        />

        {newType === "task" && (
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full px-3 py-2 text-xs"
            style={INPUT}
          />
        )}

        <button disabled={addingActivity || !newContent.trim()}
          onClick={addActivity}
          className="w-full py-2 rounded-xl text-xs font-medium"
          style={{
            background: "rgba(229,175,92,0.12)",
            color: "var(--amber)",
            border: "1px solid rgba(229,175,92,0.3)",
            opacity: addingActivity || !newContent.trim() ? 0.5 : 1,
          }}>
          + הוסף
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard({
  venues,
  pendingUsers,
  leads,
  tickets,
  announcements: initialAnnouncements,
}: {
  venues: VenueWithOwner[];
  pendingUsers: PendingUser[];
  leads: Lead[];
  tickets: SupportTicket[];
  announcements: Announcement[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<VenueWithOwner | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmKey, setConfirmKey] = useState<string | null>(null);

  // Tickets state
  const [ticketsList, setTicketsList] = useState<SupportTicket[]>(tickets);
  const [openTicketId, setOpenTicketId] = useState<string | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [ticketMessagesLoading, setTicketMessagesLoading] = useState(false);
  const [adminReply, setAdminReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Announcements state
  const [announcementsList, setAnnouncementsList] = useState<Announcement[]>(initialAnnouncements);
  const [showComposeForm, setShowComposeForm] = useState(false);
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);
  const [newAnnTitle, setNewAnnTitle] = useState("");
  const [newAnnBody, setNewAnnBody] = useState("");
  const [savingAnn, setSavingAnn] = useState(false);

  async function openTicketWithMessages(ticketId: string) {
    if (openTicketId === ticketId) { setOpenTicketId(null); return; }
    setOpenTicketId(ticketId);
    setAdminReply("");
    setTicketMessages([]);
    setTicketMessagesLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at");
    setTicketMessages((data ?? []) as TicketMessage[]);
    setTicketMessagesLoading(false);
    const ticket = ticketsList.find(t => t.id === ticketId);
    if (ticket?.has_unread) {
      await supabase
        .from("ticket_messages")
        .update({ is_read: true })
        .eq("ticket_id", ticketId)
        .eq("sender_role", "owner")
        .eq("is_read", false);
      setTicketsList(p => p.map(t => t.id === ticketId ? { ...t, has_unread: false } : t));
    }
  }

  async function sendAdminReply(ticketId: string) {
    if (!adminReply.trim()) return;
    setSendingReply(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSendingReply(false); return; }
    const { data } = await supabase
      .from("ticket_messages")
      .insert({ ticket_id: ticketId, sender_id: user.id, sender_role: "admin", body: adminReply.trim() })
      .select().single();
    if (data) setTicketMessages((p) => [...p, data as TicketMessage]);
    const currentTicket = ticketsList.find((t) => t.id === ticketId);
    if (currentTicket?.status === "pending") {
      await supabase.from("support_tickets").update({ status: "in_progress" }).eq("id", ticketId);
      setTicketsList((p) => p.map((t) => t.id === ticketId ? { ...t, status: "in_progress" } : t));
    }
    setAdminReply("");
    setSendingReply(false);
  }

  async function createAnnouncement() {
    if (!newAnnTitle.trim() || !newAnnBody.trim()) return;
    setSavingAnn(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("announcements")
      .insert({ title: newAnnTitle.trim(), body: newAnnBody.trim() })
      .select().single();
    if (data) setAnnouncementsList((p) => [data as Announcement, ...p]);
    setNewAnnTitle("");
    setNewAnnBody("");
    setSavingAnn(false);
    setShowComposeForm(false);
  }

  async function deleteAnnouncement(id: string) {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.from("announcements").delete().eq("id", id);
      setAnnouncementsList((p) => p.filter((a) => a.id !== id));
    });
  }

  async function updateTicketStatus(ticketId: string, status: string) {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.from("support_tickets").update({ status }).eq("id", ticketId);
      if (status === "closed") {
        setTicketsList((p) => p.filter((t) => t.id !== ticketId));
        setOpenTicketId(null);
      } else {
        setTicketsList((p) => p.map((t) => t.id === ticketId ? { ...t, status } : t));
      }
    });
  }

  // Lead state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [newType, setNewType] = useState<"task" | "note">("task");
  const [newContent, setNewContent] = useState("");
  const [newDate, setNewDate] = useState("");
  const [addingActivity, setAddingActivity] = useState(false);

  const normalizeOwner = (v: VenueWithOwner) => {
    if (!v.owner) return null;
    return Array.isArray(v.owner) ? (v.owner[0] ?? null) : v.owner;
  };

  const activeVenues = venues.filter((v) => v.status === "active");
  const filtered = query.trim().length < 1 ? [] : venues.filter((v) => {
    const owner = normalizeOwner(v);
    const q = query.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      owner?.full_name?.toLowerCase().includes(q) ||
      owner?.email?.toLowerCase().includes(q)
    );
  });

  async function updateUserStatus(userId: string, status: string) {
    setActionError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("users").update({ status }).eq("id", userId);
      if (error) { setActionError(error.message); return; }
      router.refresh();
      setSelected(null);
      setConfirmKey(null);
    });
  }

  async function updateVenueStatus(venueId: string, status: string) {
    setActionError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("venues").update({ status }).eq("id", venueId);
      if (error) { setActionError(error.message); return; }
      router.refresh();
      setSelected(null);
      setConfirmKey(null);
    });
  }

  async function updateLead(leadId: string, patch: Partial<Lead>) {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.from("leads").update(patch).eq("id", leadId);
      router.refresh();
      setSelectedLead((p) => p ? { ...p, ...patch } : p);
    });
  }

  async function openLead(lead: Lead) {
    setSelectedLead(lead);
    setActivitiesLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("lead_activities")
      .select("*")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false });
    setActivities((data ?? []) as LeadActivity[]);
    setActivitiesLoading(false);
  }

  async function addActivity() {
    if (!selectedLead || !newContent.trim()) return;
    setAddingActivity(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("lead_activities")
      .insert({ lead_id: selectedLead.id, type: newType, content: newContent.trim(), due_date: newDate || null })
      .select()
      .single();
    if (data) setActivities((p) => [data as LeadActivity, ...p]);
    setNewContent("");
    setNewDate("");
    setAddingActivity(false);
  }

  async function toggleActivity(actId: string, completed: boolean) {
    const supabase = createClient();
    await supabase.from("lead_activities").update({ completed }).eq("id", actId);
    setActivities((p) => p.map((a) => a.id === actId ? { ...a, completed } : a));
  }

  const CARD: React.CSSProperties = {
    background: "linear-gradient(160deg,#232b36,#1c2330)",
    border: "1px solid var(--card-border)",
    borderRadius: "1rem",
  };

  const INPUT: React.CSSProperties = {
    background: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    color: "var(--foreground)",
    outline: "none",
    borderRadius: "0.75rem",
  };

  return (
    <main dir="rtl" className="min-h-dvh px-4 pt-6 pb-10 flex flex-col gap-5"
      style={{ background: "var(--background)", color: "var(--foreground)" }}>

      {/* Header */}
      <header className="flex flex-col items-center text-center pb-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-wide1.neto.svg" alt="Good Night" className="h-[90px] w-auto" />
        <span className="text-xs mt-1 px-3 py-0.5 rounded-full"
          style={{ background: "rgba(229,175,92,0.12)", color: "var(--amber)", border: "1px solid rgba(229,175,92,0.3)" }}>
          ניהול מערכת
        </span>
      </header>

      <Link href="/dashboard" className="text-sm self-end" style={{ color: "var(--muted)" }}>
        ← המתחם שלי
      </Link>

      {/* לטיפול מיידי */}
      <section className="flex flex-col gap-3">
        <p className="text-base font-semibold" style={{ color: "var(--amber)" }}>לטיפול מיידי</p>
        <div style={CARD}>
          <div className="flex items-center justify-between" style={{ padding: "1rem 1rem 0.75rem" }}>
            <p className="text-base font-semibold">בהמתנה לאישור כניסה</p>
            {pendingUsers.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: "var(--amber)", color: "#1a1000" }}>
                {pendingUsers.length}
              </span>
            )}
          </div>
          <div style={{ borderTop: "1px solid var(--card-border)" }} />
          {pendingUsers.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: "var(--muted)" }}>אין בקשות ממתינות ✓</p>
          ) : (
            <div>
              {pendingUsers.map((u, i) => (
                <div key={u.id}>
                  {i > 0 && <div style={{ borderTop: "1px solid var(--card-border)" }} />}
                  <div style={{ padding: "1rem" }}>
                    <div className="mb-3">
                      <p className="font-semibold text-sm">{u.full_name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{u.email}</p>
                      {u.venues && u.venues.length > 0 && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--amber)" }}>
                          {u.venues.map((v) => v.name).join(", ")}
                        </p>
                      )}
                      <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>נרשם: {fmtDate(u.created_at)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button disabled={isPending} onClick={() => updateUserStatus(u.id, "active")}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                        style={{ background: "#4ade80", color: "#0f1f0f", opacity: isPending ? 0.6 : 1 }}>
                        אשר
                      </button>
                      <button disabled={isPending} onClick={() => updateUserStatus(u.id, "suspended")}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                        style={{ background: "transparent", color: "#ef4444", border: "1px solid #ef4444", opacity: isPending ? 0.6 : 1 }}>
                        דחה
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={CARD}>
          <div className="flex items-center justify-between" style={{ padding: "1rem 1rem 0.75rem" }}>
            <p className="text-base font-semibold">פניות שירות</p>
            {ticketsList.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: "var(--amber)", color: "#1a1000" }}>
                {ticketsList.length}
              </span>
            )}
          </div>
          <div style={{ borderTop: "1px solid var(--card-border)" }} />

          {ticketsList.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: "var(--muted)" }}>אין פניות פתוחות ✓</p>
          ) : (
            <div>
              {ticketsList.map((ticket, i) => (
                <div key={ticket.id}>
                  {i > 0 && <div style={{ borderTop: "1px solid var(--card-border)" }} />}
                  <div style={{ padding: "1rem" }}>
                    {openTicketId === ticket.id ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm">{ticket.subject}</p>
                            <p className="text-xs mt-0.5 font-medium" style={{ color: "var(--amber)" }}>
                              {ticket.venue?.name ?? "—"}
                            </p>
                            {ticket.venue?.phone_primary && (
                              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{ticket.venue.phone_primary}</p>
                            )}
                            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{fmtDate(ticket.created_at)}</p>
                          </div>
                          <button onClick={() => setOpenTicketId(null)}
                            className="text-xs px-2 py-1 rounded-lg shrink-0"
                            style={{ background: "var(--card-border)", color: "var(--muted)" }}>▲</button>
                        </div>

                        {/* הפנייה המקורית */}
                        <div className="px-3 py-2.5 rounded-xl text-sm"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--card-border)" }}>
                          <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>{ticket.body}</p>
                        </div>

                        {/* שיחה */}
                        {ticketMessagesLoading ? (
                          <p className="text-xs text-center py-2" style={{ color: "var(--muted)" }}>טוען...</p>
                        ) : ticketMessages.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {ticketMessages.map((msg) => (
                              <div key={msg.id} className={`flex ${msg.sender_role === "admin" ? "justify-start" : "justify-end"}`}>
                                <div className="max-w-[80%] px-3 py-2 rounded-xl text-xs"
                                  style={{
                                    background: msg.sender_role === "admin" ? "rgba(229,175,92,0.1)" : "rgba(255,255,255,0.06)",
                                    color: msg.sender_role === "admin" ? "var(--amber)" : "var(--foreground)",
                                    border: `1px solid ${msg.sender_role === "admin" ? "rgba(229,175,92,0.3)" : "var(--card-border)"}`,
                                  }}>
                                  <p style={{ lineHeight: 1.5 }}>{msg.body}</p>
                                  <p className="mt-1 opacity-60">{fmtDate(msg.created_at)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        {/* תגובה */}
                        <div className="flex gap-2">
                          <input type="text" value={adminReply}
                            onChange={(e) => setAdminReply(e.target.value)}
                            placeholder="כתוב תגובה ללקוח..."
                            className="flex-1 px-3 py-2 text-xs"
                            style={{ ...INPUT, borderRadius: "0.75rem" }}
                            onKeyDown={(e) => { if (e.key === "Enter") sendAdminReply(ticket.id); }}
                          />
                          <button onClick={() => sendAdminReply(ticket.id)}
                            disabled={sendingReply || !adminReply.trim()}
                            className="px-3 py-2 rounded-xl text-xs font-medium shrink-0"
                            style={{
                              background: "rgba(229,175,92,0.12)", color: "var(--amber)",
                              border: "1px solid rgba(229,175,92,0.3)",
                              opacity: sendingReply || !adminReply.trim() ? 0.5 : 1,
                            }}>
                            שלח
                          </button>
                        </div>

                        {/* סטטוס */}
                        <div className="flex gap-1.5">
                          {Object.entries(TICKET_STATUS_LABEL).map(([val, lbl]) => (
                            <button key={val} disabled={isPending}
                              onClick={() => updateTicketStatus(ticket.id, val)}
                              className="flex-1 py-1.5 rounded-xl text-xs font-medium"
                              style={{
                                background: ticket.status === val ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
                                color: ticket.status === val ? TICKET_STATUS_COLOR[val] : "var(--muted)",
                                border: `1px solid ${ticket.status === val ? TICKET_STATUS_COLOR[val] : "transparent"}`,
                                opacity: isPending ? 0.6 : 1,
                              }}>
                              {lbl}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => openTicketWithMessages(ticket.id)} className="w-full text-right">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">{ticket.subject}</p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--amber)" }}>{ticket.venue?.name ?? "—"}</p>
                            {ticket.venue?.phone_primary && (
                              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{ticket.venue.phone_primary}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {ticket.has_unread && (
                              <span className="w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
                            )}
                            <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>▼</span>
                            <span className="text-xs px-1.5 py-0.5 rounded-full"
                              style={{ background: "rgba(255,255,255,0.05)", color: TICKET_STATUS_COLOR[ticket.status] ?? "var(--muted)" }}>
                              {TICKET_STATUS_LABEL[ticket.status] ?? ticket.status}
                            </span>
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Leads */}
      <section className="flex flex-col gap-3">
        <p className="text-base font-semibold" style={{ color: "var(--amber)" }}>לידים</p>

        {/* פניות חדשות */}
        {(() => {
          const newLeads = leads.filter((l) => l.status === "new");
          return (
            <div style={CARD}>
              <div className="flex items-center justify-between" style={{ padding: "1rem 1rem 0.75rem" }}>
                <p className="text-base font-semibold">פניות חדשות</p>
                {newLeads.length > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: "var(--amber)", color: "#1a1000" }}>
                    {newLeads.length}
                  </span>
                )}
              </div>
              <div style={{ borderTop: "1px solid var(--card-border)" }} />
              {newLeads.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: "var(--muted)" }}>אין פניות חדשות ✓</p>
              ) : (
                <div>
                  {newLeads.map((lead, i) => (
                    <div key={lead.id}>
                      {i > 0 && <div style={{ borderTop: "1px solid var(--card-border)" }} />}
                      <LeadRow lead={lead} selectedLead={selectedLead} activities={activities} activitiesLoading={activitiesLoading} newType={newType} newContent={newContent} newDate={newDate} addingActivity={addingActivity} isPending={isPending} INPUT={INPUT} openLead={openLead} setSelectedLead={setSelectedLead} updateLead={updateLead} toggleActivity={toggleActivity} setNewType={setNewType} setNewContent={setNewContent} setNewDate={setNewDate} addActivity={addActivity} fmtDate={fmtDate} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* בטיפול */}
        {(() => {
          const inProgressLeads = leads.filter((l) => l.status === "in_progress");
          return (
            <div style={CARD}>
              <div className="flex items-center justify-between" style={{ padding: "1rem 1rem 0.75rem" }}>
                <p className="text-base font-semibold">פניות בטיפול</p>
                {inProgressLeads.length > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: "#60a5fa", color: "#0a1a2e" }}>
                    {inProgressLeads.length}
                  </span>
                )}
              </div>
              <div style={{ borderTop: "1px solid var(--card-border)" }} />
              {inProgressLeads.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: "var(--muted)" }}>אין פניות בטיפול</p>
              ) : (
                <div>
                  {inProgressLeads.map((lead, i) => (
                    <div key={lead.id}>
                      {i > 0 && <div style={{ borderTop: "1px solid var(--card-border)" }} />}
                      <LeadRow lead={lead} selectedLead={selectedLead} activities={activities} activitiesLoading={activitiesLoading} newType={newType} newContent={newContent} newDate={newDate} addingActivity={addingActivity} isPending={isPending} INPUT={INPUT} openLead={openLead} setSelectedLead={setSelectedLead} updateLead={updateLead} toggleActivity={toggleActivity} setNewType={setNewType} setNewContent={setNewContent} setNewDate={setNewDate} addActivity={addActivity} fmtDate={fmtDate} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </section>

      {/* ניהול כללי */}
      <section className="flex flex-col gap-3">
        <p className="text-base font-semibold" style={{ color: "var(--amber)" }}>ניהול כללי ובקרה</p>
        <div style={CARD}>
          <div style={{ padding: "1rem" }} className="flex items-center justify-between gap-2">
            <p className="text-base font-semibold">הודעות כלליות</p>
            <button onClick={() => { setShowComposeForm(p => !p); setNewAnnTitle(""); setNewAnnBody(""); }}
              className="text-xs px-3 py-1.5 rounded-xl font-medium shrink-0"
              style={{
                background: showComposeForm ? "rgba(229,175,92,0.2)" : "rgba(229,175,92,0.08)",
                color: "var(--amber)",
                border: "1px solid rgba(229,175,92,0.3)",
              }}>
              {showComposeForm ? "ביטול" : "הודעה חדשה"}
            </button>
          </div>
          <div style={{ borderTop: "1px solid var(--card-border)" }} />

          {/* טופס חדש */}
          {showComposeForm && (
            <div style={{ padding: "1rem" }} className="flex flex-col gap-2">
              <input type="text" value={newAnnTitle} onChange={(e) => setNewAnnTitle(e.target.value)}
                placeholder="כותרת ההודעה..."
                className="w-full px-3 py-2 text-sm"
                style={{ ...INPUT }} />
              <textarea value={newAnnBody} onChange={(e) => setNewAnnBody(e.target.value)}
                placeholder="תוכן ההודעה לכל הלקוחות..."
                rows={3}
                className="w-full px-3 py-2 text-sm resize-none"
                style={{ ...INPUT, borderRadius: "0.75rem" }} />
              <button onClick={createAnnouncement}
                disabled={savingAnn || !newAnnTitle.trim() || !newAnnBody.trim()}
                className="w-full py-2.5 rounded-xl text-sm font-medium"
                style={{
                  background: "rgba(229,175,92,0.12)", color: "var(--amber)",
                  border: "1px solid rgba(229,175,92,0.3)",
                  opacity: savingAnn || !newAnnTitle.trim() || !newAnnBody.trim() ? 0.5 : 1,
                }}>
                {savingAnn ? "שולח..." : "שלח לכולם"}
              </button>
            </div>
          )}

          {/* רשימת הכרזות */}
          {announcementsList.length > 0 && (
            <>
              {showComposeForm && <div style={{ borderTop: "1px solid var(--card-border)" }} />}
              <div>
                {(showAllAnnouncements ? announcementsList : announcementsList.slice(0, 1)).map((ann, i) => (
                  <div key={ann.id}>
                    {i > 0 && <div style={{ borderTop: "1px solid var(--card-border)" }} />}
                    <details>
                      <summary style={{ padding: "0.75rem 1rem", cursor: "pointer", listStyle: "none" }}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span style={{ color: "var(--muted)", fontSize: "0.7rem" }}>▼</span>
                            <p className="text-sm font-medium truncate">{ann.title}</p>
                            <p className="text-xs shrink-0" style={{ color: "var(--muted)", opacity: 0.6 }}>{fmtDate(ann.created_at)}</p>
                          </div>
                          <button onClick={(e) => { e.preventDefault(); deleteAnnouncement(ann.id); }} disabled={isPending}
                            className="text-xs px-2 py-1 rounded-lg shrink-0"
                            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", opacity: isPending ? 0.5 : 1 }}>
                            מחק
                          </button>
                        </div>
                      </summary>
                      <div style={{ padding: "0 1rem 0.75rem", borderTop: "1px solid var(--card-border)", paddingTop: "0.75rem" }}>
                        <p className="text-sm" style={{ color: "var(--muted)", lineHeight: 1.6 }}>{ann.body}</p>
                      </div>
                    </details>
                  </div>
                ))}
                {announcementsList.length > 1 && (
                  <div style={{ borderTop: "1px solid var(--card-border)" }}>
                    <button onClick={() => setShowAllAnnouncements(p => !p)}
                      className="w-full py-2.5 text-xs text-center"
                      style={{ color: "var(--muted)" }}>
                      {showAllAnnouncements ? "הסתר" : `הצג את כל ההודעות (${announcementsList.length - 1} נוספות)`}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {announcementsList.length === 0 && !showComposeForm && (
            <p className="text-sm text-center py-5" style={{ color: "var(--muted)" }}>אין הודעות עדיין</p>
          )}
        </div>

        {/* מתחמים פעילים */}
        <div style={CARD}>
          <div className="flex items-center justify-between" style={{ padding: "1rem 1.25rem 0.75rem" }}>
            <p className="text-base font-semibold">מתחמים פעילים</p>
            <p className="text-2xl font-bold">{activeVenues.length}</p>
          </div>
          <div style={{ borderTop: "1px solid var(--card-border)" }} />
          <div style={{ padding: "0.75rem 1.25rem 1.25rem" }}>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
              placeholder="חיפוש מתחם / בעלים / מייל..."
              className="w-full px-4 py-2.5 rounded-xl text-sm"
              style={{ ...INPUT }}
            />
          </div>
        </div>
      </section>

      {/* תוצאות חיפוש */}
      <div>
        {query.trim().length > 0 && filtered.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>אין תוצאות</p>
        )}
        {filtered.length > 0 && !selected && (
          <div className="flex flex-col gap-2">
            {filtered.map((v) => {
              const owner = normalizeOwner(v);
              return (
                <button key={v.id} onClick={() => setSelected(v)}
                  className="w-full text-right px-4 py-3 rounded-xl flex items-center justify-between gap-2"
                  style={CARD}>
                  <div>
                    <p className="text-sm font-semibold">{v.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      {owner?.full_name ?? "—"} · {owner?.email ?? "—"}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: v.status === "active" ? "rgba(74,222,128,0.12)" : "rgba(107,122,141,0.12)",
                      color: v.status === "active" ? "#4ade80" : "var(--muted)" }}>
                    {VENUE_STATUS_LABEL[v.status] ?? v.status}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {selected && (() => {
          const owner = normalizeOwner(selected);
          return (
            <div style={{ ...CARD, padding: "1rem" }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-base">{selected.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>נוצר: {fmtDate(selected.created_at)}</p>
                </div>
                <button onClick={() => setSelected(null)}
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ background: "var(--card-border)", color: "var(--muted)" }}>✕</button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                {[
                  { label: "בעלים", value: owner?.full_name ?? "—" },
                  { label: "מייל", value: owner?.email ?? "—" },
                  { label: "טלפון", value: "—" },
                  { label: "סטטוס בעלים", value: USER_STATUS_LABEL[owner?.status ?? ""] ?? owner?.status ?? "—" },
                  { label: "סטטוס מתחם", value: VENUE_STATUS_LABEL[selected.status] ?? selected.status },
                ].map((r) => (
                  <div key={r.label}>
                    <p style={{ color: "var(--muted)", fontSize: "0.65rem", marginBottom: "0.1rem" }}>{r.label}</p>
                    <p style={{ color: r.label === "סטטוס בעלים" ? USER_STATUS_COLOR[owner?.status ?? ""] : "var(--foreground)" }}>
                      {r.value}
                    </p>
                  </div>
                ))}
              </div>
              {actionError && (
                <p className="text-xs px-3 py-2 rounded-xl mb-3"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                  {actionError}
                </p>
              )}
              <div className="flex flex-col gap-2">
                <Link href={`/debug?venueId=${selected.id}`}
                  className="block w-full py-2.5 rounded-xl text-center text-sm font-medium"
                  style={{ background: "rgba(229,175,92,0.12)", color: "var(--amber)", border: "1px solid rgba(229,175,92,0.3)" }}>
                  פתח בקרה
                </Link>
                {owner && owner.status === "active" ? (
                  confirmKey === "suspend-owner" ? (
                    <div className="flex gap-2">
                      <span className="flex-1 flex items-center text-xs px-2" style={{ color: "var(--muted)" }}>להשהות את הבעלים?</span>
                      <button disabled={isPending} onClick={() => { updateUserStatus(owner.id, "suspended"); setConfirmKey(null); }}
                        className="px-3 py-2 rounded-xl text-xs font-bold"
                        style={{ background: "#ef4444", color: "#fff", opacity: isPending ? 0.6 : 1 }}>
                        כן
                      </button>
                      <button onClick={() => setConfirmKey(null)}
                        className="px-3 py-2 rounded-xl text-xs"
                        style={{ background: "var(--card-border)", color: "var(--muted)" }}>
                        ביטול
                      </button>
                    </div>
                  ) : (
                    <button disabled={isPending} onClick={() => setConfirmKey("suspend-owner")}
                      className="w-full py-2.5 rounded-xl text-sm font-medium"
                      style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", opacity: isPending ? 0.6 : 1 }}>
                      השהה בעלים
                    </button>
                  )
                ) : owner && owner.status === "suspended" ? (
                  <button disabled={isPending} onClick={() => updateUserStatus(owner.id, "active")}
                    className="w-full py-2.5 rounded-xl text-sm font-medium"
                    style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)", opacity: isPending ? 0.6 : 1 }}>
                    הפעל מחדש
                  </button>
                ) : null}
                {selected.status === "active" ? (
                  confirmKey === "disable-venue" ? (
                    <div className="flex gap-2">
                      <span className="flex-1 flex items-center text-xs px-2" style={{ color: "var(--muted)" }}>להשבית את המתחם?</span>
                      <button disabled={isPending} onClick={() => { updateVenueStatus(selected.id, "inactive"); setConfirmKey(null); }}
                        className="px-3 py-2 rounded-xl text-xs font-bold"
                        style={{ background: "#ef4444", color: "#fff", opacity: isPending ? 0.6 : 1 }}>
                        כן
                      </button>
                      <button onClick={() => setConfirmKey(null)}
                        className="px-3 py-2 rounded-xl text-xs"
                        style={{ background: "var(--card-border)", color: "var(--muted)" }}>
                        ביטול
                      </button>
                    </div>
                  ) : (
                    <button disabled={isPending} onClick={() => setConfirmKey("disable-venue")}
                      className="w-full py-2.5 rounded-xl text-sm"
                      style={{ background: "var(--card-border)", color: "var(--muted)", opacity: isPending ? 0.6 : 1 }}>
                      השבת מתחם
                    </button>
                  )
                ) : (
                  <button disabled={isPending} onClick={() => updateVenueStatus(selected.id, "active")}
                    className="w-full py-2.5 rounded-xl text-sm"
                    style={{ background: "var(--card-border)", color: "var(--muted)", opacity: isPending ? 0.6 : 1 }}>
                    הפעל מתחם
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </div>

    </main>
  );
}
