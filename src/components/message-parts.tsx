"use client";

import {
  BrainIcon,
  CameraIcon,
  CheckIcon,
  ChevronRightIcon,
  GlobeIcon,
  KeyboardIcon,
  MouseIcon,
  MousePointerClickIcon,
  MoveVerticalIcon,
  SquareChevronRightIcon,
  XIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Streamdown } from "streamdown";
import type { AgentUIMessage } from "@/agent/agent";
import { SCREENSHOT_OMITTED } from "@/agent/constants";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type Part = AgentUIMessage["parts"][number];

export function MessagePart({ part }: { part: Part }) {
  switch (part.type) {
    case "text":
      return (
        <div className="text-sm [&_pre]:text-xs">
          <Streamdown>{part.text}</Streamdown>
        </div>
      );
    case "reasoning":
      return <ReasoningPart part={part} />;
    case "tool-exec":
      return <ExecPart part={part} />;
    case "tool-screenshot":
      return <ScreenshotPart part={part} />;
    case "tool-goto":
      return (
        <ActionPart
          part={part}
          icon={<GlobeIcon className="size-3.5" />}
          label={`goto ${part.input?.url ?? "…"}`}
        />
      );
    case "tool-click":
      return (
        <ActionPart
          part={part}
          icon={<MousePointerClickIcon className="size-3.5" />}
          label={`click ${part.input ? `${part.input.x}, ${part.input.y}` : "…"}`}
        />
      );
    case "tool-type":
      return (
        <ActionPart
          part={part}
          icon={<KeyboardIcon className="size-3.5" />}
          label={`type "${part.input?.text ?? "…"}"`}
        />
      );
    case "tool-press":
      return (
        <ActionPart
          part={part}
          icon={<MouseIcon className="size-3.5" />}
          label={`press ${part.input?.key ?? "…"}`}
        />
      );
    case "tool-scroll":
      return (
        <ActionPart
          part={part}
          icon={<MoveVerticalIcon className="size-3.5" />}
          label={`scroll ${part.input?.direction ?? "…"}`}
        />
      );
    default:
      return null;
  }
}

function ReasoningPart({
  part,
}: {
  part: Extract<Part, { type: "reasoning" }>;
}) {
  const streaming = part.state === "streaming";
  if (!part.text && !streaming) return null;
  return (
    <Collapsible defaultOpen={false} className="group/reasoning">
      <CollapsibleTrigger className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground">
        <BrainIcon className="size-3.5" />
        <span className={cn(streaming && "shimmer")}>
          {streaming ? "Reasoning…" : "Reasoning"}
        </span>
        <ChevronRightIcon className="size-3 transition-transform group-data-[state=open]/reasoning:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1.5 border-l-2 pl-3 text-xs text-muted-foreground [&_p]:my-1">
          <Streamdown>{part.text}</Streamdown>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ExecPart({ part }: { part: Extract<Part, { type: "tool-exec" }> }) {
  const output = part.state === "output-available" ? part.output : undefined;
  const failed =
    part.state === "output-error" ||
    (output !== undefined && output.exitCode !== 0);
  const outputText =
    part.state === "output-error"
      ? part.errorText
      : output && [output.stdout, output.stderr].filter(Boolean).join("\n");
  return (
    <ToolRow
      icon={<SquareChevronRightIcon className="size-3.5" />}
      running={isRunning(part)}
      failed={failed}
    >
      <Collapsible className="min-w-0 flex-1">
        <CollapsibleTrigger className="block max-w-full truncate text-left hover:text-foreground">
          $ {part.input?.command ?? "…"}
          {output && ` → exit ${output.exitCode}`}
        </CollapsibleTrigger>
        <CollapsibleContent>
          {outputText ? (
            <pre className="scroll-fade mt-1 max-h-48 overflow-y-auto rounded-sm bg-muted p-2 text-xs whitespace-pre-wrap">
              {outputText}
            </pre>
          ) : (
            <div className="mt-1 text-xs italic opacity-70">no output</div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </ToolRow>
  );
}

function ScreenshotPart({
  part,
}: {
  part: Extract<Part, { type: "tool-screenshot" }>;
}) {
  const image =
    part.state === "output-available" ? part.output.image : undefined;
  const hasImage = image !== undefined && image !== SCREENSHOT_OMITTED;
  return (
    <ToolRow
      icon={<CameraIcon className="size-3.5" />}
      running={isRunning(part)}
      failed={part.state === "output-error"}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span>screenshot</span>
        {hasImage && (
          // biome-ignore lint/performance/noImgElement: data URI — next/image can't optimize it
          <img
            src={`data:image/png;base64,${image}`}
            alt="Sandbox screenshot"
            className="max-h-44 w-fit rounded-sm border"
          />
        )}
      </div>
    </ToolRow>
  );
}

function ActionPart({
  part,
  icon,
  label,
}: {
  part: Part & { state?: string };
  icon: ReactNode;
  label: string;
}) {
  return (
    <ToolRow
      icon={icon}
      running={isRunning(part)}
      failed={part.state === "output-error"}
    >
      <span className="truncate">{label}</span>
    </ToolRow>
  );
}

function isRunning(part: { state?: string }): boolean {
  return part.state === "input-streaming" || part.state === "input-available";
}

function ToolRow({
  icon,
  running,
  failed,
  children,
}: {
  icon: ReactNode;
  running: boolean;
  failed: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2 font-mono text-xs text-muted-foreground">
      <span className="mt-0.5 shrink-0">{icon}</span>
      {children}
      <span className="mt-0.5 ml-auto shrink-0">
        {running ? (
          <Spinner className="size-3.5" />
        ) : failed ? (
          <XIcon className="size-3.5 text-destructive" />
        ) : (
          <CheckIcon className="size-3.5" />
        )}
      </span>
    </div>
  );
}
