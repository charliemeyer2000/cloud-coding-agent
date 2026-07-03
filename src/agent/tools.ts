/**
 * The agent's tools — thin bindings from the LLM to the sandbox primitives
 * (see src/lib/sandbox/types.ts). One tool per primitive, nothing clever. Add, split,
 * or reshape these freely; the interface underneath doesn't care.
 */
import { tool } from "ai";
import { z } from "zod";
import type { SandboxClient } from "@/lib/sandbox";
import { SCREENSHOT_OMITTED } from "./constants";

const MAX_OUTPUT_CHARS = 4000;

function truncate(s: string): string {
  return s.length > MAX_OUTPUT_CHARS
    ? `${s.slice(0, MAX_OUTPUT_CHARS)}\n...[truncated]`
    : s;
}

export function agentTools(sandbox: SandboxClient) {
  return {
    exec: tool({
      description:
        "Run a shell command in the sandbox and wait for it to finish.",
      inputSchema: z.object({
        command: z.string().describe("The shell command to run"),
      }),
      execute: async ({ command }) => {
        const { stdout, stderr, exitCode } = await sandbox.exec(command);
        return {
          stdout: truncate(stdout),
          stderr: truncate(stderr),
          exitCode,
        };
      },
    }),

    screenshot: tool({
      description: "Take a screenshot to see the current state of the screen.",
      inputSchema: z.object({}),
      execute: async () => {
        const png = await sandbox.browser.screenshot();
        return { image: Buffer.from(png).toString("base64") };
      },
      // Sends the image to the model. Older screenshots are stripped before
      // they're persisted, so restored chats see the placeholder text instead
      // — the baseline agent has no memory beyond the current turn's screen.
      toModelOutput: ({ output }) =>
        output.image === SCREENSHOT_OMITTED
          ? {
              type: "text",
              value:
                "(screenshot from an earlier session, no longer available)",
            }
          : {
              type: "content",
              value: [
                {
                  type: "file",
                  mediaType: "image/png",
                  data: { type: "data", data: output.image },
                },
              ],
            },
    }),

    goto: tool({
      description: "Open a URL in Chrome.",
      inputSchema: z.object({ url: z.string() }),
      execute: async ({ url }) => {
        await sandbox.browser.goto(url);
        return { ok: true };
      },
    }),

    click: tool({
      description: "Click at pixel coordinates on the screen.",
      inputSchema: z.object({ x: z.number(), y: z.number() }),
      execute: async ({ x, y }) => {
        await sandbox.browser.click(x, y);
        return { ok: true };
      },
    }),

    type: tool({
      description: "Type text into the focused element.",
      inputSchema: z.object({ text: z.string() }),
      execute: async ({ text }) => {
        await sandbox.browser.type(text);
        return { ok: true };
      },
    }),

    press: tool({
      description: 'Press a key or key combo, e.g. "enter" or "ctrl+l".',
      inputSchema: z.object({ key: z.string() }),
      execute: async ({ key }) => {
        await sandbox.browser.press(key.split("+"));
        return { ok: true };
      },
    }),

    scroll: tool({
      description: "Scroll the screen up or down.",
      inputSchema: z.object({ direction: z.enum(["up", "down"]) }),
      execute: async ({ direction }) => {
        await sandbox.browser.scroll(direction);
        return { ok: true };
      },
    }),
  };
}
