import { redirect } from "next/navigation";

import { CalendarView } from "@/components/CalendarView";
import { Nav } from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";

export default async function CalendarPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Nav active="calendar" email={user.email ?? ""} />
      <CalendarView userId={user.id} />
    </main>
  );
}
