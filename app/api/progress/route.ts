import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { subtopicId, status } = await req.json();

    const update: any = {
      user_id: user.id,
      subtopic_id: subtopicId,
      status,
    };
    if (status === "in_progress") update.started_at = new Date().toISOString();
    if (status === "completed") update.completed_at = new Date().toISOString();

    const { error } = await supabase
      .from("user_progress")
      .upsert(update, { onConflict: "user_id,subtopic_id" });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
