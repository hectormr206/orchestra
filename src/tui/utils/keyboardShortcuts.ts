/**
 * Keyboard Shortcuts - System for managing TUI keyboard shortcuts
 *
 * Provides:
 * - Global keyboard shortcuts
 * - Context-specific shortcuts
 * - Customizable keybindings
 * - Help display
 * - Shortcut conflict detection
 */

import { Key } from 'ink';

export interface Shortcut {
  key: string;
  description: string;
  action: () => void | Promise<void>;
  context?: string; // If undefined, applies globally
  hidden?: boolean; // If true, don't show in help
}

export interface ShortcutContext {
  name: string;
  description: string;
  shortcuts: Shortcut[];
}

export type KeyMap = Map<string, Shortcut>;

/**
 * Keyboard Shortcut Manager
 */
export class KeyboardShortcutManager {
  private globalShortcuts: KeyMap = new Map();
  private contextShortcuts: Map<string, KeyMap> = new Map();
  private currentContexts: Set<string> = new Set();
  private conflictResolver: ((conflicts: Shortcut[]) => Shortcut) | null = null;

  /**
   * Register a global shortcut
   */
  registerGlobal(shortcut: Shortcut): void {
    const key = this.normalizeKey(shortcut.key);

    // Check for conflicts
    if (this.globalShortcuts.has(key)) {
      console.warn(`Shortcut conflict: ${key} is already registered globally`);
    }

    this.globalShortcuts.set(key, shortcut);
  }

  /**
   * Register a context-specific shortcut
   */
  registerContext(context: string, shortcut: Shortcut): void {
    const key = this.normalizeKey(shortcut.key);

    if (!this.contextShortcuts.has(context)) {
      this.contextShortcuts.set(context, new Map());
    }

    const contextMap = this.contextShortcuts.get(context)!;

    if (contextMap.has(key)) {
      console.warn(`Shortcut conflict: ${key} is already registered in context ${context}`);
    }

    contextMap.set(key, shortcut);
  }

  /**
   * Enter a context
   */
  enterContext(context: string): void {
    this.currentContexts.add(context);
  }

  /**
   * Exit a context
   */
  exitContext(context: string): void {
    this.currentContexts.delete(context);
  }

  /**
   * Clear all contexts
   */
  clearContexts(): void {
    this.currentContexts.clear();
  }

  /**
   * Handle a key press
   */
  async handleKey(input: Key, rawInput?: string): Promise<boolean> {
    const key = this.normalizeKeyEvent(input, rawInput);

    // Check context shortcuts first (most recent context has priority)
    for (const context of Array.from(this.currentContexts).reverse()) {
      const contextMap = this.contextShortcuts.get(context);
      if (contextMap?.has(key)) {
        const shortcut = contextMap.get(key)!;
        await shortcut.action();
        return true;
      }
    }

    // Check global shortcuts
    if (this.globalShortcuts.has(key)) {
      const shortcut = this.globalShortcuts.get(key)!;
      await shortcut.action();
      return true;
    }

    return false;
  }

  /**
   * Get all active shortcuts for display
   */
  getActiveShortcuts(): Shortcut[] {
    const shortcuts: Shortcut[] = [];

    // Add global shortcuts
    for (const shortcut of this.globalShortcuts.values()) {
      if (!shortcut.hidden) {
        shortcuts.push(shortcut);
      }
    }

    // Add context shortcuts
    for (const context of this.currentContexts) {
      const contextMap = this.contextShortcuts.get(context);
      if (contextMap) {
        for (const shortcut of contextMap.values()) {
          if (!shortcut.hidden) {
            shortcuts.push({ ...shortcut, context });
          }
        }
      }
    }

    return shortcuts;
  }

  /**
   * Get shortcuts for a specific context
   */
  getContextShortcuts(context: string): Shortcut[] {
    const contextMap = this.contextShortcuts.get(context);
    if (!contextMap) {
      return [];
    }

    return Array.from(contextMap.values()).filter(s => !s.hidden);
  }

  /**
   * Check if a key combination is available
   */
  isKeyAvailable(key: string, context?: string): boolean {
    const normalizedKey = this.normalizeKey(key);

    // Check global shortcuts
    if (this.globalShortcuts.has(normalizedKey)) {
      return false;
    }

    // Check context shortcuts
    if (context) {
      const contextMap = this.contextShortcuts.get(context);
      if (contextMap?.has(normalizedKey)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Unregister a shortcut
   */
  unregister(key: string, context?: string): boolean {
    const normalizedKey = this.normalizeKey(key);

    if (context) {
      const contextMap = this.contextShortcuts.get(context);
      return contextMap?.delete(normalizedKey) || false;
    } else {
      return this.globalShortcuts.delete(normalizedKey);
    }
  }

  /**
   * Clear all shortcuts
   */
  clearAll(): void {
    this.globalShortcuts.clear();
    this.contextShortcuts.clear();
    this.currentContexts.clear();
  }

  /**
   * Set conflict resolver
   */
  setConflictResolver(resolver: (conflicts: Shortcut[]) => Shortcut): void {
    this.conflictResolver = resolver;
  }

  /**
   * Detect shortcut conflicts
   */
  detectConflicts(): Array<{ key: string; conflicts: Shortcut[] }> {
    const conflicts: Array<{ key: string; conflicts: Shortcut[] }> = [];
    const allKeys = new Set<string>();

    // Collect all keys
    for (const key of this.globalShortcuts.keys()) {
      allKeys.add(key);
    }

    for (const [context, map] of this.contextShortcuts) {
      for (const key of map.keys()) {
        allKeys.add(key);
      }
    }

    // Check for conflicts
    for (const key of allKeys) {
      const keyConflicts: Shortcut[] = [];

      if (this.globalShortcuts.has(key)) {
        keyConflicts.push(this.globalShortcuts.get(key)!);
      }

      for (const [context, map] of this.contextShortcuts) {
        if (map.has(key)) {
          keyConflicts.push({ ...map.get(key)!, context });
        }
      }

      if (keyConflicts.length > 1) {
        conflicts.push({ key, conflicts: keyConflicts });
      }
    }

    return conflicts;
  }

  /**
   * Normalize key string
   */
  private normalizeKey(key: string): string {
    return key.toLowerCase().trim();
  }

  /**
   * Normalize Key event
   */
  private normalizeKeyEvent(input: Key, rawInput?: string): string {
    // Handle special keys
    if (rawInput) {
      // Ctrl+ combinations
      if (rawInput.length === 1 && rawInput.charCodeAt(0) < 32) {
        const char = String.fromCharCode(rawInput.charCodeAt(0) + 64);
        return `ctrl+${char.toLowerCase()}`;
      }
      return rawInput.toLowerCase();
    }

    // Handle Key enum - convert to string safely
    return String(input).toLowerCase();
  }

  /**
   * Format key for display
   */
  static formatKey(key: string): string {
    return key
      .replace(/\+/g, ' + ')
      .replace(/ctrl/g, '⌃')
      .replace(/escape/g, 'Esc')
      .replace(/return/g, '↵')
      .replace(/space/g, '␣')
      .toUpperCase();
  }

  /**
   * Generate help text
   */
  generateHelp(): string {
    const lines: string[] = [];

    lines.push('Keyboard Shortcuts');
    lines.push('==================');
    lines.push('');

    // Global shortcuts
    if (this.globalShortcuts.size > 0) {
      lines.push('Global:');
      for (const shortcut of this.globalShortcuts.values()) {
        if (!shortcut.hidden) {
          const key = KeyboardShortcutManager.formatKey(shortcut.key);
          lines.push(`  ${key.padEnd(12)} - ${shortcut.description}`);
        }
      }
      lines.push('');
    }

    // Context shortcuts
    for (const context of this.currentContexts) {
      const shortcuts = this.getContextShortcuts(context);
      if (shortcuts.length > 0) {
        lines.push(`${context}:`);
        for (const shortcut of shortcuts) {
          const key = KeyboardShortcutManager.formatKey(shortcut.key);
          lines.push(`  ${key.padEnd(12)} - ${shortcut.description}`);
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Export shortcuts to JSON
   */
  exportJSON(): object {
    const data: any = {
      global: Array.from(this.globalShortcuts.values()).map(s => ({
        key: s.key,
        description: s.description,
      })),
      contexts: {},
    };

    for (const [context, map] of this.contextShortcuts) {
      data.contexts[context] = Array.from(map.values()).map(s => ({
        key: s.key,
        description: s.description,
      }));
    }

    return data;
  }

  /**
   * Import shortcuts from JSON
   */
  importJSON(data: any): void {
    if (data.global) {
      for (const shortcut of data.global) {
        this.registerGlobal({
          key: shortcut.key,
          description: shortcut.description,
          action: () => {}, // Placeholder, caller should replace
        });
      }
    }

    if (data.contexts) {
      for (const [context, shortcuts] of Object.entries(data.contexts)) {
        for (const shortcut of shortcuts as any[]) {
          this.registerContext(context, {
            key: shortcut.key,
            description: shortcut.description,
            action: () => {}, // Placeholder, caller should replace
          });
        }
      }
    }
  }
}

/**
 * Create default shortcut manager with common shortcuts
 */
export function createDefaultShortcutManager(): KeyboardShortcutManager {
  const manager = new KeyboardShortcutManager();

  // Common global shortcuts
  manager.registerGlobal({
    key: 'q',
    description: 'Quit',
    action: () => process.exit(0),
  });

  manager.registerGlobal({
    key: '?',
    description: 'Show help',
    action: () => {
      console.log(manager.generateHelp());
    },
  });

  manager.registerGlobal({
    key: 'ctrl+c',
    description: 'Cancel',
    action: () => process.exit(1),
  });

  return manager;
}

/**
 * Use default shortcuts for specific contexts
 */
export function registerContextualShortcuts(
  manager: KeyboardShortcutManager,
  context: 'input' | 'navigation' | 'editor' | 'menu' | 'list'
): void {
  switch (context) {
    case 'input':
      manager.registerContext('input', {
        key: 'ctrl+c',
        description: 'Clear input',
        action: () => {}, // To be implemented by caller
      });
      manager.registerContext('input', {
        key: 'ctrl+a',
        description: 'Move to start',
        action: () => {},
      });
      manager.registerContext('input', {
        key: 'ctrl+e',
        description: 'Move to end',
        action: () => {},
      });
      break;

    case 'navigation':
      manager.registerContext('navigation', {
        key: 'k',
        description: 'Up',
        action: () => {},
      });
      manager.registerContext('navigation', {
        key: 'j',
        description: 'Down',
        action: () => {},
      });
      manager.registerContext('navigation', {
        key: 'g',
        description: 'Go to top',
        action: () => {},
      });
      manager.registerContext('navigation', {
        key: 'G',
        description: 'Go to bottom',
        action: () => {},
      });
      break;

    case 'editor':
      manager.registerContext('editor', {
        key: 'ctrl+s',
        description: 'Save',
        action: () => {},
      });
      manager.registerContext('editor', {
        key: 'ctrl+f',
        description: 'Find',
        action: () => {},
      });
      manager.registerContext('editor', {
        key: 'ctrl+r',
        description: 'Replace',
        action: () => {},
      });
      break;

    case 'menu':
      manager.registerContext('menu', {
        key: 'return',
        description: 'Select',
        action: () => {},
      });
      manager.registerContext('menu', {
        key: 'escape',
        description: 'Back',
        action: () => {},
      });
      break;

    case 'list':
      manager.registerContext('list', {
        key: 'return',
        description: 'Open item',
        action: () => {},
      });
      manager.registerContext('list', {
        key: '/',
        description: 'Search',
        action: () => {},
      });
      break;
  }
}
