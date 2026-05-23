import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SessionView from "./SessionView";

export default async function SessionPage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string }>;
}) {
  const { track } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <SessionView track={track || "technical"} />;
}
