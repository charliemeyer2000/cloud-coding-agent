"use client";

import { MonitorIcon } from "lucide-react";
import { Panel, PanelHeader } from "./panels";

export function DesktopPane({ streamUrl }: { streamUrl: string }) {
  return (
    <Panel className="flex-[1.4] min-w-100">
      <PanelHeader>
        <MonitorIcon className="size-3.5" />
        Desktop
        <span className="ml-auto font-normal normal-case opacity-50">live</span>
      </PanelHeader>
      <iframe
        src={streamUrl}
        title="Sandbox desktop"
        className="size-full border-0 bg-black"
        allow="clipboard-read; clipboard-write"
      />
    </Panel>
  );
}
