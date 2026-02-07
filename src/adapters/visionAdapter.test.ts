import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  KimiVisionAdapter,
  GLMVisionAdapter,
  FallbackVisionAdapter,
  type VisionAdapter,
} from "./VisionAdapter.js";
import type { VisionExecuteOptions } from "../types.js";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("KimiVisionAdapter", () => {
  let adapter: KimiVisionAdapter;

  beforeEach(() => {
    vi.stubEnv("KIMI_API_KEY", "sk-kimi-test-key");
    adapter = new KimiVisionAdapter();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should report unavailable when KIMI_API_KEY is missing", async () => {
    vi.stubEnv("KIMI_API_KEY", "");
    const adapterNoKey = new KimiVisionAdapter();
    expect(await adapterNoKey.isAvailable()).toBe(false);
  });

  it("should report available when KIMI_API_KEY is set", async () => {
    expect(await adapter.isAvailable()).toBe(true);
  });

  it("should return correct info", () => {
    const info = adapter.getInfo();
    expect(info.name).toBe("KimiVision");
    expect(info.model).toBe("kimi-k2.5");
    expect(info.provider).toBe("moonshot");
  });

  it("should return error when API key is missing", async () => {
    vi.stubEnv("KIMI_API_KEY", "");
    const adapterNoKey = new KimiVisionAdapter();
    const result = await adapterNoKey.analyzeScreenshot({
      prompt: "test",
      images: [{ data: "abc", mimeType: "image/png" }],
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("KIMI_API_KEY");
  });

  it("should send correct request format", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"status":"APPROVED"}' } }],
        usage: { total_tokens: 100 },
      }),
    });

    const options: VisionExecuteOptions = {
      prompt: "Analyze this screenshot",
      images: [{ data: "base64data", mimeType: "image/png" }],
      maxTokens: 2048,
    };

    await adapter.analyzeScreenshot(options);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, reqOptions] = mockFetch.mock.calls[0];
    expect(url).toContain("moonshot.ai");

    const body = JSON.parse(reqOptions.body);
    expect(body.model).toBe("kimi-k2.5");
    expect(body.messages[0].content).toHaveLength(2);
    expect(body.messages[0].content[0].type).toBe("text");
    expect(body.messages[0].content[1].type).toBe("image_url");
    expect(body.messages[0].content[1].image_url.url).toContain("data:image/png;base64,base64data");
    expect(body.max_tokens).toBe(2048);
  });

  it("should handle successful response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Analysis result" } }],
        usage: { total_tokens: 150 },
      }),
    });

    const result = await adapter.analyzeScreenshot({
      prompt: "test",
      images: [{ data: "abc", mimeType: "image/png" }],
    });

    expect(result.success).toBe(true);
    expect(result.response).toBe("Analysis result");
    expect(result.tokensUsed).toBe(150);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it("should handle API error response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => "Rate limit exceeded",
    });

    const result = await adapter.analyzeScreenshot({
      prompt: "test",
      images: [{ data: "abc", mimeType: "image/png" }],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("429");
    expect(result.error).toContain("Rate limit");
  });

  it("should handle network errors", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await adapter.analyzeScreenshot({
      prompt: "test",
      images: [{ data: "abc", mimeType: "image/png" }],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Network error");
  });
});

describe("GLMVisionAdapter", () => {
  let adapter: GLMVisionAdapter;

  beforeEach(() => {
    vi.stubEnv("ZAI_API_KEY", "zai-test-key");
    adapter = new GLMVisionAdapter();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should report available when ZAI_API_KEY is set", async () => {
    expect(await adapter.isAvailable()).toBe(true);
  });

  it("should return correct info", () => {
    const info = adapter.getInfo();
    expect(info.name).toBe("GLMVision");
    expect(info.model).toBe("glm-4.6v");
    expect(info.provider).toBe("zai");
  });

  it("should send request to z.ai endpoint", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "GLM analysis" } }],
        usage: { total_tokens: 200 },
      }),
    });

    await adapter.analyzeScreenshot({
      prompt: "test",
      images: [{ data: "abc", mimeType: "image/jpeg" }],
    });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("z.ai");
  });
});

describe("FallbackVisionAdapter", () => {
  it("should try adapters in order", async () => {
    const mockAdapter1: VisionAdapter = {
      isAvailable: vi.fn().mockResolvedValue(true),
      analyzeScreenshot: vi.fn().mockResolvedValue({
        success: false,
        response: "",
        duration: 0,
        error: "First adapter failed",
      }),
      getInfo: () => ({ name: "Mock1", model: "mock-1", provider: "test" }),
    };

    const mockAdapter2: VisionAdapter = {
      isAvailable: vi.fn().mockResolvedValue(true),
      analyzeScreenshot: vi.fn().mockResolvedValue({
        success: true,
        response: "Success from adapter 2",
        duration: 100,
      }),
      getInfo: () => ({ name: "Mock2", model: "mock-2", provider: "test" }),
    };

    const fallback = new FallbackVisionAdapter([mockAdapter1, mockAdapter2]);
    const result = await fallback.analyzeScreenshot({
      prompt: "test",
      images: [{ data: "abc", mimeType: "image/png" }],
    });

    expect(result.success).toBe(true);
    expect(result.response).toBe("Success from adapter 2");
    expect(mockAdapter1.analyzeScreenshot).toHaveBeenCalled();
    expect(mockAdapter2.analyzeScreenshot).toHaveBeenCalled();
  });

  it("should skip unavailable adapters", async () => {
    const unavailable: VisionAdapter = {
      isAvailable: vi.fn().mockResolvedValue(false),
      analyzeScreenshot: vi.fn(),
      getInfo: () => ({ name: "Unavailable", model: "none", provider: "test" }),
    };

    const available: VisionAdapter = {
      isAvailable: vi.fn().mockResolvedValue(true),
      analyzeScreenshot: vi.fn().mockResolvedValue({
        success: true,
        response: "OK",
        duration: 50,
      }),
      getInfo: () => ({ name: "Available", model: "avail", provider: "test" }),
    };

    const fallback = new FallbackVisionAdapter([unavailable, available]);
    const result = await fallback.analyzeScreenshot({
      prompt: "test",
      images: [{ data: "abc", mimeType: "image/png" }],
    });

    expect(result.success).toBe(true);
    expect(unavailable.analyzeScreenshot).not.toHaveBeenCalled();
  });

  it("should return error when all adapters fail", async () => {
    const failing: VisionAdapter = {
      isAvailable: vi.fn().mockResolvedValue(true),
      analyzeScreenshot: vi.fn().mockResolvedValue({
        success: false,
        response: "",
        duration: 0,
        error: "All failed",
      }),
      getInfo: () => ({ name: "Failing", model: "fail", provider: "test" }),
    };

    const fallback = new FallbackVisionAdapter([failing]);
    const result = await fallback.analyzeScreenshot({
      prompt: "test",
      images: [{ data: "abc", mimeType: "image/png" }],
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("All failed");
  });

  it("should report available if any adapter is available", async () => {
    const unavailable: VisionAdapter = {
      isAvailable: vi.fn().mockResolvedValue(false),
      analyzeScreenshot: vi.fn(),
      getInfo: () => ({ name: "Unavail", model: "u", provider: "t" }),
    };
    const available: VisionAdapter = {
      isAvailable: vi.fn().mockResolvedValue(true),
      analyzeScreenshot: vi.fn(),
      getInfo: () => ({ name: "Avail", model: "a", provider: "t" }),
    };

    const fallback = new FallbackVisionAdapter([unavailable, available]);
    expect(await fallback.isAvailable()).toBe(true);
  });

  it("should report unavailable if no adapter is available", async () => {
    const unavailable: VisionAdapter = {
      isAvailable: vi.fn().mockResolvedValue(false),
      analyzeScreenshot: vi.fn(),
      getInfo: () => ({ name: "Unavail", model: "u", provider: "t" }),
    };

    const fallback = new FallbackVisionAdapter([unavailable]);
    expect(await fallback.isAvailable()).toBe(false);
  });
});
