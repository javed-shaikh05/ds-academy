import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProjectView from "./ProjectView";

export default async function ProjectPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <ProjectView />;
}
