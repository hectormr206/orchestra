/**
 * Prompt Optimizer - Improve LLM prompt effectiveness
 *
 * Provides:
 * - Prompt analysis and quality scoring
 * - Automatic prompt improvement suggestions
 * - Template-based prompt generation
 * - Context-aware prompt optimization
 * - A/B testing for prompts
 */

export interface PromptAnalysis {
  score: number; // 0-100
  issues: PromptIssue[];
  suggestions: string[];
  optimizedPrompt: string;
  metrics: PromptMetrics;
}

export interface PromptIssue {
  type: 'vague' | 'ambiguous' | 'missing_context' | 'too_long' | 'too_short' | 'poor_structure';
  severity: 'low' | 'medium' | 'high';
  message: string;
  position?: number;
}

export interface PromptMetrics {
  length: number;
  wordCount: number;
  sentenceCount: number;
  clarity: number;
  specificity: number;
  context: number;
}

export interface PromptTemplate {
  name: string;
  description: string;
  category: 'code' | 'architecture' | 'debugging' | 'refactoring' | 'testing' | 'documentation';
  template: string;
  variables: string[];
}

/**
 * Prompt Optimizer
 */
export class PromptOptimizer {
  private templates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Initialize prompt templates
   */
  private initializeTemplates(): void {
    const templates: PromptTemplate[] = [
      {
        name: 'code-generation',
        description: 'Generate code with specific requirements',
        category: 'code',
        template: `You are an expert software developer. Generate code for the following task:

**Task:** {{task}}

**Requirements:**
- Language/Framework: {{language}}
- Follow best practices and conventions
- Include error handling
- Add comments for complex logic
- Ensure type safety where applicable

**Context:**
{{context}}

**Output Format:**
Provide the complete code with explanations.`,
        variables: ['task', 'language', 'context'],
      },

      {
        name: 'architecture-design',
        description: 'Design system architecture',
        category: 'architecture',
        template: `You are a software architect. Design the architecture for:

**Project:** {{project}}

**Requirements:**
{{requirements}}

**Constraints:**
- Scale: {{scale}}
- Tech Stack: {{techStack}}
- Budget: {{budget}}

Provide:
1. High-level architecture diagram
2. Component breakdown
3. Data flow
4. Technology choices with rationale
5. Potential challenges and mitigation strategies`,
        variables: ['project', 'requirements', 'scale', 'techStack', 'budget'],
      },

      {
        name: 'debugging',
        description: 'Debug and fix issues',
        category: 'debugging',
        template: `You are a debugging expert. Help fix the following issue:

**Error/Bug:**
{{error}}

**Code:**
\`\`\`
{{code}}
\`\`\`

**Context:**
- What was expected: {{expected}}
- What actually happened: {{actual}}
- Environment: {{environment}}

Provide:
1. Root cause analysis
2. Step-by-step fix
3. Prevention strategies for similar issues`,
        variables: ['error', 'code', 'expected', 'actual', 'environment'],
      },

      {
        name: 'refactoring',
        description: 'Refactor existing code',
        category: 'refactoring',
        template: `You are a code quality expert. Refactor the following code:

**Current Code:**
\`\`\`
{{code}}
\`\`\`

**Goals:**
{{goals}}

**Constraints:**
- Maintain existing functionality
- Improve {{aspects}}
- Follow {{language}} best practices

Provide:
1. Refactored code with explanations
2. What changed and why
3. Performance/complexity improvements`,
        variables: ['code', 'goals', 'language', 'aspects'],
      },

      {
        name: 'test-generation',
        description: 'Generate comprehensive tests',
        category: 'testing',
        template: `You are a testing expert. Generate tests for:

**Code to Test:**
\`\`\`
{{code}}
\`\`\`

**Requirements:**
- Test Framework: {{framework}}
- Coverage Target: {{coverage}}%
- Focus Areas: {{focus}}

Generate:
1. Unit tests for all functions
2. Edge case tests
3. Error handling tests
4. Integration tests if applicable

Include assertions, mocks, and test data.`,
        variables: ['code', 'framework', 'coverage', 'focus'],
      },

      {
        name: 'documentation',
        description: 'Generate code documentation',
        category: 'documentation',
        template: `You are a technical writer. Generate documentation for:

**Code:**
\`\`\`
{{code}}
\`\`\`

**Target Audience:** {{audience}}
**Documentation Style:** {{style}}

Include:
1. Overview
2. API documentation with parameters and return types
3. Usage examples
4. Error conditions
5. Best practices`,
        variables: ['code', 'audience', 'style'],
      },
    ];

    for (const template of templates) {
      this.templates.set(template.name, template);
    }
  }

  /**
   * Analyze prompt quality
   */
  analyzePrompt(prompt: string): PromptAnalysis {
    const issues: PromptIssue[] = [];
    const suggestions: string[] = [];

    // Calculate metrics
    const metrics = this.calculateMetrics(prompt);

    // Check for issues
    if (metrics.wordCount < 10) {
      issues.push({
        type: 'too_short',
        severity: 'high',
        message: 'Prompt is too short. Add more context and details.',
      });
      suggestions.push('Expand your prompt with specific requirements and constraints.');
    }

    if (metrics.wordCount > 500) {
      issues.push({
        type: 'too_long',
        severity: 'medium',
        message: 'Prompt is very long. Consider breaking it into smaller parts.',
      });
      suggestions.push('Split complex prompts into multiple focused prompts.');
    }

    if (metrics.clarity < 0.5) {
      issues.push({
        type: 'vague',
        severity: 'high',
        message: 'Prompt lacks clarity. Be more specific about what you want.',
      });
      suggestions.push('Use specific language and concrete examples.');
    }

    if (metrics.specificity < 0.5) {
      issues.push({
        type: 'ambiguous',
        severity: 'medium',
        message: 'Prompt has ambiguous instructions. Clarify your requirements.',
      });
      suggestions.push('Add specific constraints, formats, or examples.');
    }

    if (metrics.context < 0.3) {
      issues.push({
        type: 'missing_context',
        severity: 'high',
        message: 'Prompt lacks context. Add background information.',
      });
      suggestions.push('Include relevant context about the project, environment, or use case.');
    }

    // Check structure
    const hasStructure = this.hasGoodStructure(prompt);
    if (!hasStructure) {
      issues.push({
        type: 'poor_structure',
        severity: 'low',
        message: 'Prompt could benefit from better structure.',
      });
      suggestions.push('Use sections, bullet points, or numbered lists to organize your prompt.');
    }

    // Calculate overall score
    const score = this.calculateScore(metrics, issues);

    // Generate optimized prompt
    const optimizedPrompt = this.optimizePrompt(prompt, issues);

    return {
      score,
      issues,
      suggestions,
      optimizedPrompt,
      metrics,
    };
  }

  /**
   * Calculate prompt metrics
   */
  private calculateMetrics(prompt: string): PromptMetrics {
    const length = prompt.length;
    const words = prompt.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceCount = sentences.length;

    // Calculate clarity (based on sentence structure)
    const avgWordsPerSentence = wordCount / Math.max(sentenceCount, 1);
    const clarity = Math.max(0, 1 - Math.abs(avgWordsPerSentence - 15) / 30);

    // Calculate specificity (based on specific words)
    const specificWords = [
      'implement', 'create', 'generate', 'refactor', 'fix', 'optimize',
      'function', 'class', 'method', 'api', 'endpoint', 'component',
      'typescript', 'javascript', 'python', 'react', 'vue', 'angular',
      'test', 'mock', 'assert', 'coverage', 'unit', 'integration',
    ];
    const specificWordCount = words.filter(w =>
      specificWords.some(sw => w.toLowerCase().includes(sw))
    ).length;
    const specificity = Math.min(1, specificWordCount / Math.max(wordCount * 0.1, 1));

    // Calculate context (based on contextual information)
    const contextIndicators = [
      'context', 'background', 'environment', 'project', 'codebase',
      'requirements', 'constraints', 'goals', 'objectives',
    ];
    const contextCount = contextIndicators.filter(ci =>
      prompt.toLowerCase().includes(ci)
    ).length;
    const context = Math.min(1, contextCount / 3);

    return {
      length,
      wordCount,
      sentenceCount,
      clarity,
      specificity,
      context,
    };
  }

  /**
   * Check if prompt has good structure
   */
  private hasGoodStructure(prompt: string): boolean {
    const hasSections = /^#{1,3}\s/m.test(prompt) ||
                        /^\*\*[^*]+\*\*:/m.test(prompt) ||
                        /^\d+\.\s/m.test(prompt) ||
                        /^-\s/m.test(prompt);

    const hasCodeBlock = /```/.test(prompt);

    return hasSections || hasCodeBlock;
  }

  /**
   * Calculate overall score
   */
  private calculateScore(metrics: PromptMetrics, issues: PromptIssue[]): number {
    let score = 100;

    // Deduct points for issues
    for (const issue of issues) {
      switch (issue.severity) {
        case 'high':
          score -= 20;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    }

    // Add points for good metrics
    score += metrics.clarity * 10;
    score += metrics.specificity * 10;
    score += metrics.context * 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Optimize prompt based on analysis
   */
  private optimizePrompt(original: string, issues: PromptIssue[]): string {
    let optimized = original;

    // Add structure if poor
    const hasStructureIssue = issues.some(i => i.type === 'poor_structure');
    if (hasStructureIssue && !/^#{1,3}\s/.test(optimized)) {
      optimized = `**Task:**\n${optimized}\n\n**Requirements:**\n- Add specific requirements here\n- Include constraints\n- Specify output format`;
    }

    // Add context if missing
    const hasContextIssue = issues.some(i => i.type === 'missing_context');
    if (hasContextIssue) {
      if (!optimized.includes('Context')) {
        optimized += '\n\n**Context:**\nProvide background information about your project, environment, and use case.';
      }
    }

    // Improve specificity if vague
    const hasVagueIssue = issues.some(i => i.type === 'vague' || i.type === 'ambiguous');
    if (hasVagueIssue) {
      if (!optimized.includes('Examples') && !optimized.includes('Format')) {
        optimized += '\n\n**Expected Output:**\nSpecify the format, style, or examples of what you expect.';
      }
    }

    return optimized;
  }

  /**
   * Generate prompt from template
   */
  generateFromTemplate(
    templateName: string,
    variables: Record<string, string>
  ): string | null {
    const template = this.templates.get(templateName);
    if (!template) {
      return null;
    }

    let prompt = template.template;

    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      prompt = prompt.replace(regex, value);
    }

    return prompt;
  }

  /**
   * Get available templates
   */
  getTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by name
   */
  getTemplate(name: string): PromptTemplate | null {
    return this.templates.get(name) || null;
  }

  /**
   * Add custom template
   */
  addTemplate(template: PromptTemplate): void {
    this.templates.set(template.name, template);
  }

  /**
   * A/B test two prompts
   */
  async comparePrompts(
    prompt1: string,
    prompt2: string,
    testFunction: (prompt: string) => Promise<any>
  ): Promise<{
    winner: string;
    prompt1Analysis: PromptAnalysis;
    prompt2Analysis: PromptAnalysis;
    reason: string;
  }> {
    const analysis1 = this.analyzePrompt(prompt1);
    const analysis2 = this.analyzePrompt(prompt2);

    // Could add actual A/B testing here with the testFunction
    // For now, compare based on analysis scores

    const winner = analysis1.score >= analysis2.score ? 'prompt1' : 'prompt2';
    const winnerAnalysis = winner === 'prompt1' ? analysis1 : analysis2;
    const loserAnalysis = winner === 'prompt1' ? analysis2 : analysis1;

    const reason = winner === 'prompt1'
      ? `Prompt 1 scores higher (${analysis1.score} vs ${analysis2.score})`
      : `Prompt 2 scores higher (${analysis2.score} vs ${analysis1.score})`;

    return {
      winner,
      prompt1Analysis: analysis1,
      prompt2Analysis: analysis2,
      reason,
    };
  }

  /**
   * Suggest improvements for a specific category
   */
  suggestImprovements(
    prompt: string,
    category: PromptTemplate['category']
  ): string[] {
    const suggestions: string[] = [];
    const analysis = this.analyzePrompt(prompt);

    // Category-specific suggestions
    switch (category) {
      case 'code':
        if (!prompt.includes('language') && !prompt.includes('framework')) {
          suggestions.push('Specify the programming language or framework');
        }
        if (!prompt.includes('error handling') && !prompt.includes('exception')) {
          suggestions.push('Mention error handling requirements');
        }
        if (!prompt.includes('test') && !prompt.includes('testing')) {
          suggestions.push('Consider including test requirements');
        }
        break;

      case 'architecture':
        if (!prompt.includes('scale') && !prompt.includes('load')) {
          suggestions.push('Define expected scale and load requirements');
        }
        if (!prompt.includes('constraint') && !prompt.includes('limitation')) {
          suggestions.push('List technical constraints and limitations');
        }
        if (!prompt.includes('security') && !prompt.includes('auth')) {
          suggestions.push('Consider security and authentication requirements');
        }
        break;

      case 'debugging':
        if (!/```/.test(prompt)) {
          suggestions.push('Include code snippets in markdown code blocks');
        }
        if (!prompt.includes('error') && !prompt.includes('bug')) {
          suggestions.push('Describe the error or unexpected behavior');
        }
        if (!prompt.includes('expected') && !prompt.includes('actual')) {
          suggestions.push('Clarify expected vs actual behavior');
        }
        break;

      case 'testing':
        if (!prompt.includes('framework')) {
          suggestions.push('Specify the testing framework (Jest, Pytest, etc.)');
        }
        if (!prompt.includes('coverage')) {
          suggestions.push('Define coverage requirements');
        }
        if (!prompt.includes('edge') && !prompt.includes('boundary')) {
          suggestions.push('Mention edge cases to test');
        }
        break;
    }

    return [...suggestions, ...analysis.suggestions];
  }

  /**
   * Format analysis as text
   */
  formatAnalysis(analysis: PromptAnalysis): string {
    const lines: string[] = [];

    lines.push('Prompt Analysis');
    lines.push('===============');
    lines.push('');
    lines.push(`Score: ${analysis.score}/100`);

    if (analysis.issues.length > 0) {
      lines.push('');
      lines.push('Issues Found:');
      for (const issue of analysis.issues) {
        lines.push(`  [${issue.severity.toUpperCase()}] ${issue.message}`);
      }
    }

    if (analysis.suggestions.length > 0) {
      lines.push('');
      lines.push('Suggestions:');
      for (const suggestion of analysis.suggestions) {
        lines.push(`  - ${suggestion}`);
      }
    }

    lines.push('');
    lines.push('Metrics:');
    lines.push(`  Length: ${analysis.metrics.length} chars`);
    lines.push(`  Words: ${analysis.metrics.wordCount}`);
    lines.push(`  Sentences: ${analysis.metrics.sentenceCount}`);
    lines.push(`  Clarity: ${(analysis.metrics.clarity * 100).toFixed(0)}%`);
    lines.push(`  Specificity: ${(analysis.metrics.specificity * 100).toFixed(0)}%`);
    lines.push(`  Context: ${(analysis.metrics.context * 100).toFixed(0)}%`);

    return lines.join('\n');
  }
}

/**
 * Analyze prompt (convenience function)
 */
export function analyzePrompt(prompt: string): PromptAnalysis {
  const optimizer = new PromptOptimizer();
  return optimizer.analyzePrompt(prompt);
}

/**
 * Optimize prompt (convenience function)
 */
export function optimizePrompt(prompt: string): {
  original: string;
  optimized: string;
  analysis: PromptAnalysis;
} {
  const optimizer = new PromptOptimizer();
  const analysis = optimizer.analyzePrompt(prompt);

  return {
    original: prompt,
    optimized: analysis.optimizedPrompt,
    analysis,
  };
}
