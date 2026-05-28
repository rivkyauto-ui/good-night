"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const items = [
  { href: "/dashboard", label: "ראשי", icon: <HomeIcon /> },
  { href: "/bookings", label: "הזמנות", icon: <BookingsIcon /> },
  { href: "/availability", label: "זמינות", icon: <CalendarIcon /> },
  { href: "/messages", label: "הודעות", icon: <MessagesIcon /> },
  { href: "/control", label: "בקרה", icon: <ControlIcon /> },
  { href: "/settings", label: "הגדרות", icon: <SettingsIcon /> },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    async function checkUnread() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: myTickets } = await supabase.from("support_tickets").select("id");
      const ids = (myTickets ?? []).map((t: { id: string }) => t.id);
      if (!ids.length) { setHasUnread(false); return; }
      const { count } = await supabase
        .from("ticket_messages")
        .select("id", { count: "exact", head: true })
        .in("ticket_id", ids)
        .eq("sender_role", "admin")
        .eq("is_read", false);
      setHasUnread((count ?? 0) > 0);
    }
    checkUnread();
  }, [pathname]);

  return (
    <nav
      className="fixed bottom-0 right-0 left-0 h-16"
      style={{ background: "var(--card)", borderTop: "1px solid var(--card-border)" }}
    >
      <div className="max-w-4xl mx-auto h-full flex">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-colors"
            style={{ color: active ? "var(--amber)" : "var(--muted)" }}
          >
            <div className="relative">
              {item.icon}
              {item.href === "/messages" && hasUnread && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                  style={{ background: "#ef4444" }} />
              )}
            </div>
            <span>{item.label}</span>
          </Link>
        );
      })}
      </div>
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function BookingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="2" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function MessagesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function ControlIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}
