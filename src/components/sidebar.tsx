"use client";

import { MessageSquarePlusIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import type { ChatSummary } from "./app";
import { Panel, PanelHeader } from "./panels";

export function Sidebar({
  chats,
  selectedId,
  userEmail,
  onSelect,
  onNew,
  onDelete,
}: {
  chats: ChatSummary[];
  selectedId: string | null;
  userEmail: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();

  return (
    <Panel className="w-60 shrink-0">
      <PanelHeader>Chats</PanelHeader>
      <div className="p-2">
        <Button variant="outline" size="sm" className="w-full" onClick={onNew}>
          <MessageSquarePlusIcon data-icon="inline-start" />
          New chat
        </Button>
      </div>
      <div className="scroll-fade flex-1 overflow-y-auto px-2">
        <ul className="flex flex-col gap-0.5">
          {chats.map((chat) => (
            <li key={chat.id} className="group relative">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start pr-7 font-normal",
                  chat.id === selectedId && "bg-accent text-accent-foreground",
                )}
                onClick={() => onSelect(chat.id)}
              >
                <span className="truncate">{chat.title}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete chat"
                className="absolute top-1/2 right-0.5 size-6 -translate-y-1/2 text-muted-foreground opacity-0 group-hover:opacity-100"
                onClick={() => onDelete(chat.id)}
              >
                <XIcon />
              </Button>
            </li>
          ))}
        </ul>
      </div>
      <Separator />
      <div className="flex items-center justify-between gap-2 p-2">
        <span className="truncate text-xs text-muted-foreground">
          {userEmail}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-xs"
          onClick={() => authClient.signOut().then(() => router.push("/login"))}
        >
          Sign out
        </Button>
      </div>
    </Panel>
  );
}
