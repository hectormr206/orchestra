/**
 * Port utilities for finding available ports and parsing URLs
 */

import { createServer } from "net";

/**
 * Find an available port starting from the given port.
 * Tests ports sequentially until one is available.
 */
export async function findAvailablePort(startPort: number): Promise<number> {
  const isPortAvailable = (port: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const server = createServer();
      server.once("error", () => resolve(false));
      server.once("listening", () => {
        server.close();
        resolve(true);
      });
      server.listen(port);
    });
  };

  let port = startPort;
  while (port < startPort + 100) {
    if (await isPortAvailable(port)) {
      return port;
    }
    port++;
  }
  throw new Error(
    `No available ports found in range ${startPort}-${startPort + 100}`,
  );
}

/**
 * Parse the port number from a URL string.
 * Returns 80 for http and 443 for https when no explicit port is specified.
 */
export function parsePort(url: string): number {
  const parsed = new URL(url);
  if (parsed.port) {
    return parseInt(parsed.port, 10);
  }
  return parsed.protocol === "https:" ? 443 : 80;
}
