"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(mode: "in" | "up") {
    setError(null);
    setPending(true);
    try {
      const result =
        mode === "in"
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({
              email,
              password,
              name: email.split("@")[0],
            });
      if (result.error)
        setError(result.error.message ?? "Something went wrong");
      else router.push("/");
    } catch {
      setError("Network error — try again");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xs flex-col justify-center gap-6 py-10">
      <div>
        <h1 className="font-mono text-sm font-semibold tracking-tight uppercase">
          Cloud Coding Agent
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to start a session.
        </p>
      </div>
      <form onSubmit={(e) => e.preventDefault()}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={pending}
              onClick={() => submit("in")}
            >
              Sign in
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => submit("up")}
            >
              Sign up
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </FieldGroup>
      </form>
    </main>
  );
}
