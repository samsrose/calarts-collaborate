import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { avatarPublicUrl } from "@/lib/avatar";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const profile = user ? await getCurrentProfile() : null;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-heading text-lg tracking-tight text-foreground">
            CalArts Collaborate
          </span>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            cross-school Q&A
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button nativeButton={false} render={<Link href="/questions/new" />}>
                <PlusIcon data-icon="inline-start" />
                Ask
              </Button>
              <UserMenu
                displayName={profile?.display_name ?? user.email ?? "User"}
                avatarUrl={avatarPublicUrl(profile?.avatar_path)}
                userId={user.id}
              />
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                nativeButton={false}
                render={<Link href="/auth/login" />}
              >
                Log in
              </Button>
              <Button nativeButton={false} render={<Link href="/auth/register" />}>
                Register
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
