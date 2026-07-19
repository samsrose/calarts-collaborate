import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SettingsForm } from "@/components/settings/settings-form";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { getSchools } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/settings");

  const schools = getSchools();
  const supabase = await createClient();

  const [profile, { data: profileSchools }] = await Promise.all([
    getCurrentProfile(),
    supabase
      .from("profile_schools")
      .select("school_id")
      .eq("profile_id", user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl">Account settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update how you appear across CalArts Collaborate.
        </p>
      </div>
      <SettingsForm
        displayName={profile?.display_name ?? ""}
        bio={profile?.bio ?? ""}
        schoolIds={(profileSchools ?? []).map((row) => row.school_id)}
        schools={schools}
      />
    </div>
  );
}
