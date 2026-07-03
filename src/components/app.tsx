"use client";

import { useCallback, useEffect, useState } from "react";
import type { AgentUIMessage } from "@/agent/agent";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { ChatPane } from "./chat-pane";
import { DesktopPane } from "./desktop-pane";
import { Sidebar } from "./sidebar";

export interface ChatSummary {
  id: string;
  title: string;
}

interface ChatDetail {
  chat: ChatSummary;
  messages: AgentUIMessage[];
  streamUrl: string;
}

export function App({ userEmail }: { userEmail: string }) {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ChatDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshChats = useCallback(async () => {
    const res = await fetch("/api/chats");
    if (res.ok) setChats(await res.json());
  }, []);

  useEffect(() => {
    refreshChats();
  }, [refreshChats]);

  // Opening a chat attaches its sandbox (spawning one if needed) — takes a few seconds.
  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setDetail(null);
    fetch(`/api/chats/${selectedId}`)
      .then(async (res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  async function newChat() {
    const res = await fetch("/api/chats", { method: "POST" });
    if (!res.ok) return;
    const chat = await res.json();
    await refreshChats();
    setSelectedId(chat.id);
  }

  async function deleteChat(id: string) {
    await fetch(`/api/chats/${id}`, { method: "DELETE" });
    if (selectedId === id) setSelectedId(null);
    await refreshChats();
  }

  return (
    <div className="flex h-screen gap-2 p-2">
      <Sidebar
        chats={chats}
        selectedId={selectedId}
        userEmail={userEmail}
        onSelect={setSelectedId}
        onNew={newChat}
        onDelete={deleteChat}
      />
      {detail ? (
        <main className="flex min-w-0 flex-1 gap-2">
          <ChatPane
            key={detail.chat.id}
            chatId={detail.chat.id}
            initialMessages={detail.messages}
            onFirstMessage={refreshChats}
          />
          <DesktopPane streamUrl={detail.streamUrl} />
        </main>
      ) : (
        <main className="flex flex-1 items-center justify-center rounded-sm border">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner /> Attaching sandbox…
            </div>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No chat selected</EmptyTitle>
                <EmptyDescription>
                  Each chat gets its own cloud desktop. Create one to put the
                  agent to work.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </main>
      )}
    </div>
  );
}
