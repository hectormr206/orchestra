/**
 * Type declarations for Express.js Plugin
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

export async function enhancePlanForExpress(context: PluginContext): Promise<HookResult>;
export async function validateExpressCode(context: PluginContext): Promise<HookResult>;
export async function suggestExpressBestPractices(context: PluginContext): Promise<HookResult>;
export async function configureExpressAuditRules(context: PluginContext): Promise<HookResult>;
