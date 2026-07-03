import { createAgentUIStreamResponse, type UIMessage } from "ai";
import { type AgentUIMessage, createAgent } from "@/agent/agent";
import { SCREENSHOT_OMITTED } from "@/agent/constants";
import { getSessionUser } from "@/lib/auth/session";
import {
  ensureChatSandbox,
  getChat,
  saveMessage,
  setChatTitle,
} from "@/lib/chats";

// 5 minutes. You can always raise this — Vercel functions can run up to 30min.
export const maxDuration = 300;

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id, messages }: { id: string; messages: AgentUIMessage[] } =
    await req.json();
  const chat = await getChat(id, user.id);
  if (!chat) return new Response("Not found", { status: 404 });

  const userMessage = messages.at(-1);
  if (userMessage?.role !== "user") {
    return new Response("Last message must be a user message", { status: 400 });
  }
  await saveMessage(chat.id, userMessage);
  if (chat.title === "New chat") {
    await setChatTitle(chat.id, titleFrom(userMessage));
  }

  const sandbox = await ensureChatSandbox(chat);
  return createAgentUIStreamResponse({
    agent: createAgent(sandbox),
    uiMessages: messages,
    originalMessages: messages,
    onEnd: async ({ responseMessage }) => {
      await saveMessage(chat.id, sanitizeForStorage(responseMessage));
    },
  });
}

function titleFrom(message: UIMessage): string {
  const text = message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join(" ")
    .trim();
  return text.slice(0, 80) || "New chat";
}

/**
 * Two cleanups before a response hits the database:
 *
 * - Tool calls that never finished (aborted mid-turn) are dropped
 * - Screenshots replaced with a placeholder
 */
function sanitizeForStorage(message: UIMessage): UIMessage {
  return {
    ...message,
    parts: message.parts
      .filter(
        (part) =>
          !(
            part.type.startsWith("tool-") &&
            "state" in part &&
            part.state !== "output-available" &&
            part.state !== "output-error"
          ),
      )
      .map((part) =>
        part.type === "tool-screenshot" && part.state === "output-available"
          ? { ...part, output: { image: SCREENSHOT_OMITTED } }
          : part,
      ),
  };
}
