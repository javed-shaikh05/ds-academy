import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RevisionView from "./RevisionView";

export default async function RevisionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <RevisionView />;
}
