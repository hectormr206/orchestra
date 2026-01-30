import type { BoxStyle } from 'ink';

interface TruncateOptions {
  maxLength: number;
  suffix?: string;
  position?: 'start' | 'middle' | 'end';
}

interface PadOptions {
  width: number;
  align?: 'left' | 'center' | 'right';
  fill?: string;
}

export function truncateText(
  value: string,
  maxLength: number
): string {
  if (value.length <= maxLength) {
    return value;
  }

  const suffix = '...';
  const truncatedLength = maxLength - suffix.length;

  if (truncatedLength <= 0) {
    return suffix.substring(0, maxLength);
  }

  return value.substring(0, truncatedLength) + suffix;
}

export function truncateTextAdvanced({
  maxLength,
  suffix = '...',
  position = 'end'
}: TruncateOptions): (value: string) => string {
  return (value: string): string => {
    if (value.length <= maxLength) {
      return value;
    }

    const truncatedLength = maxLength - suffix.length;

    if (truncatedLength <= 0) {
      return suffix.substring(0, maxLength);
    }

    switch (position) {
      case 'start':
        return suffix + value.substring(value.length - truncatedLength);
      
      case 'middle':
        const startLength = Math.ceil(truncatedLength / 2);
        const endLength = Math.floor(truncatedLength / 2);
        return (
          value.substring(0, startLength) +
          suffix +
          value.substring(value.length - endLength)
        );
      
      case 'end':
      default:
        return value.substring(0, truncatedLength) + suffix;
    }
  };
}

export function truncatePath(
  filePath: string,
  maxLength: number
): string {
  if (filePath.length <= maxLength) {
    return filePath;
  }

  const segments = filePath.split('/');
  if (segments.length <= 2) {
    return truncateText(filePath, maxLength);
  }

  let result = filePath;
  let attempts = 0;
  const maxAttempts = segments.length - 2;

  while (result.length > maxLength && attempts < maxAttempts) {
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    const middleSegments = segments.slice(1, segments.length - 1 - attempts);
    
    result = [firstSegment, '...', ...middleSegments.slice(-2), lastSegment].join('/');
    attempts++;
  }

  if (result.length > maxLength) {
    return truncateTextAdvanced({ maxLength, position: 'start' })(filePath);
  }

  return result;
}

export function padText({
  width,
  align = 'left',
  fill = ' '
}: PadOptions): (value: string) => string {
  return (value: string): string => {
    if (value.length >= width) {
      return value;
    }

    const padding = width - value.length;

    switch (align) {
      case 'center':
        const leftPadding = Math.floor(padding / 2);
        const rightPadding = padding - leftPadding;
        return fill.repeat(leftPadding) + value + fill.repeat(rightPadding);
      
      case 'right':
        return fill.repeat(padding) + value;
      
      case 'left':
      default:
        return value + fill.repeat(padding);
    }
  };
}

export function fitText(
  value: string,
  options: { width: number; align?: 'left' | 'center' | 'right' }
): string {
  const truncated = truncateText(value, options.width);
  return padText(options)(truncated);
}

export function measureTextWidth(value: string): number {
  let width = 0;
  
  for (const char of value) {
    const code = char.codePointAt(0) || 0;
    
    if (code < 256 || (code >= 0x2500 && code <= 0x259F)) {
      width += 1;
    } else if (code >= 0x1100 && (code <= 0x115F || code === 0x2329 || code === 0x232A ||
      (code >= 0x2E80 && code <= 0xA4CF && code !== 0x303F) ||
      (code >= 0xAC00 && code <= 0xD7A3) ||
      (code >= 0xF900 && code <= 0xFAFF) ||
      (code >= 0xFE10 && code <= 0xFE19) ||
      (code >= 0xFE30 && code <= 0xFE6F) ||
      (code >= 0xFF00 && code <= 0xFF60) ||
      (code >= 0xFFE0 && code <= 0xFFE6) ||
      (code >= 0x20000 && code <= 0x2FFFD) ||
      (code >= 0x30000 && code <= 0x3FFFD))) {
      width += 2;
    } else {
      width += 1;
    }
  }
  
  return width;
}

export function truncateByDisplayWidth(
  value: string,
  maxWidth: number,
  suffix = '...'
): string {
  const suffixWidth = measureTextWidth(suffix);
  
  if (measureTextWidth(value) <= maxWidth) {
    return value;
  }

  let truncatedWidth = 0;
  let truncated = '';

  for (const char of value) {
    const charWidth = measureTextWidth(char);
    
    if (truncatedWidth + charWidth + suffixWidth > maxWidth) {
      break;
    }
    
    truncated += char;
    truncatedWidth += charWidth;
  }

  return truncated + suffix;
}

export function wordWrap(text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  const words = text.split(' ');
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    
    if (measureTextWidth(testLine) <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      
      if (measureTextWidth(word) <= maxWidth) {
        currentLine = word;
      } else {
        const chunks = breakLongWord(word, maxWidth);
        lines.push(...chunks.slice(0, -1));
        currentLine = chunks[chunks.length - 1];
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function breakLongWord(word: string, maxWidth: number): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  let currentWidth = 0;

  for (const char of word) {
    const charWidth = measureTextWidth(char);
    
    if (currentWidth + charWidth > maxWidth && currentChunk) {
      chunks.push(currentChunk);
      currentChunk = char;
      currentWidth = charWidth;
    } else {
      currentChunk += char;
      currentWidth += charWidth;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

export function calculateAvailableWidth(
  containerWidth: number,
  padding: number = 0,
  borders: number = 0
): number {
  return Math.max(0, containerWidth - (padding * 2) - borders);
}

export function formatLabelValuePair(
  label: string,
  value: string,
  separator: string = ': ',
  availableWidth: number
): string {
  const labelWidth = measureTextWidth(label + separator);
  
  if (labelWidth >= availableWidth) {
    return truncateText(label, availableWidth);
  }

  const valueWidth = availableWidth - labelWidth;
  const truncatedValue = truncateByDisplayWidth(value, valueWidth);
  
  return `${label}${separator}${truncatedValue}`;
}

export function ensureFixedWidth(
  value: string,
  targetWidth: number,
  options: {
    truncate?: boolean;
    align?: 'left' | 'center' | 'right';
    fill?: string;
  } = {}
): string {
  const {
    truncate = true,
    align = 'left',
    fill = ' '
  } = options;

  const actualWidth = measureTextWidth(value);

  if (actualWidth > targetWidth) {
    if (truncate) {
      return truncateByDisplayWidth(value, targetWidth);
    }
    return value;
  }

  if (actualWidth < targetWidth) {
    return padText({ width: targetWidth, align, fill })(value);
  }

  return value;
}