import { AuthForm } from "@/components/auth/auth-form";

export default function RegisterPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 pt-8">
      <div className="text-center">
        <h1 className="font-heading text-3xl">Join Collaborate</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Registration is limited to CalArts and CalArts alumni addresses.
        </p>
      </div>
      <AuthForm mode="register" />
    </div>
  );
}
