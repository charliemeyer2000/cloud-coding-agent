/**
 * E2B Desktop implementation of the SandboxClient contract.
 */
import {
  CommandExitError,
  NotFoundError,
  Sandbox,
  TimeoutError,
} from "@e2b/desktop";
import type {
  BackgroundProcess,
  BrowserControl,
  ClickOptions,
  CreateSandboxOptions,
  ExecOptions,
  ExecResult,
  ProcessOutput,
  SandboxClient,
  ScreenSize,
  ScrollDirection,
} from "./types";

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;
const DEFAULT_RESOLUTION: [number, number] = [1280, 800];

/** Where a background process's output lands (E2B runs commands as `bash -c`, so `$$` = its pid). */
const procLog = (pid: number | "$$") => `/tmp/proc-${pid}.log`;

/** Quote a string for safe interpolation into a shell command. */
function shq(s: string): string {
  return `'${s.replaceAll("'", `'\\''`)}'`;
}

export class E2BSandboxClient implements SandboxClient {
  readonly browser: BrowserControl;
  private streamUrl: string | null = null;

  private constructor(private readonly sandbox: Sandbox) {
    this.browser = new E2BBrowserControl(this.sandbox);
  }

  static async create(opts?: CreateSandboxOptions): Promise<E2BSandboxClient> {
    requireApiKey();
    const sandbox = await Sandbox.create({
      resolution: opts?.resolution ?? DEFAULT_RESOLUTION,
      timeoutMs: opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      lifecycle: { onTimeout: "pause" }, // allows resuming the sandbox
      metadata: opts?.metadata,
    });
    return new E2BSandboxClient(sandbox);
  }

  static async attach(sandboxId: string): Promise<E2BSandboxClient> {
    requireApiKey();
    const sandbox = await Sandbox.connect(sandboxId, {
      timeoutMs: DEFAULT_TIMEOUT_MS,
    });
    return new E2BSandboxClient(sandbox);
  }

  static async destroy(sandboxId: string): Promise<void> {
    requireApiKey();
    await Sandbox.kill(sandboxId);
  }

  get sandboxId(): string {
    return this.sandbox.sandboxId;
  }

  async exec(command: string, opts?: ExecOptions): Promise<ExecResult> {
    try {
      const result = await this.sandbox.commands.run(command, {
        cwd: opts?.cwd,
        envs: opts?.env,
        timeoutMs: opts?.timeoutMs,
      });
      return {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
      };
    } catch (err) {
      if (err instanceof CommandExitError) {
        return {
          stdout: err.stdout,
          stderr: err.stderr,
          exitCode: err.exitCode,
        };
      }
      if (err instanceof TimeoutError) {
        return {
          stdout: "",
          stderr: `Command timed out: ${command}`,
          exitCode: 124,
        };
      }
      throw err;
    }
  }

  async execBackground(
    command: string,
    opts?: Pick<ExecOptions, "cwd" | "env">,
  ): Promise<BackgroundProcess> {
    // The SDK runs background commands server-side (they outlive this request),
    // but its handle can't replay output that streamed while nobody was
    // connected — so redirect everything to a file named after the pid, where
    // readOutput can always find it.
    const handle = await this.sandbox.commands.run(
      `exec > ${procLog("$$")} 2>&1\n${command}`,
      { background: true, timeoutMs: 0, cwd: opts?.cwd, envs: opts?.env },
    );
    await handle.disconnect();
    return { pid: handle.pid };
  }

  async readOutput(pid: number): Promise<ProcessOutput> {
    const running = (await this.sandbox.commands.list()).some(
      (p) => p.pid === pid,
    );
    try {
      const output = await this.sandbox.files.read(procLog(pid), {
        format: "text",
      });
      return { output, running };
    } catch (err) {
      // No log yet: either the process is a moment from creating it (still
      // running) or the pid was never one of ours (not running).
      if (err instanceof NotFoundError) return { output: "", running };
      throw err;
    }
  }

  async getStreamUrl(): Promise<string> {
    if (this.streamUrl) return this.streamUrl;
    // Restart VNC server to get a fresh URL
    await this.exec(
      "pkill x11vnc; pkill -f novnc_proxy; pkill -f websockify; true",
    );
    await this.sandbox.stream.start({ requireAuth: true });
    this.streamUrl = this.sandbox.stream.getUrl({
      authKey: this.sandbox.stream.getAuthKey(),
    });
    return this.streamUrl;
  }

  async screenSize(): Promise<ScreenSize> {
    return this.sandbox.getScreenSize();
  }

  async keepAlive(ms: number = DEFAULT_TIMEOUT_MS): Promise<void> {
    await this.sandbox.setTimeout(ms);
  }

  async close(): Promise<void> {
    await this.sandbox.kill();
  }
}

class E2BBrowserControl implements BrowserControl {
  constructor(private readonly sandbox: Sandbox) {}

  async goto(url: string): Promise<void> {
    // Invoke the chrome binary directly: the SDK's launch("google-chrome", url)
    // drops the URL (gtk-launch quirk, verified empirically), and the flags
    // suppress dialogs that would otherwise block the agent (crash-restore
    // bubble after a pause/kill, default-browser prompt). Opens a new tab if
    // Chrome is already running. Returns once a Chrome window is visible; the
    // page itself may still be loading.
    await this.sandbox.commands.run(
      `google-chrome --no-first-run --no-default-browser-check --disable-session-crashed-bubble --hide-crash-restore-bubble --start-maximized ${shq(url)}`,
      { background: true, timeoutMs: 0 },
    );
    await this.sandbox.waitAndVerify(
      "xdotool search --onlyvisible --class google-chrome || true",
      (r) => r.stdout.trim() !== "",
      15,
      0.5,
    );
    await this.sandbox.wait(1000);
  }

  async click(x: number, y: number, opts?: ClickOptions): Promise<void> {
    const button = { left: 1, middle: 2, right: 3 }[opts?.button ?? "left"];
    await this.sandbox.moveMouse(x, y);
    await this.sandbox.commands.run(
      `xdotool click ${opts?.double ? "--repeat 2 --delay 100 " : ""}${button}`,
    );
  }

  async moveMouse(x: number, y: number): Promise<void> {
    await this.sandbox.moveMouse(x, y);
  }

  async drag(from: [number, number], to: [number, number]): Promise<void> {
    await this.sandbox.drag(from, to);
  }

  async type(text: string): Promise<void> {
    await this.sandbox.write(text);
  }

  async press(key: string | string[]): Promise<void> {
    await this.sandbox.press(key);
  }

  async scroll(direction: ScrollDirection, amount = 3): Promise<void> {
    await this.sandbox.scroll(direction, amount);
  }

  async screenshot(): Promise<Uint8Array> {
    // Not sandbox.screenshot(): its unawaited temp-file cleanup crashes node
    // if the sandbox dies mid-flight (bug present as of @e2b/desktop 2.3.1).
    const path = `/tmp/screenshot-${Math.random().toString(36).slice(2)}.png`;
    await this.sandbox.commands.run(`scrot --pointer ${path}`);
    const png = await this.sandbox.files.read(path, { format: "bytes" });
    await this.sandbox.files.remove(path);
    return png;
  }
}

function requireApiKey(): void {
  if (!process.env.E2B_API_KEY) {
    throw new Error(
      "E2B_API_KEY is not set. Copy .env.example to .env.local and fill it in.",
    );
  }
}
