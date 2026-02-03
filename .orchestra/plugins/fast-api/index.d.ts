/**
 * Type declarations for FastAPI Plugin
 */

export interface PluginContext {
  sessionId: string;
  task: string;
  phase: string;
  config: any;
  metadata: Record<string, any>;
}

export interface HookResult {
  success: boolean;
  data?: any;
  error?: string;
  stopPropagation?: boolean;
}

export async function enhancePlanForFastAPI(context: PluginContext): Promise<HookResult>;
export async function validateFastAPICode(context: PluginContext): Promise<HookResult>;
export async function suggestFastAPIBestPractices(context: PluginContext): Promise<HookResult>;
export async function configureFastAPIAuditRules(context: PluginContext): Promise<HookResult>;
