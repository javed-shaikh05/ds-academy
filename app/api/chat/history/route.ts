import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("mentor_chats")
    .select("role, content, sources, mentor_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(100);

  return NextResponse.json({ messages: data || [] });
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase.from("mentor_chats").delete().eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
