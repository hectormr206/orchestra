# TUI Transparency Fix

## Issue

The Orchestra TUI was not visible correctly in terminals with transparency enabled. Text using "white" and "gray" colors would blend into transparent backgrounds, making the interface unreadable.

## Solution

Applied the following fixes to improve contrast and visibility:

### 1. Added Background Colors

All text elements now have `backgroundColor="black"` to ensure they remain visible on transparent terminals.

### 2. Replaced Low-Contrast Colors

- **Before**: Used "white" and "gray" colors
- **After**: Replaced with "cyan", "blue", "yellow", and other vibrant colors

### 3. Created Theme Utility

Created `src/tui/utils/theme.ts` with:
- Predefined color palette for consistency
- Themed text props
- Themed box props
- Easy-to-use constants for all components

### 4. Updated Components

Modified the following components:

#### Dashboard (`src/tui/screens/Dashboard.tsx`)
- Stats numbers: Added black background
- Stats labels: Changed from gray to colored (cyan, green, red, blue)
- Keyboard shortcuts: Added black background to keys and text
- Footer hint: Added yellow color with black background

#### Menu (`src/tui/components/Menu.tsx`)
- Menu items: Changed from white/gray to cyan
- Selected indicator: Remains green for visibility
- Added black background to all text elements

#### Header (`src/tui/components/Header.tsx`)
- ASCII logo: Added black background to all lines
- Subtitle: Changed from gray to cyan with black background
- Compact mode: Added black background

#### StatusBar (`src/tui/components/StatusBar.tsx`)
- File name display: Changed from gray to cyan
- Session ID: Changed from gray to cyan
- Added black background to entire component

#### ProgressBar (`src/tui/components/ProgressBar.tsx`)
- Label: Changed from white to cyan
- Percentage: Changed from white to cyan
- Empty bar: Changed from gray to cyan
- Added black background to all elements

#### App (`src/tui/App.tsx`)
- Main container: Added black background

## Testing

To test the changes:

```bash
npm run build
npm run tui
```

The interface should now be clearly visible in terminals with:
- Transparency enabled
- Custom background images
- Various color schemes

## Theme Usage (Future Components)

For new components, import and use the theme utility:

```typescript
import { themedText, themedBox } from '../utils/theme.js';

// For text
<Text {...themedText.default}>Normal text</Text>
<Text {...themedText.highlight}>Highlighted text</Text>
<Text {...themedText.success}>Success message</Text>

// For boxes
<Box {...themedBox.bordered}>Content</Box>
<Box {...themedBox.success}>Success box</Box>
```

## Color Palette

The new color scheme prioritizes visibility:

- **Primary**: Cyan - Main text and borders
- **Success**: Green - Completed states
- **Warning**: Yellow - Important info
- **Error**: Red - Error states
- **Info**: Blue - Muted text
- **Background**: Black - All backgrounds

All colors are chosen to have high contrast against both light and dark terminal backgrounds.
