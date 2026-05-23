import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Playground from "./Playground";

export default async function PlaygroundPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <Playground />;
}
