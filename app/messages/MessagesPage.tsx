"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  created_at: string;
}

interface TicketMessage {
  id: string;
  sender_role: "admin" | "owner";
  body: string;
  created_at: string;
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

function fmtDate(d: string) {
  const [y, m, day] = d.split("T")[0].split("-");
  return `${day}.${m}.${y.slice(2)}`;
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
  width: "100%",
};

export default function MessagesPage({
  tickets: initialTickets,
  announcements,
  unreadTicketIds,
  userId,
  venueName,
}: {
  tickets: Ticket[];
  announcements: Announcement[];
  unreadTicketIds: string[];
  userId: string;
  venueName: string;
}) {
  const [tickets] = useState<Ticket[]>(initialTickets);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set(unreadTicketIds));
  const [openTicketId, setOpenTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [openAnnouncementId, setOpenAnnouncementId] = useState<string | null>(null);

  async function openTicket(ticketId: string) {
    if (openTicketId === ticketId) { setOpenTicketId(null); return; }
    setOpenTicketId(ticketId);
    setMessages([]);
    setReplyBody("");
    setMessagesLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at");
    setMessages((data ?? []) as TicketMessage[]);
    setMessagesLoading(false);
    if (unreadIds.has(ticketId)) {
      await supabase
        .from("ticket_messages")
        .update({ is_read: true })
        .eq("ticket_id", ticketId)
        .eq("sender_role", "admin")
        .eq("is_read", false);
      setUnreadIds(prev => { const next = new Set(prev); next.delete(ticketId); return next; });
    }
  }

  async function sendReply() {
    if (!openTicketId || !replyBody.trim()) return;
    setSending(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("ticket_messages")
      .insert({ ticket_id: openTicketId, sender_id: userId, sender_role: "owner", body: replyBody.trim() })
      .select()
      .single();
    if (data) setMessages((p) => [...p, data as TicketMessage]);
    setReplyBody("");
    setSending(false);
  }

  return (
    <main dir="rtl" className="min-h-dvh px-4 pt-6 pb-10 flex flex-col gap-5"
      style={{ color: "var(--foreground)" }}>

      <div className="flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-wide1.neto.svg" alt="Good Night" className="h-[90px] w-auto" />
      </div>

      <h1 className="text-xl font-bold">
        <span style={{ color: "var(--amber)" }}>הודעות</span>
        {venueName && (
          <>
            <span style={{ color: "var(--muted)", fontWeight: 400 }}> ← </span>
            <span>{venueName}</span>
          </>
        )}
      </h1>

      {/* הכרזות */}
      {announcements.length > 0 && (
        <section>
          <div style={CARD}>
            <div style={{ padding: "1rem 1rem 0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                </svg>
                <p className="text-base font-semibold" style={{ color: "var(--amber)" }}>הכרזות</p>
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--card-border)" }} />
            <div>
              {announcements.map((ann, i) => (
                <div key={ann.id}>
                  {i > 0 && <div style={{ borderTop: "1px solid var(--card-border)" }} />}
                  <div style={{ padding: "1rem" }}>
                    <button className="w-full text-right" onClick={() =>
                      setOpenAnnouncementId(openAnnouncementId === ann.id ? null : ann.id)
                    }>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{ann.title}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs" style={{ color: "var(--muted)" }}>{fmtDate(ann.created_at)}</span>
                          <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>
                            {openAnnouncementId === ann.id ? "▲" : "▼"}
                          </span>
                        </div>
                      </div>
                    </button>
                    {openAnnouncementId === ann.id && (
                      <p className="text-sm mt-2" style={{ color: "var(--muted)", lineHeight: 1.6 }}>{ann.body}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* הפניות שלי */}
      <section>
        <div style={CARD}>
          <div style={{ padding: "1rem 1rem 0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <p className="text-base font-semibold" style={{ color: "var(--amber)" }}>הפניות שלי</p>
            </div>
          </div>
          <div style={{ borderTop: "1px solid var(--card-border)" }} />

          {tickets.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: "var(--muted)" }}>אין פניות עדיין</p>
          ) : (
            <div>
              {tickets.map((ticket, i) => (
                <div key={ticket.id}>
                  {i > 0 && <div style={{ borderTop: "1px solid var(--card-border)" }} />}
                  <div style={{ padding: "1rem" }}>
                    <button className="w-full text-right" onClick={() => openTicket(ticket.id)}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{ticket.subject}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{fmtDate(ticket.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {unreadIds.has(ticket.id) && (
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#ef4444" }} />
                          )}
                          <span className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ background: "rgba(255,255,255,0.05)", color: TICKET_STATUS_COLOR[ticket.status] ?? "var(--muted)" }}>
                            {TICKET_STATUS_LABEL[ticket.status] ?? ticket.status}
                          </span>
                          <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>
                            {openTicketId === ticket.id ? "▲" : "▼"}
                          </span>
                        </div>
                      </div>
                    </button>

                    {openTicketId === ticket.id && (
                      <div className="flex flex-col gap-3 mt-3">
                        <div style={{ borderTop: "1px solid var(--card-border)" }} />

                        {messagesLoading ? (
                          <p className="text-xs text-center py-2" style={{ color: "var(--muted)" }}>טוען...</p>
                        ) : messages.length === 0 ? (
                          <p className="text-xs text-center py-1" style={{ color: "var(--muted)" }}>אין הודעות עדיין</p>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {messages.map((msg) => (
                              <div key={msg.id}
                                className={`flex ${msg.sender_role === "owner" ? "justify-start" : "justify-end"}`}>
                                <div className="max-w-[80%] px-3 py-2 rounded-xl text-sm"
                                  style={{
                                    background: msg.sender_role === "owner"
                                      ? "rgba(255,255,255,0.06)"
                                      : "rgba(229,175,92,0.12)",
                                    color: msg.sender_role === "owner" ? "var(--foreground)" : "var(--amber)",
                                    border: `1px solid ${msg.sender_role === "owner" ? "var(--card-border)" : "rgba(229,175,92,0.3)"}`,
                                  }}>
                                  <p style={{ lineHeight: 1.5 }}>{msg.body}</p>
                                  <p className="text-xs mt-1 opacity-60">{fmtDate(msg.created_at)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {ticket.status === "closed" ? (
                          <div className="text-center py-1">
                            <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>הפנייה טופלה ונסגרה</p>
                            <Link href="/support/new"
                              className="text-xs px-4 py-1.5 rounded-xl font-medium"
                              style={{
                                background: "rgba(229,175,92,0.12)",
                                color: "var(--amber)",
                                border: "1px solid rgba(229,175,92,0.3)",
                              }}>
                              לפנייה חדשה לחץ כאן
                            </Link>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={replyBody}
                              onChange={(e) => setReplyBody(e.target.value)}
                              placeholder="כתוב תגובה..."
                              className="flex-1 px-3 py-2 text-sm"
                              style={INPUT}
                              onKeyDown={(e) => { if (e.key === "Enter") sendReply(); }}
                            />
                            <button onClick={sendReply} disabled={sending || !replyBody.trim()}
                              className="px-4 py-2 rounded-xl text-sm font-medium shrink-0"
                              style={{
                                background: "rgba(229,175,92,0.12)",
                                color: "var(--amber)",
                                border: "1px solid rgba(229,175,92,0.3)",
                                opacity: sending || !replyBody.trim() ? 0.5 : 1,
                              }}>
                              שלח
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </main>
  );
}
