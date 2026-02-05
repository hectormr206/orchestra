/**
 * Context Compaction Helper
 *
 * Utilities for handling context exceeded errors by compacting prompts intelligently
 */

export interface CompactionResult {
  compactedPrompt: string;
  originalLength: number;
  compactedLength: number;
  reductionPercent: number;
}

/**
 * Compacts a prompt when context is exceeded
 * Keeps essential information while reducing size
 */
export function compactPrompt(prompt: string, targetReduction: number = 0.5): CompactionResult {
  const originalLength = prompt.length;

  // Strategy 1: Remove excessive whitespace
  let compacted = prompt.replace(/\s+/g, ' ').trim();

  // Strategy 2: Remove repeated phrases
  compacted = removeRepeatedPhrases(compacted);

  // Strategy 3: Summarize code blocks if present
  compacted = summarizeCodeBlocks(compacted);

  // Strategy 4: Remove verbose explanations, keep instructions
  compacted = removeVerboseExplanations(compacted);

  // Strategy 5: If still too long, apply aggressive summarization
  const currentReduction = (originalLength - compacted.length) / originalLength;
  if (currentReduction < targetReduction) {
    compacted = aggressiveSummarization(compacted, targetReduction);
  }

  const compactedLength = compacted.length;
  const reductionPercent = Math.round(((originalLength - compactedLength) / originalLength) * 100);

  return {
    compactedPrompt: compacted,
    originalLength,
    compactedLength,
    reductionPercent,
  };
}

/**
 * Remove repeated phrases (common in verbose prompts)
 */
function removeRepeatedPhrases(text: string): string {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const sentence of sentences) {
    const normalized = sentence.trim().toLowerCase();
    if (!seen.has(normalized) && normalized.length > 10) {
      seen.add(normalized);
      unique.push(sentence.trim());
    }
  }

  return unique.join('. ') + '.';
}

/**
 * Summarize code blocks to reduce size while keeping structure
 */
function summarizeCodeBlocks(text: string): string {
  // Match code blocks (markdown style)
  const codeBlockRegex = /```[\s\S]*?```/g;

  return text.replace(codeBlockRegex, (match) => {
    // If code block is very long (>500 chars), summarize it
    if (match.length > 500) {
      const lines = match.split('\n');
      const language = lines[0].replace('```', '').trim();
      const firstLines = lines.slice(1, 6).join('\n'); // Keep first 5 lines
      const lastLines = lines.slice(-3).join('\n'); // Keep last 3 lines

      return `\`\`\`${language}\n${firstLines}\n// ... (code omitted for brevity) ...\n${lastLines}\n\`\`\``;
    }
    return match;
  });
}

/**
 * Remove verbose explanations while keeping core instructions
 */
function removeVerboseExplanations(text: string): string {
  // Remove phrases like "Please note that", "It's important to", etc.
  const verbosePhrases = [
    /please note that\s+/gi,
    /it(?:'s| is) important to\s+/gi,
    /keep in mind that\s+/gi,
    /remember to\s+/gi,
    /don't forget to\s+/gi,
    /make sure to\s+/gi,
    /as mentioned (?:before|earlier|above)\s+/gi,
  ];

  let result = text;
  for (const phrase of verbosePhrases) {
    result = result.replace(phrase, '');
  }

  return result;
}

/**
 * Aggressive summarization when other methods aren't enough
 */
function aggressiveSummarization(text: string, targetReduction: number): string {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  // Calculate how many sentences to keep
  const targetLength = Math.floor(sentences.length * (1 - targetReduction));

  // Prioritize sentences with key instructions
  const scored = sentences.map(sentence => {
    const s = sentence.toLowerCase();
    let score = 0;

    // Boost sentences with action verbs
    if (/\b(create|implement|add|update|fix|refactor|test|validate)\b/i.test(s)) score += 3;

    // Boost sentences with requirements
    if (/\b(must|should|need to|required|ensure)\b/i.test(s)) score += 2;

    // Boost sentences with file/code references
    if (/\b(file|function|class|method|component)\b/i.test(s)) score += 2;

    // Penalize very long sentences (likely verbose)
    if (sentence.length > 200) score -= 1;

    return { sentence, score };
  });

  // Sort by score and take top N
  scored.sort((a, b) => b.score - a.score);
  const kept = scored.slice(0, Math.max(targetLength, 10)); // Keep at least 10 sentences

  // Restore original order
  const keptSet = new Set(kept.map(k => k.sentence));
  const result = sentences.filter(s => keptSet.has(s));

  return result.join('. ') + '.';
}

/**
 * Detects if an error message indicates context exceeded
 */
export function isContextExceededError(output: string): boolean {
  const contextPatterns = [
    /context.{0,20}exceed/i,
    /maximum context/i,
    /context.{0,20}limit/i,
    /too.{0,10}long/i,
    /token.{0,20}limit/i,
    /input.{0,20}too.{0,10}large/i,
    /prompt.{0,20}too.{0,10}long/i,
    /request.{0,20}too.{0,10}large/i,
    /上下文过长/i, // Chinese: context too long
    /输入过长/i,   // Chinese: input too long
    /CONTEXT_LENGTH_EXCEEDED/i,
    /InvalidRequestError.*context/i,
  ];

  return contextPatterns.some(pattern => pattern.test(output));
}

/**
 * Estimates if a prompt might exceed context
 * (Very rough estimate: 1 token ≈ 4 characters)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Checks if a prompt is likely to exceed context for a given model
 */
export function wouldExceedContext(text: string, maxTokens: number): boolean {
  const estimated = estimateTokens(text);
  // Use 80% of max as safety margin
  return estimated > (maxTokens * 0.8);
}
