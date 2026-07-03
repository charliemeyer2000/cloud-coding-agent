import { getSessionUser } from "@/lib/auth/session";
import {
  deleteChat,
  ensureChatSandbox,
  getChat,
  listMessages,
} from "@/lib/chats";

export const maxDuration = 60;

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const chat = await getChat((await params).id, user.id);
  if (!chat) return new Response("Not found", { status: 404 });

  const sandbox = await ensureChatSandbox(chat);
  const streamUrl = await sandbox.getStreamUrl();
  const messages = await listMessages(chat.id);
  return Response.json({
    chat: { ...chat, sandboxId: sandbox.sandboxId },
    messages,
    streamUrl,
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const chat = await getChat((await params).id, user.id);
  if (!chat) return new Response("Not found", { status: 404 });

  await deleteChat(chat);
  return new Response(null, { status: 204 });
}
