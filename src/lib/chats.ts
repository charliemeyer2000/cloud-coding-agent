import type { UIMessage } from "ai";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { chat, chatMessage } from "@/lib/db/schema";
import {
  attachSandbox,
  createSandbox,
  destroySandbox,
  type SandboxClient,
} from "@/lib/sandbox";

export type Chat = typeof chat.$inferSelect;

export async function listChats(ownerId: string): Promise<Chat[]> {
  return db
    .select()
    .from(chat)
    .where(eq(chat.ownerId, ownerId))
    .orderBy(desc(chat.createdAt));
}

export async function getChat(
  id: string,
  ownerId: string,
): Promise<Chat | null> {
  const [row] = await db.select().from(chat).where(eq(chat.id, id));
  return row && row.ownerId === ownerId ? row : null;
}

export async function createChat(ownerId: string): Promise<Chat> {
  const [row] = await db.insert(chat).values({ ownerId }).returning();
  return row;
}

export async function deleteChat(c: Chat): Promise<void> {
  if (c.sandboxId) await destroySandbox(c.sandboxId).catch(() => {});
  await db.delete(chat).where(eq(chat.id, c.id));
}

export async function setChatTitle(id: string, title: string): Promise<void> {
  await db.update(chat).set({ title }).where(eq(chat.id, id));
}

/**
 * Get a live sandbox for a chat: re-attach if it's still alive, otherwise
 * spawn a fresh one and remember it. Also extends the sandbox lifetime.
 */
export async function ensureChatSandbox(c: Chat): Promise<SandboxClient> {
  if (c.sandboxId) {
    try {
      const sandbox = await attachSandbox(c.sandboxId);
      await sandbox.keepAlive();
      return sandbox;
    } catch {
      // Expired or destroyed — fall through and replace it.
    }
  }
  const sandbox = await createSandbox({ metadata: { chatId: c.id } });
  await db
    .update(chat)
    .set({ sandboxId: sandbox.sandboxId })
    .where(eq(chat.id, c.id));
  return sandbox;
}

export async function listMessages(chatId: string): Promise<UIMessage[]> {
  const rows = await db
    .select()
    .from(chatMessage)
    .where(eq(chatMessage.chatId, chatId))
    .orderBy(asc(chatMessage.createdAt));
  return rows.map((row) => ({
    id: row.id,
    role: row.role as UIMessage["role"],
    parts: row.parts as UIMessage["parts"],
  }));
}

export async function saveMessage(
  chatId: string,
  message: UIMessage,
): Promise<void> {
  await db
    .insert(chatMessage)
    .values({
      id: message.id,
      chatId,
      role: message.role,
      parts: message.parts,
    })
    .onConflictDoUpdate({
      target: chatMessage.id,
      set: { role: message.role, parts: message.parts },
    });
}
