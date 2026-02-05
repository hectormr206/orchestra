/**
 * Theme utilities for Orchestra TUI
 * Provides consistent styling for terminals with transparency
 */

export const theme = {
  colors: {
    // Primary colors with good contrast
    primary: "cyan",
    secondary: "magenta",
    success: "green",
    warning: "yellow",
    error: "red",
    info: "blue",

    // Text colors (avoid white/gray on transparent backgrounds)
    text: "cyan",
    textMuted: "blue",
    textHighlight: "yellow",

    // Background
    bg: "black",
    bgHighlight: "black",
  },

  borders: {
    primary: "cyan",
    success: "green",
    warning: "yellow",
    error: "red",
  },
} as const;

/**
 * Text props with theme applied
 */
export const themedText = {
  default: {
    color: theme.colors.text,
    backgroundColor: theme.colors.bg,
  },
  muted: {
    color: theme.colors.textMuted,
    backgroundColor: theme.colors.bg,
  },
  highlight: {
    color: theme.colors.textHighlight,
    backgroundColor: theme.colors.bg,
  },
  success: {
    color: theme.colors.success,
    backgroundColor: theme.colors.bg,
  },
  error: {
    color: theme.colors.error,
    backgroundColor: theme.colors.bg,
  },
  warning: {
    color: theme.colors.warning,
    backgroundColor: theme.colors.bg,
  },
  primary: {
    color: theme.colors.primary,
    backgroundColor: theme.colors.bg,
  },
} as const;

/**
 * Box props with theme applied
 */
export const themedBox = {
  default: {
    backgroundColor: theme.colors.bg,
  },
  bordered: {
    borderStyle: "single" as const,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.bg,
  },
  success: {
    borderStyle: "single" as const,
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.bg,
  },
  error: {
    borderStyle: "single" as const,
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.bg,
  },
  warning: {
    borderStyle: "single" as const,
    borderColor: theme.colors.warning,
    backgroundColor: theme.colors.bg,
  },
  solid: {
    backgroundColor: theme.colors.bg,
  },
} as const;
