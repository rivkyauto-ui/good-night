import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LandingPage from "./_landing/LandingPage";

export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user && process.env.NODE_ENV !== "development") redirect("/dashboard");
  return <LandingPage />;
}
