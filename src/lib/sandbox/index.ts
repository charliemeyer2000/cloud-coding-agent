/**
 * Sandbox layer — public API surface.
 */
import { E2BSandboxClient } from "./e2b";
import type { CreateSandboxOptions, SandboxClient } from "./types";

export type * from "./types";

export function createSandbox(
  opts?: CreateSandboxOptions,
): Promise<SandboxClient> {
  return E2BSandboxClient.create(opts);
}

export function attachSandbox(sandboxId: string): Promise<SandboxClient> {
  return E2BSandboxClient.attach(sandboxId);
}

export function destroySandbox(sandboxId: string): Promise<void> {
  return E2BSandboxClient.destroy(sandboxId);
}
