import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { phone } = await req.json();
  if (!phone) return NextResponse.json({ ok: true });

  const supabase = createAdminClient();
  await supabase
    .from("leads")
    .update({ status: "client" })
    .eq("status", "registering")
    .or(`phone.eq.${phone.trim()},phone.eq.${phone.trim().replace(/-/g, "")}`);

  return NextResponse.json({ ok: true });
}
