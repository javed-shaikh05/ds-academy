import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().split("T")[0];

  // Questions due for review today
  const { data: due } = await supabase
    .from("mcq_reviews")
    .select("mcq_id, mcqs(*)")
    .eq("user_id", user.id)
    .lte("due_date", today)
    .limit(20);

  const mcqs = (due || []).map((r: any) => r.mcqs).filter(Boolean);
  return NextResponse.json({ mcqs });
}
