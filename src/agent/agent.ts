/**
 * The agent. This is the whole baseline harness: a model, four lines of
 * instructions, a handful of tools, and a step cap. The AI SDK's ToolLoopAgent
 * runs the loop (ask model → run tool → repeat).
 *
 * It is deliberately naive — no planning, no recovery, no verification,
 * no memory beyond this turn. Change anything here freely, or delete the
 * file and build your own loop on the sandbox primitives (src/lib/sandbox/types.ts).
 */
import { type InferAgentUIMessage, isStepCount, ToolLoopAgent } from "ai";
import type { SandboxClient } from "@/lib/sandbox";
import { agentModel } from "./model";
import { instructions } from "./prompt";
import { agentTools } from "./tools";

const MAX_STEPS = 15;

export function createAgent(sandbox: SandboxClient) {
  return new ToolLoopAgent({
    model: agentModel(),
    instructions,
    tools: agentTools(sandbox),
    stopWhen: isStepCount(MAX_STEPS),
    providerOptions: {
      // Show your work: stream reasoning so the UI can render it.
      anthropic: { thinking: { type: "enabled", budgetTokens: 4096 } },
    },
  });
}

export type AgentUIMessage = InferAgentUIMessage<
  ReturnType<typeof createAgent>
>;
