import { describe, it, expect, vi, afterEach } from "vitest";
import { createServer, type Server } from "net";
import { findAvailablePort, parsePort } from "./portUtils.js";

describe("portUtils", () => {
  describe("findAvailablePort", () => {
    it("should return the start port when it is available", async () => {
      const port = await findAvailablePort(19876);
      expect(port).toBe(19876);
    });

    it("should skip occupied ports and return the next available one", async () => {
      // Occupy a port
      const server = createServer();
      await new Promise<void>((resolve) => {
        server.listen(19877, () => resolve());
      });

      try {
        const port = await findAvailablePort(19877);
        expect(port).toBeGreaterThan(19877);
      } finally {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });

    it("should throw when no ports are available in range", async () => {
      // Occupy a block of ports to force the error
      const servers: Server[] = [];
      const basePort = 19900;
      try {
        for (let i = 0; i < 100; i++) {
          const server = createServer();
          await new Promise<void>((resolve, reject) => {
            server.once("error", reject);
            server.listen(basePort + i, () => resolve());
          });
          servers.push(server);
        }

        await expect(findAvailablePort(basePort)).rejects.toThrow(
          /No available ports found in range/,
        );
      } finally {
        await Promise.all(
          servers.map(
            (s) => new Promise<void>((resolve) => s.close(() => resolve())),
          ),
        );
      }
    }, 15000);
  });

  describe("parsePort", () => {
    it("should extract port from URL with explicit port", () => {
      expect(parsePort("http://localhost:3000")).toBe(3000);
    });

    it("should extract port from URL with different port", () => {
      expect(parsePort("http://localhost:8080")).toBe(8080);
    });

    it("should return 80 for http URL without explicit port", () => {
      expect(parsePort("http://localhost")).toBe(80);
    });

    it("should return 443 for https URL without explicit port", () => {
      expect(parsePort("https://localhost")).toBe(443);
    });

    it("should handle URLs with paths", () => {
      expect(parsePort("http://localhost:5173/app")).toBe(5173);
    });
  });
});
