import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DEV_USER } from "@/lib/auth/dev-user";

/**
 * Dev-only auto-login: signs in as the seeded dev user and redirects home.
 * Hard-disabled outside local development.
 */
export async function GET() {
  // NODE_ENV is "development" only under `next dev` — never on Vercel.
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not found", { status: 404 });
  }
  await auth.api.signInEmail({
    body: { email: DEV_USER.email, password: DEV_USER.password },
  });
  redirect("/");
}
