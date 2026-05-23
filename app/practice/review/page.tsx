import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ReviewView from "./ReviewView";

export default async function ReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <ReviewView />;
}
