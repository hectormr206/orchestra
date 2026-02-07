/**
 * Vision Adapter - HTTP-direct adapter for multimodal Vision APIs
 *
 * Uses Kimi k2.5 Vision and GLM-4.6V APIs directly (OpenAI-compatible format)
 * for screenshot analysis. Bypasses the CLI since it doesn't support image input.
 */

import type { VisionExecuteOptions, VisionResult } from "../types.js";

export interface VisionAdapter {
  analyzeScreenshot(options: VisionExecuteOptions): Promise<VisionResult>;
  isAvailable(): Promise<boolean>;
  getInfo(): { name: string; model: string; provider: string };
}

export class KimiVisionAdapter implements VisionAdapter {
  private apiKey: string;
  private baseUrl = "https://api.moonshot.ai/v1/chat/completions";
  private model = "kimi-k2.5";

  constructor() {
    this.apiKey = process.env.KIMI_API_KEY || "";
  }

  async analyzeScreenshot(options: VisionExecuteOptions): Promise<VisionResult> {
    const startTime = Date.now();

    if (!this.apiKey) {
      return {
        success: false,
        response: "",
        duration: 0,
        error: "KIMI_API_KEY not configured",
      };
    }

    try {
      const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
        { type: "text", text: options.prompt },
      ];

      for (const image of options.images) {
        content.push({
          type: "image_url",
          image_url: {
            url: `data:${image.mimeType};base64,${image.data}`,
          },
        });
      }

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: "user", content }],
          max_tokens: options.maxTokens || 4096,
        }),
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorBody = await response.text();
        return {
          success: false,
          response: "",
          duration,
          error: `Kimi Vision API error ${response.status}: ${errorBody.substring(0, 200)}`,
        };
      }

      const data = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { total_tokens?: number };
      };

      const responseText = data.choices?.[0]?.message?.content || "";
      const tokensUsed = data.usage?.total_tokens;

      return {
        success: true,
        response: responseText,
        duration,
        tokensUsed,
      };
    } catch (error) {
      return {
        success: false,
        response: "",
        duration: Date.now() - startTime,
        error: `Kimi Vision request failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  getInfo() {
    return { name: "KimiVision", model: "kimi-k2.5", provider: "moonshot" };
  }
}

export class GLMVisionAdapter implements VisionAdapter {
  private apiKey: string;
  private baseUrl = "https://api.z.ai/api/openai/v1/chat/completions";
  private model = "glm-4.6v";

  constructor() {
    this.apiKey = process.env.ZAI_API_KEY || "";
  }

  async analyzeScreenshot(options: VisionExecuteOptions): Promise<VisionResult> {
    const startTime = Date.now();

    if (!this.apiKey) {
      return {
        success: false,
        response: "",
        duration: 0,
        error: "ZAI_API_KEY not configured",
      };
    }

    try {
      const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
        { type: "text", text: options.prompt },
      ];

      for (const image of options.images) {
        content.push({
          type: "image_url",
          image_url: {
            url: `data:${image.mimeType};base64,${image.data}`,
          },
        });
      }

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: "user", content }],
          max_tokens: options.maxTokens || 4096,
        }),
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorBody = await response.text();
        return {
          success: false,
          response: "",
          duration,
          error: `GLM Vision API error ${response.status}: ${errorBody.substring(0, 200)}`,
        };
      }

      const data = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { total_tokens?: number };
      };

      const responseText = data.choices?.[0]?.message?.content || "";
      const tokensUsed = data.usage?.total_tokens;

      return {
        success: true,
        response: responseText,
        duration,
        tokensUsed,
      };
    } catch (error) {
      return {
        success: false,
        response: "",
        duration: Date.now() - startTime,
        error: `GLM Vision request failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  getInfo() {
    return { name: "GLMVision", model: "glm-4.6v", provider: "zai" };
  }
}

export class FallbackVisionAdapter implements VisionAdapter {
  private adapters: VisionAdapter[];

  constructor(adapters?: VisionAdapter[]) {
    this.adapters = adapters || [
      new KimiVisionAdapter(),
      new GLMVisionAdapter(),
    ];
  }

  async analyzeScreenshot(options: VisionExecuteOptions): Promise<VisionResult> {
    let lastError = "";

    for (const adapter of this.adapters) {
      if (!(await adapter.isAvailable())) {
        lastError = `${adapter.getInfo().name} not available`;
        continue;
      }

      const result = await adapter.analyzeScreenshot(options);
      if (result.success) {
        return result;
      }

      lastError = result.error || "Unknown error";
    }

    return {
      success: false,
      response: "",
      duration: 0,
      error: lastError || "No vision adapters available",
    };
  }

  async isAvailable(): Promise<boolean> {
    for (const adapter of this.adapters) {
      if (await adapter.isAvailable()) {
        return true;
      }
    }
    return false;
  }

  getInfo() {
    for (const adapter of this.adapters) {
      return {
        name: "FallbackVision",
        model: adapter.getInfo().model,
        provider: `${adapter.getInfo().provider} (with fallback)`,
      };
    }
    return { name: "FallbackVision", model: "none", provider: "none" };
  }
}
