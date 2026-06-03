import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { name, phone } = await req.json();
  if (!name || !phone) return NextResponse.json({ error: "missing fields" }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("leads").insert({
    full_name: name.trim(),
    phone: phone.trim(),
    status: "new",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
