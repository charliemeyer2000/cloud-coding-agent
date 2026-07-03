/**
 * The LLM behind the agent. Swap providers here (and only here):
 * install a different @ai-sdk/* provider and change one line.
 * The model id comes from AGENT_MODEL in .env.local.
 */
import { anthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";

export function agentModel(): LanguageModel {
  return anthropic(process.env.AGENT_MODEL ?? "claude-sonnet-4-5");
}
