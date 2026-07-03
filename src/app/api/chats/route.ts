import { getSessionUser } from "@/lib/auth/session";
import { createChat, listChats } from "@/lib/chats";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  return Response.json(await listChats(user.id));
}

export async function POST() {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  return Response.json(await createChat(user.id));
}
