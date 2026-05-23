"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="glass glass-hover px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition shrink-0"
      aria-label="Logout"
    >
      <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      <span className="hidden sm:inline">Logout</span>
    </button>
  );
}
