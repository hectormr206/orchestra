---
name: accessibility
description: >
  Web accessibility patterns: WCAG 2.1 AA/AAA, ADA compliance, Section 508,
  screen readers, keyboard navigation, ARIA, inclusive design.
  Trigger: When building UI components or ensuring legal compliance.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Building UI components"
    - "Implementing forms or interactive elements"
    - "Ensuring accessibility compliance"
    - "Auditing for WCAG compliance"
    - "Adding ARIA attributes"
allowed-tools: [Read,Edit,Write,Grep,Bash]
---

## When to Use

- Building any user interface
- Creating forms and interactive elements
- Ensuring legal compliance (ADA, Section 508)
- Auditing existing applications
- Implementing inclusive design

---

## Critical Patterns

### > **ALWAYS**

1. **Semantic HTML first**
   ```html
   <!-- WRONG: div soup -->
   <div class="button" onclick="submit()">Submit</div>
   <div class="header">Welcome</div>

   <!-- RIGHT: semantic elements -->
   <button type="submit">Submit</button>
   <h1>Welcome</h1>
   ```

2. **Keyboard accessibility**
   ```
   ┌─────────────────────────────────────────────┐
   │ ALL interactive elements MUST be:          │
   │                                             │
   │ ✓ Focusable (Tab to reach)                 │
   │ ✓ Operable (Enter/Space to activate)       │
   │ ✓ Have visible focus indicator             │
   │ ✓ Follow logical tab order                 │
   │ ✓ Not trap focus (except modals)           │
   └─────────────────────────────────────────────┘
   ```

3. **Color contrast ratios**
   ```
   WCAG AA Requirements:
   - Normal text: 4.5:1 minimum
   - Large text (18pt+): 3:1 minimum
   - UI components: 3:1 minimum

   WCAG AAA Requirements:
   - Normal text: 7:1 minimum
   - Large text: 4.5:1 minimum
   ```

4. **Alternative text for images**
   ```html
   <!-- Informative image -->
   <img src="chart.png" alt="Sales increased 25% in Q4 2024">

   <!-- Decorative image -->
   <img src="decoration.png" alt="" role="presentation">

   <!-- Complex image -->
   <figure>
     <img src="complex-chart.png" alt="Quarterly revenue comparison">
     <figcaption>
       Detailed description: Q1: $1M, Q2: $1.2M, Q3: $1.5M, Q4: $2M
     </figcaption>
   </figure>
   ```

5. **Form labels and error handling**
   ```html
   <!-- Every input MUST have a label -->
   <label for="email">Email address</label>
   <input
     type="email"
     id="email"
     name="email"
     required
     aria-describedby="email-error email-hint"
   >
   <span id="email-hint">We'll never share your email</span>
   <span id="email-error" role="alert" aria-live="polite">
     Please enter a valid email address
   </span>
   ```

### > **NEVER**

1. **Rely on color alone to convey information**
   ```html
   <!-- WRONG -->
   <span style="color: red;">Error</span>

   <!-- RIGHT -->
   <span style="color: red;">
     <span aria-hidden="true">⚠</span> Error: Invalid input
   </span>
   ```

2. **Remove focus outlines without replacement**
   ```css
   /* WRONG */
   *:focus { outline: none; }

   /* RIGHT */
   *:focus {
     outline: 2px solid #005fcc;
     outline-offset: 2px;
   }

   /* Or custom focus style */
   *:focus-visible {
     box-shadow: 0 0 0 3px rgba(0, 95, 204, 0.5);
   }
   ```

3. **Use placeholder as label**
4. **Create mouse-only interactions**
5. **Auto-play media without controls**
6. **Use CAPTCHA without alternatives**

---

## WCAG 2.1 Quick Reference

### Four Principles (POUR)

| Principle | Description | Examples |
|-----------|-------------|----------|
| **Perceivable** | Users can perceive content | Alt text, captions, contrast |
| **Operable** | Users can navigate/interact | Keyboard, timing, seizures |
| **Understandable** | Users can understand | Readable, predictable, errors |
| **Robust** | Works with assistive tech | Valid HTML, ARIA |

### Compliance Levels

```
┌─────────────────────────────────────────────┐
│ LEVEL A (Minimum)                           │
│ → Basic accessibility                       │
│ → 30 success criteria                       │
│ → Legal minimum in most cases               │
├─────────────────────────────────────────────┤
│ LEVEL AA (Recommended)                      │
│ → Standard compliance target                │
│ → 20 additional criteria                    │
│ → Required by most regulations              │
├─────────────────────────────────────────────┤
│ LEVEL AAA (Enhanced)                        │
│ → Highest accessibility                     │
│ → 28 additional criteria                    │
│ → Often impractical for entire sites        │
└─────────────────────────────────────────────┘
```

---

## Legal Requirements

| Regulation | Scope | Standard | Penalties |
|------------|-------|----------|-----------|
| **ADA** (USA) | Public accommodations | WCAG 2.0/2.1 AA | Lawsuits, fines |
| **Section 508** (USA) | Federal agencies | WCAG 2.0 AA | Contract loss |
| **EAA** (EU) | Products & services | EN 301 549 | Fines up to 4% revenue |
| **AODA** (Canada-ON) | Organizations 50+ | WCAG 2.0 AA | $100K/day fines |
| **DDA** (UK) | Service providers | WCAG 2.1 AA | Legal action |

---

## Component Patterns

### Accessible Button

```jsx
// React example
function Button({ children, onClick, disabled, loading }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-disabled={disabled}
    >
      {loading ? (
        <>
          <span className="sr-only">Loading</span>
          <Spinner aria-hidden="true" />
        </>
      ) : (
        children
      )}
    </button>
  );
}
```

### Accessible Modal

```jsx
function Modal({ isOpen, onClose, title, children }) {
  const modalRef = useRef(null);

  // Trap focus inside modal
  useEffect(() => {
    if (isOpen) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      firstElement?.focus();

      const handleTab = (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleTab);
      return () => document.removeEventListener('keydown', handleTab);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      ref={modalRef}
    >
      <h2 id="modal-title">{title}</h2>
      {children}
      <button onClick={onClose} aria-label="Close modal">
        ✕
      </button>
    </div>
  );
}
```

### Accessible Form

```html
<form aria-labelledby="form-title">
  <h2 id="form-title">Contact Us</h2>

  <!-- Required field with instructions -->
  <p id="required-note">
    <span aria-hidden="true">*</span> indicates required field
  </p>

  <!-- Text input -->
  <div class="form-group">
    <label for="name">
      Name <span aria-hidden="true">*</span>
      <span class="sr-only">(required)</span>
    </label>
    <input
      type="text"
      id="name"
      name="name"
      required
      aria-required="true"
      autocomplete="name"
    >
  </div>

  <!-- Select with group -->
  <div class="form-group">
    <label for="country">Country</label>
    <select id="country" name="country" autocomplete="country">
      <optgroup label="North America">
        <option value="us">United States</option>
        <option value="ca">Canada</option>
      </optgroup>
      <optgroup label="Europe">
        <option value="uk">United Kingdom</option>
        <option value="de">Germany</option>
      </optgroup>
    </select>
  </div>

  <!-- Checkbox group -->
  <fieldset>
    <legend>Communication preferences</legend>
    <div>
      <input type="checkbox" id="email-pref" name="comm" value="email">
      <label for="email-pref">Email</label>
    </div>
    <div>
      <input type="checkbox" id="phone-pref" name="comm" value="phone">
      <label for="phone-pref">Phone</label>
    </div>
  </fieldset>

  <button type="submit">Send Message</button>
</form>
```

### Accessible Navigation

```html
<nav aria-label="Main navigation">
  <ul role="menubar">
    <li role="none">
      <a href="/" role="menuitem" aria-current="page">Home</a>
    </li>
    <li role="none">
      <button
        role="menuitem"
        aria-haspopup="true"
        aria-expanded="false"
        aria-controls="products-menu"
      >
        Products
      </button>
      <ul id="products-menu" role="menu" hidden>
        <li role="none">
          <a href="/products/a" role="menuitem">Product A</a>
        </li>
        <li role="none">
          <a href="/products/b" role="menuitem">Product B</a>
        </li>
      </ul>
    </li>
  </ul>
</nav>

<!-- Skip link (first element in body) -->
<a href="#main-content" class="skip-link">
  Skip to main content
</a>
```

---

## ARIA Guidelines

### When to Use ARIA

```
┌─────────────────────────────────────────────┐
│ ARIA RULES                                  │
├─────────────────────────────────────────────┤
│ 1. Don't use ARIA if native HTML works      │
│    <button> NOT <div role="button">         │
│                                             │
│ 2. Don't change native semantics            │
│    <h1 role="button"> is wrong              │
│                                             │
│ 3. All interactive ARIA needs keyboard      │
│    role="button" needs Enter/Space handler  │
│                                             │
│ 4. Don't hide focusable elements            │
│    aria-hidden="true" on focusable = bad    │
│                                             │
│ 5. Interactive elements need names          │
│    aria-label or aria-labelledby            │
└─────────────────────────────────────────────┘
```

### Common ARIA Patterns

| Pattern | ARIA | Use Case |
|---------|------|----------|
| **Live region** | `aria-live="polite"` | Dynamic content updates |
| **Alert** | `role="alert"` | Important messages |
| **Tab panel** | `role="tablist/tab/tabpanel"` | Tab interfaces |
| **Expanded** | `aria-expanded="true/false"` | Accordions, dropdowns |
| **Current** | `aria-current="page"` | Current page in nav |
| **Described by** | `aria-describedby` | Additional descriptions |

---

## Testing Accessibility

### Automated Testing

```javascript
// Jest + Testing Library
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('component has no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

// Cypress with axe
describe('Accessibility', () => {
  it('has no detectable a11y violations', () => {
    cy.visit('/');
    cy.injectAxe();
    cy.checkA11y();
  });
});
```

### Manual Testing Checklist

```
KEYBOARD TESTING
□ Can Tab through all interactive elements
□ Tab order is logical
□ Focus indicator is visible
□ Can activate with Enter/Space
□ Can escape from modals
□ No keyboard traps

SCREEN READER TESTING
□ All images have alt text
□ Headings form logical outline
□ Links have descriptive text
□ Forms are labeled
□ Dynamic content is announced
□ Landmark regions present

VISUAL TESTING
□ Color contrast meets requirements
□ Text is resizable to 200%
□ Content works at 320px width
□ No horizontal scrolling at 400% zoom
□ Animations can be disabled
```

### Tools

```
AUTOMATED SCANNERS
- axe DevTools (browser extension)
- WAVE (wave.webaim.org)
- Lighthouse (Chrome DevTools)
- Pa11y (CLI tool)

SCREEN READERS
- NVDA (Windows, free)
- VoiceOver (Mac/iOS, built-in)
- JAWS (Windows, paid)
- TalkBack (Android, built-in)

COLOR CONTRAST
- WebAIM Contrast Checker
- Colour Contrast Analyser
- Stark (Figma plugin)
```

---

## Screen Reader Only Text

```css
/* Visually hidden but accessible to screen readers */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Allow focus for skip links */
.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| `<div onclick>` | Not keyboard accessible | Use `<button>` |
| Missing alt text | Image not described | Add meaningful alt |
| `outline: none` | No focus indicator | Custom focus style |
| Color-only info | Colorblind users miss it | Add icons/text |
| Auto-playing video | Disorienting | Pause by default |
| Infinite scroll | Can't reach footer | Provide alternative |
| Click here links | No context | Descriptive text |

---

## Commands

```bash
# Pa11y CLI
npx pa11y https://example.com
npx pa11y --reporter=html https://example.com > report.html

# Lighthouse CI
npx lighthouse https://example.com --output=html --output-path=./report.html

# axe-core CLI
npx @axe-core/cli https://example.com

# Check color contrast
npx color-contrast-checker "#ffffff" "#000000"
```

---

## Resources

- **WCAG 2.1**: [w3.org/WAI/WCAG21/quickref](https://www.w3.org/WAI/WCAG21/quickref/)
- **ARIA Authoring Practices**: [w3.org/WAI/ARIA/apg](https://www.w3.org/WAI/ARIA/apg/)
- **WebAIM**: [webaim.org](https://webaim.org/)
- **A11y Project**: [a11yproject.com](https://www.a11yproject.com/)
- **Inclusive Components**: [inclusive-components.design](https://inclusive-components.design/)

---

## Examples

### Example 1: Making a Form Accessible

**User request:** "Create a login form that's accessible"

**Implementation:**

```html
<form aria-labelledby="login-heading">
  <h2 id="login-heading">Log in to your account</h2>

  <div class="form-group">
    <label for="email">
      Email address
      <span class="required" aria-label="required">*</span>
    </label>
    <input
      type="email"
      id="email"
      name="email"
      required
      autocomplete="email"
      aria-describedby="email-hint"
      aria-invalid="false"
    >
    <span id="email-hint" class="hint">
      We'll never share your email with anyone else
    </span>
  </div>

  <div class="form-group">
    <label for="password">
      Password
      <span class="required" aria-label="required">*</span>
    </label>
    <input
      type="password"
      id="password"
      name="password"
      required
      autocomplete="current-password"
      aria-describedby="password-requirements"
      minlength="8"
    >
    <span id="password-requirements" class="hint">
      Must be at least 8 characters
    </span>
  </div>

  <button type="submit" name="login">Log in</button>
  <button type="button" name="cancel">Cancel</button>
</form>
```

**Accessibility checklist:**
- ✅ Semantic HTML (form, label, input, button)
- ✅ All inputs have associated labels
- ✅ Required fields marked visibly and with aria-label
- ✅ Descriptive hints with aria-describedby
- ✅ Autocomplete attributes for password managers
- ✅ Two buttons with different types (submit vs button)
- ✅ Form has descriptive heading with aria-labelledby
