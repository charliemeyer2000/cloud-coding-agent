"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  ArrowUpIcon,
  BotIcon,
  MessageCircleIcon,
  UserIcon,
} from "lucide-react";
import { useState } from "react";
import type { AgentUIMessage } from "@/agent/agent";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { MessagePart } from "./message-parts";
import { Panel, PanelHeader } from "./panels";

const transport = new DefaultChatTransport({ api: "/api/chat" });

export function ChatPane({
  chatId,
  initialMessages,
  onFirstMessage,
}: {
  chatId: string;
  initialMessages: AgentUIMessage[];
  onFirstMessage: () => void;
}) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat<AgentUIMessage>({
    id: chatId,
    messages: initialMessages,
    transport,
  });
  const busy = status === "submitted" || status === "streaming";

  function submit() {
    const text = input.trim();
    if (!text || busy) return;
    if (messages.length === 0) {
      // First message names the chat (server-side); refresh the sidebar after.
      setTimeout(onFirstMessage, 1000);
    }
    sendMessage({ text });
    setInput("");
  }

  return (
    <Panel className="min-w-80 flex-1">
      <PanelHeader>
        <MessageCircleIcon className="size-3.5" />
        Chat
        <span className="ml-auto font-normal normal-case opacity-50">
          [{status}]
        </span>
      </PanelHeader>

      <MessageScrollerProvider>
        <MessageScroller className="min-h-0 flex-1">
          <MessageScrollerViewport className="scroll-fade">
            <MessageScrollerContent
              aria-busy={busy}
              className="flex flex-col gap-5 p-3"
            >
              {messages.map((message) => (
                <MessageScrollerItem
                  key={message.id}
                  scrollAnchor={message.role === "user"}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase">
                    {message.role === "user" ? (
                      <UserIcon className="size-3.5" />
                    ) : (
                      <BotIcon className="size-3.5" />
                    )}
                    {message.role === "user" ? "You" : "Agent"}
                  </div>
                  {message.parts.map((part, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: parts have no ids and are append-only within a message
                    <MessagePart key={`${message.id}-${i}`} part={part} />
                  ))}
                </MessageScrollerItem>
              ))}
              {status === "submitted" && (
                <div className="shimmer font-mono text-xs text-muted-foreground">
                  Working…
                </div>
              )}
              {error && (
                <div className="text-xs text-destructive">
                  error: {error.message}
                </div>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>

      <form
        className="border-t p-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <InputGroup>
          <InputGroupInput
            value={input}
            placeholder="Tell the agent what to build…"
            onChange={(e) => setInput(e.target.value)}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="submit"
              variant="default"
              size="icon-sm"
              disabled={!input.trim() || busy}
              aria-label="Send"
            >
              <ArrowUpIcon />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </form>
    </Panel>
  );
}
