import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { DevServerManager } from "./DevServerManager.js";

// Mock portUtils
vi.mock("../utils/portUtils.js", () => ({
  findAvailablePort: vi.fn().mockResolvedValue(3000),
  parsePort: vi.fn().mockReturnValue(3000),
}));

// Mock child_process - factory must not reference outer variables
vi.mock("child_process", () => ({
  spawn: vi.fn().mockReturnValue({
    stderr: { on: vi.fn() },
    on: vi.fn(),
    kill: vi.fn(),
  }),
}));

describe("DevServerManager", () => {
  let manager: DevServerManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new DevServerManager();

    // Default: waitForReady resolves immediately
    vi.spyOn(manager, "waitForReady").mockResolvedValue(true);
  });

  it("should inject PORT env var with the available port", async () => {
    const { findAvailablePort } = await import("../utils/portUtils.js");
    (findAvailablePort as Mock).mockResolvedValue(3001);

    const { spawn } = await import("child_process");

    await manager.start("npm run dev", "http://localhost:3000");

    expect(spawn).toHaveBeenCalledWith(
      "npm",
      ["run", "dev"],
      expect.objectContaining({
        env: expect.objectContaining({ PORT: "3001" }),
      }),
    );
  });

  it("should return the actual URL with the resolved port", async () => {
    const { findAvailablePort } = await import("../utils/portUtils.js");
    (findAvailablePort as Mock).mockResolvedValue(3001);

    const { parsePort } = await import("../utils/portUtils.js");
    (parsePort as Mock).mockReturnValue(3000);

    const url = await manager.start("npm run dev", "http://localhost:3000");

    expect(url).toBe("http://localhost:3001");
  });

  it("should return original URL when port is unchanged", async () => {
    const { findAvailablePort } = await import("../utils/portUtils.js");
    (findAvailablePort as Mock).mockResolvedValue(3000);

    const { parsePort } = await import("../utils/portUtils.js");
    (parsePort as Mock).mockReturnValue(3000);

    const url = await manager.start("npm run dev", "http://localhost:3000");

    expect(url).toBe("http://localhost:3000");
  });

  it("should call waitForReady with the actual URL", async () => {
    const { findAvailablePort } = await import("../utils/portUtils.js");
    (findAvailablePort as Mock).mockResolvedValue(4000);

    const { parsePort } = await import("../utils/portUtils.js");
    (parsePort as Mock).mockReturnValue(3000);

    await manager.start("npm run dev", "http://localhost:3000");

    expect(manager.waitForReady).toHaveBeenCalledWith(
      "http://localhost:4000",
      30000,
    );
  });

  it("should throw if server fails to start", async () => {
    vi.spyOn(manager, "waitForReady").mockResolvedValue(false);
    vi.spyOn(manager, "stop").mockResolvedValue(undefined);

    await expect(
      manager.start("npm run dev", "http://localhost:3000"),
    ).rejects.toThrow("Dev server failed to start within 30s");
  });

  it("should parse port from appUrl using parsePort", async () => {
    const { parsePort } = await import("../utils/portUtils.js");

    await manager.start("npm run dev", "http://localhost:8080");

    expect(parsePort).toHaveBeenCalledWith("http://localhost:8080");
  });
});
