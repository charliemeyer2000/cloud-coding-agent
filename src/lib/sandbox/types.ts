/**
 * Provider-agnostic sandbox contract (if you wanted, you could implement your own!)
 */

/** Result of a finished foreground command. Non-zero exit codes are returned, not thrown. */
export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface ExecOptions {
  /** Working directory inside the sandbox. Defaults to the sandbox user's home. */
  cwd?: string;
  /** Extra environment variables for this command. */
  env?: Record<string, string>;
  /** Kill the command after this long. Default: 60s. */
  timeoutMs?: number;
}

/** A long-running process started with `execBackground`. */
export interface BackgroundProcess {
  pid: number;
}

/** Accumulated output of a background process. */
export interface ProcessOutput {
  /** Everything the process has written so far (stdout and stderr interleaved). */
  output: string;
  /** Whether the process is still running. */
  running: boolean;
}

export type MouseButton = "left" | "right" | "middle";

export interface ClickOptions {
  /** Default: "left". */
  button?: MouseButton;
  /** Double-click instead of single. Default: false. */
  double?: boolean;
}

export type ScrollDirection = "up" | "down";

export interface ScreenSize {
  width: number;
  height: number;
}

/**
 * Computer-use passthrough to the sandbox desktop.
 *
 * Coordinates are absolute desktop pixels, origin top-left. In practice the
 * agent uses this to drive Chromium, but input events go to whatever is on
 * screen at (x, y).
 */
export interface BrowserControl {
  /** Open a URL in Chromium (launches it if it isn't running yet). */
  goto(url: string): Promise<void>;
  click(x: number, y: number, opts?: ClickOptions): Promise<void>;
  moveMouse(x: number, y: number): Promise<void>;
  drag(from: [number, number], to: [number, number]): Promise<void>;
  /** Type text into the focused element. */
  type(text: string): Promise<void>;
  /** Press a key or key combo, e.g. "enter" or ["ctrl", "a"]. */
  press(key: string | string[]): Promise<void>;
  scroll(direction: ScrollDirection, amount?: number): Promise<void>;
  /** PNG screenshot of the whole desktop. Unlike `exec`, throws if capture fails. */
  screenshot(): Promise<Uint8Array>;
}

/** A live handle to one sandbox. Obtain via `createSandbox` / `attachSandbox`. */
export interface SandboxClient {
  /** Stable ID for this sandbox. Persist it to re-attach later. */
  readonly sandboxId: string;

  /** Run a command to completion. Never throws on non-zero exit. */
  exec(command: string, opts?: ExecOptions): Promise<ExecResult>;

  /** Start a long-running command (e.g. a dev server). Returns immediately. */
  execBackground(
    command: string,
    opts?: Pick<ExecOptions, "cwd" | "env">,
  ): Promise<BackgroundProcess>;

  /** Read everything a background process has written so far. */
  readOutput(pid: number): Promise<ProcessOutput>;

  /** Computer-use control of the desktop / Chromium. */
  readonly browser: BrowserControl;

  /**
   * URL of the live desktop stream, for embedding in an iframe.
   * The first call on a fresh attach (re)starts the stream — invalidating URLs
   * issued by earlier attaches — and later calls on the same client return the
   * same URL. Treat it as one URL per attach.
   */
  getStreamUrl(): Promise<string>;

  /** Desktop resolution in pixels. */
  screenSize(): Promise<ScreenSize>;

  /** Extend the sandbox lifetime to `ms` from now (default: 10 minutes). */
  keepAlive(ms?: number): Promise<void>;

  /** Permanently destroy the sandbox. */
  close(): Promise<void>;
}

export interface CreateSandboxOptions {
  /** Desktop resolution. Default: [1280, 800]. */
  resolution?: [number, number];
  /** Sandbox lifetime from creation. Default: 10 minutes. */
  timeoutMs?: number;
  /** Arbitrary key/value tags attached to the sandbox. */
  metadata?: Record<string, string>;
}
