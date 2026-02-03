/**
 * Autocomplete System - Context-aware autocomplete for TUI inputs
 *
 * Provides:
 * - Command autocomplete
 * - File path autocomplete
 * - Custom word completion
 * - Context-sensitive suggestions
 * - Fuzzy matching
 */

export interface CompletionItem {
  label: string;
  detail?: string;
  type?: 'command' | 'file' | 'directory' | 'option' | 'custom';
  action?: () => void | Promise<void>;
}

export interface AutocompleteContext {
  name: string;
  trigger?: string; // Character that triggers autocomplete (e.g., '/', '@')
  completions: CompletionItem[] | ((input: string) => CompletionItem[] | Promise<CompletionItem[]>);
  priority?: number; // Higher priority contexts are checked first
}

export interface AutocompleteOptions {
  fuzzy?: boolean;
  caseSensitive?: boolean;
  maxSuggestions?: number;
  showIcons?: boolean;
  showDetails?: boolean;
}

/**
 * Autocomplete Manager
 */
export class AutocompleteManager {
  private contexts: Map<string, AutocompleteContext> = new Map();
  private activeContexts: Set<string> = new Set();
  private options: AutocompleteOptions;

  constructor(options: AutocompleteOptions = {}) {
    this.options = {
      fuzzy: true,
      caseSensitive: false,
      maxSuggestions: 10,
      showIcons: true,
      showDetails: true,
      ...options,
    };
  }

  /**
   * Register an autocomplete context
   */
  registerContext(context: AutocompleteContext): void {
    this.contexts.set(context.name, {
      ...context,
      priority: context.priority || 0,
    });
  }

  /**
   * Unregister a context
   */
  unregisterContext(name: string): void {
    this.contexts.delete(name);
  }

  /**
   * Activate a context
   */
  activateContext(name: string): void {
    this.activeContexts.add(name);
  }

  /**
   * Deactivate a context
   */
  deactivateContext(name: string): void {
    this.activeContexts.delete(name);
  }

  /**
   * Get completions for input
   */
  async getCompletions(
    input: string,
    cursorPosition?: number
  ): Promise<CompletionItem[]> {
    const searchInput = this.getSearchInput(input, cursorPosition);
    const allCompletions: CompletionItem[] = [];

    // Get contexts sorted by priority
    const sortedContexts = Array.from(this.activeContexts)
      .map(name => this.contexts.get(name)!)
      .filter(Boolean)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Collect completions from all active contexts
    for (const context of sortedContexts) {
      let completions: CompletionItem[];

      if (typeof context.completions === 'function') {
        completions = await context.completions(searchInput);
      } else {
        completions = context.completions;
      }

      // Filter and match
      const matched = this.filterCompletions(completions, searchInput);
      allCompletions.push(...matched);
    }

    // Remove duplicates and limit
    const unique = this.deduplicateCompletions(allCompletions);
    return unique.slice(0, this.options.maxSuggestions!);
  }

  /**
   * Check if autocomplete should be triggered
   */
  shouldTrigger(input: string, cursorPosition?: number): boolean {
    const lastChar = this.getLastChar(input, cursorPosition);

    // Check if any context's trigger matches
    for (const contextName of this.activeContexts) {
      const context = this.contexts.get(contextName);
      if (context?.trigger && lastChar === context.trigger) {
        return true;
      }
    }

    // Auto-trigger on space for certain contexts
    if (lastChar === ' ' && this.activeContexts.has('commands')) {
      return true;
    }

    return false;
  }

  /**
   * Apply completion
   */
  applyCompletion(
    input: string,
    completion: CompletionItem,
    cursorPosition?: number
  ): { text: string; cursor: number } {
    const searchInput = this.getSearchInput(input, cursorPosition);
    const prefix = input.substring(0, input.length - searchInput.length);

    // Calculate new text
    let newText = prefix + completion.label;

    // Add space after completion if it's a command or option
    if (completion.type === 'command' || completion.type === 'option') {
      newText += ' ';
    }

    // Add slash after directory
    if (completion.type === 'directory') {
      newText += '/';
    }

    const newCursor = newText.length;

    return { text: newText, cursor: newCursor };
  }

  /**
   * Get the search input (word before cursor)
   */
  private getSearchInput(input: string, cursorPosition?: number): string {
    const pos = cursorPosition ?? input.length;
    const beforeCursor = input.substring(0, pos);

    // Find the last word boundary
    const match = beforeCursor.match(/[\w/\\-]+$/);
    return match ? match[0] : '';
  }

  /**
   * Get the last character before cursor
   */
  private getLastChar(input: string, cursorPosition?: number): string {
    const pos = cursorPosition ?? input.length;
    return pos > 0 ? input[pos - 1] : '';
  }

  /**
   * Filter completions based on input
   */
  private filterCompletions(
    completions: CompletionItem[],
    input: string
  ): CompletionItem[] {
    if (!input) {
      return completions;
    }

    const searchInput = this.options.caseSensitive ? input : input.toLowerCase();

    return completions.filter(completion => {
      const label = this.options.caseSensitive
        ? completion.label
        : completion.label.toLowerCase();

      if (this.options.fuzzy) {
        return this.fuzzyMatch(label, searchInput);
      } else {
        return label.startsWith(searchInput);
      }
    });
  }

  /**
   * Fuzzy match strings
   */
  private fuzzyMatch(text: string, pattern: string): boolean {
    let patternIndex = 0;

    for (let i = 0; i < text.length && patternIndex < pattern.length; i++) {
      if (text[i] === pattern[patternIndex]) {
        patternIndex++;
      }
    }

    return patternIndex === pattern.length;
  }

  /**
   * Remove duplicate completions
   */
  private deduplicateCompletions(completions: CompletionItem[]): CompletionItem[] {
    const seen = new Set<string>();
    const unique: CompletionItem[] = [];

    for (const completion of completions) {
      if (!seen.has(completion.label)) {
        seen.add(completion.label);
        unique.push(completion);
      }
    }

    return unique;
  }

  /**
   * Clear all contexts
   */
  clearContexts(): void {
    this.contexts.clear();
    this.activeContexts.clear();
  }

  /**
   * Get all registered contexts
   */
  getContexts(): AutocompleteContext[] {
    return Array.from(this.contexts.values());
  }
}

/**
 * Create file path completions
 */
export function createFileCompletions(
  basePath: string = process.cwd(),
  options: {
    includeFiles?: boolean;
    includeDirectories?: boolean;
    extensions?: string[];
  } = {}
): (input: string) => CompletionItem[] {
  return (input: string) => {
    const { includeFiles = true, includeDirectories = true, extensions = [] } = options;
    const completions: CompletionItem[] = [];

    try {
      const fs = require('fs');
      const path = require('path');

      // Resolve the input path
      let searchPath = input;
      let searchDir = '.';

      const lastSlash = input.lastIndexOf(path.sep);
      if (lastSlash >= 0) {
        searchDir = input.substring(0, lastSlash) || '.';
        searchPath = input.substring(lastSlash + 1);
      }

      // Read directory
      if (fs.existsSync(searchDir)) {
        const files = fs.readdirSync(searchDir);

        for (const file of files) {
          // Skip hidden files
          if (file.startsWith('.')) {
            continue;
          }

          const fullPath = path.join(searchDir, file);
          const stat = fs.statSync(fullPath);
          const isDirectory = stat.isDirectory();

          // Check if should include
          if (isDirectory && includeDirectories) {
            completions.push({
              label: file,
              detail: 'directory',
              type: 'directory',
            });
          } else if (!isDirectory && includeFiles) {
            // Check extension filter
            if (extensions.length === 0 || extensions.some(ext => file.endsWith(ext))) {
              completions.push({
                label: file,
                detail: 'file',
                type: 'file',
              });
            }
          }
        }
      }
    } catch (error) {
      // Ignore errors
    }

    return completions;
  };
}

/**
 * Create command completions
 */
export function createCommandCompletions(commands: string[]): CompletionItem[] {
  return commands.map(cmd => ({
    label: cmd,
    detail: 'command',
    type: 'command',
  }));
}

/**
 * Create default autocomplete manager
 */
export function createDefaultAutocompleteManager(): AutocompleteManager {
  const manager = new AutocompleteManager();

  // Commands context
  const commands = [
    'start', 'resume', 'pipeline', 'watch', 'status', 'plan',
    'clean', 'doctor', 'init', 'validate', 'dry-run', 'export',
    'history', 'notify', 'cache', 'tui', 'help',
  ];

  manager.registerContext({
    name: 'commands',
    completions: createCommandCompletions(commands),
    priority: 100,
  });

  // Options context
  const options = [
    '--auto-approve', '--parallel', '--no-tests', '--no-commit',
    '--dry-run', '--format', '--output', '--limit', '--search',
    '--slack', '--discord', '--webhook', '--clear', '--stats',
    '--bash', '--zsh', '--fish', '--install', '--uninstall',
  ];

  manager.registerContext({
    name: 'options',
    trigger: '-',
    completions: options.map(opt => ({
      label: opt,
      detail: 'option',
      type: 'option',
    })),
    priority: 90,
  });

  // Files context
  manager.registerContext({
    name: 'files',
    trigger: '/',
    completions: createFileCompletions(process.cwd(), {
      includeFiles: true,
      includeDirectories: true,
    }),
    priority: 80,
  });

  return manager;
}

/**
 * Format completion item for display
 */
export function formatCompletionItem(
  item: CompletionItem,
  options: AutocompleteOptions = {}
): string {
  const showIcons = options.showIcons ?? true;
  const showDetails = options.showDetails ?? true;

  const icon = showIcons ? getTypeIcon(item.type) : '';
  const detail = showDetails && item.detail ? ` ${item.detail}` : '';

  return `${icon}${item.label}${detail}`;
}

/**
 * Get icon for completion type
 */
function getTypeIcon(type?: CompletionItem['type']): string {
  switch (type) {
    case 'command':
      return '▶ ';
    case 'file':
      return '📄 ';
    case 'directory':
      return '📁 ';
    case 'option':
      return '⚙ ';
    default:
      return '  ';
  }
}
