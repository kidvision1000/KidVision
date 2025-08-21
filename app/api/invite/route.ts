import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const { orgId, email, role = "teacher" } = await req.json();
  const code = Math.random().toString(36).slice(2,10).toUpperCase();
  const supabase = supabaseServer();
  const { error } = await supabase.from("invites").insert({ org_id: orgId, email, code, role });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, code });
}
