import { AuthForm } from "@/components/auth/auth-form";

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 pt-8">
      <div className="text-center">
        <h1 className="font-heading text-3xl">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with your CalArts or CalArts alumni email.
        </p>
      </div>
      <AuthForm mode="login" nextPath={params.next || "/"} />
    </div>
  );
}
