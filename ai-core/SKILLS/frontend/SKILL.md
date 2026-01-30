---
name: frontend
description: >
  Universal frontend patterns: component architecture, state management,
  accessibility, responsive design, performance optimization.
  Trigger: When creating UI components, managing state, or optimizing frontend performance.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Creating UI components"
    - "Managing frontend state"
    - "Implementing responsive design"
allowed-tools: [Read,Edit,Write,Grep]
---

## When to Use

- Building reusable UI components
- Managing application state
- Implementing forms and validation
- Optimizing bundle size
- Implementing accessibility (a11y)
- Handling responsive layouts

---

## Critical Patterns

### > **ALWAYS**

1. **Components should be small and focused**
   - Single responsibility
   - < 200 lines ideal
   - Reusable when possible

2. **Prop drilling = consider context/state management**
   ```
   If props pass through >2 levels without modification → use context/store
   ```

3. **Accessibility first**
   - Semantic HTML (`<button>` not `<div>`)
   - ARIA labels where needed
   - Keyboard navigation
   - Color contrast 4.5:1 minimum
   - Alt text for images

4. **Mobile-first responsive design**
   ```css
   /* Default: mobile */
   .container { padding: 1rem; }

   /* Tablet+ */
   @media (min-width: 768px) {
     .container { padding: 2rem; }
   }
   ```

5. **Handle loading and error states**
   ```tsx
   {isLoading && <Spinner />}
   {error && <ErrorMessage>{error}</ErrorMessage>}
   {data && <DataDisplay data={data} />}
   ```

6. **Optimize images**
   - WebP format preferred
   - Lazy load below-fold images
   - Responsive images with `srcset`

7. **Debounce user input**
   - Search boxes
   - Auto-save
   - Resize handlers

### > **NEVER**

1. **Don't mutate props/state directly**
   ```javascript
   // WRONG
   props.user.name = "Alice";

   // RIGHT
   setUser({...user, name: "Alice"});
   ```

2. **Don't hardcode strings (i18n)**
   ```javascript
   // WRONG
   <h1>Welcome</h1>

   // RIGHT
   <h1>{t('welcome')}</h1>
   ```

3. **Don't ignore TypeScript/types**
   - Type your props
   - Type your API responses

4. **Don't nest components too deep**
   - >5 levels = refactor
   - Extract sub-components

5. **Don't use `any`**
   - Use `unknown` if truly unknown
   - Create proper types

---

## Component Structure

```typescript
// MyComponent.tsx
interface MyComponentProps {
  title: string;
  onSave: (data: Data) => void;
}

export function MyComponent({ title, onSave }: MyComponentProps) {
  // 1. State
  const [data, setData] = useState<Data>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  // 2. Effects
  useEffect(() => {
    fetchData().then(setData);
  }, []);

  // 3. Handlers
  const handleSave = async () => {
    setIsLoading(true);
    await onSave(data);
    setIsLoading(false);
  };

  // 4. Render
  return (
    <div>
      <h1>{title}</h1>
      {isLoading ? <Spinner /> : <Form data={data} onChange={setData} />}
      <button onClick={handleSave} disabled={isLoading}>
        Save
      </button>
    </div>
  );
}
```

---

## State Management Decision Tree

```
Is it UI state (toggles, modals)?
  → Yes: Use local useState/useReducer

Is it shared across components?
  → Yes: Use Context API

Is it complex/global (auth, cart)?
  → Yes: Use state management library (Zustand, Redux, Jotai)

Is it server data?
  → Yes: Use data fetching library (React Query, SWR)
```

---

## Performance Checklist

- [ ] Code splitting for routes
- [ ] Lazy load heavy components
- [ ] Memoize expensive calculations
- [ ] Virtualize long lists (react-window, react-virtual)
- [ ] Optimize images (WebP, lazy load)
- [ ] Minimize re-renders (React.memo, useMemo, useCallback)
- [ ] Analyze bundle (webpack-bundle-analyzer)
- [ ] Enable compression (gzip/brotli)

---

## Accessibility (a11y) Checklist

```html
<!-- Semantic HTML -->
<button>Submit</button>  <!-- NOT: <div onclick="..."> -->

<!-- ARIA labels -->
<button aria-label="Close dialog">×</button>

<!-- Keyboard navigation -->
<div tabIndex={0} role="button" onKeyDown={(e) => e.key === 'Enter' && onClick()}>

<!-- Alt text -->
<img src="chart.png" alt="Sales increased 25% in Q4">

<!-- Focus management -->
{isOpen && <Modal ref={modalRef} autoFocus />}
```

---

## Commands

```bash
# Analyze bundle size
npm run build -- --analyze

# Check for accessibility issues
npm run lint:a11y

# Run Lighthouse audit
npx lighthouse http://localhost:3000

# Type checking
npm run type-check
```

---

## Resources

- **Web.dev**: [web.dev/performance](https://web.dev/performance)
- **a11y Project**: [a11yproject.com](https://www.a11yproject.com)
- **React Docs**: [react.dev](https://react.dev)

---

## Examples

### Example 1: Building Accessible React Component

**User request:** "Create accessible form component in React"

```jsx
import { useState, forwardRef } from 'react';

const FormInput = forwardRef(({
  label,
  error,
  hint,
  required,
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false);
  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className="form-group">
      <label htmlFor={inputId}>
        {label}
        {required && <span aria-label="required" className="required">*</span>}
      </label>

      {hint && (
        <span id={hintId} className="hint">
          {hint}
        </span>
      )}

      <input
        ref={ref}
        id={inputId}
        aria-describedby={
          [
            hint ? hintId : null,
            error ? errorId : null
          ].filter(Boolean).join(' ') || undefined
        }
        aria-invalid={!!error}
        aria-required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />

      {error && (
        <span id={errorId} className="error" role="alert" aria-live="polite">
          {error}
        </span>
      )}
    </div>
  );
});

// Usage
<FormInput
  label="Email"
  type="email"
  required
  hint="We'll never share your email"
  error={errors.email}
  {...register('email')}
/>
