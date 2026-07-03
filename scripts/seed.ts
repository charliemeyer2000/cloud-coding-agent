/**
 * Seed the local dev user (idempotent). Run: pnpm db:seed
 */
import { eq } from "drizzle-orm";
import { auth } from "../src/lib/auth";
import { DEV_USER } from "../src/lib/auth/dev-user";
import { db } from "../src/lib/db";
import { user } from "../src/lib/db/schema";

async function main() {
  const existing = await db
    .select()
    .from(user)
    .where(eq(user.email, DEV_USER.email));
  if (existing.length > 0) {
    console.log(`dev user already seeded (${DEV_USER.email})`);
    return;
  }
  await auth.api.signUpEmail({
    body: {
      name: DEV_USER.name,
      email: DEV_USER.email,
      password: DEV_USER.password,
    },
  });
  console.log(`seeded dev user ${DEV_USER.email}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
