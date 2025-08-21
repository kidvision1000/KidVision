import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const { code } = await req.json();
  const supabase = supabaseServer();
  const { data, error } = await supabase.rpc("redeem_invite", { p_code: code });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, orgId: data });
}
