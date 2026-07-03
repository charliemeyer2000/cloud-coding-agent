import { redirect } from "next/navigation";
import { App } from "@/components/app";
import { getSessionUser } from "@/lib/auth/session";

export default async function Home() {
  const user = await getSessionUser();
  if (!user) {
    redirect(
      // Dev only - auto log-in (NODE_ENV is "development" only under `next dev`)
      process.env.NODE_ENV === "development" ? "/api/auth/dev-login" : "/login",
    );
  }
  return <App userEmail={user.email} />;
}
