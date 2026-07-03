/**
 * Auth server config (better-auth, email/password only).
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";

function baseURL(): string {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL)
    return `https://${process.env.VERCEL_URL}`;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export const auth = betterAuth({
  baseURL: baseURL(),
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  plugins: [nextCookies()], // must stay last (better-auth requirement)
});
