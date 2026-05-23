import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AnalyticsView from "./AnalyticsView";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <AnalyticsView />;
}
