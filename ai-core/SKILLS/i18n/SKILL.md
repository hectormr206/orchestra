---
name: i18n
description: >
  Internationalization and localization: multi-language support, RTL layouts,
  date/time/currency formatting, pluralization, translation workflows.
  Trigger: When implementing multi-language support or localization.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Implementing multi-language support"
    - "Formatting dates, times, or currencies"
    - "Supporting RTL languages"
    - "Managing translations"
    - "Localizing content"
allowed-tools: [Read,Edit,Write,Grep,Bash]
---

## When to Use

- Building applications for international users
- Implementing multi-language support
- Formatting dates, times, numbers, currencies
- Supporting right-to-left languages
- Managing translation workflows

---

## Critical Patterns

### > **ALWAYS**

1. **Externalize ALL user-facing strings**
   ```javascript
   // WRONG: Hardcoded strings
   const message = "Welcome back, " + userName;

   // RIGHT: Externalized with interpolation
   const message = t('welcome.back', { name: userName });
   // en.json: { "welcome.back": "Welcome back, {{name}}" }
   // es.json: { "welcome.back": "Bienvenido de nuevo, {{name}}" }
   ```

2. **Use ICU MessageFormat for complex strings**
   ```javascript
   // Pluralization
   {
     "items.count": "{count, plural, =0 {No items} one {# item} other {# items}}"
   }

   // Gender
   {
     "user.greeting": "{gender, select, male {He} female {She} other {They}} liked your post"
   }

   // Combined
   {
     "photos.shared": "{name} shared {count, plural, =0 {no photos} one {a photo} other {# photos}}"
   }
   ```

3. **Use Intl APIs for formatting**
   ```javascript
   // Dates
   const date = new Intl.DateTimeFormat('de-DE', {
     dateStyle: 'full',
     timeStyle: 'short'
   }).format(new Date());
   // "Montag, 15. Januar 2024 um 14:30"

   // Numbers
   const number = new Intl.NumberFormat('de-DE').format(1234567.89);
   // "1.234.567,89"

   // Currency
   const price = new Intl.NumberFormat('ja-JP', {
     style: 'currency',
     currency: 'JPY'
   }).format(1000);
   // "¥1,000"

   // Relative time
   const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
   rtf.format(-1, 'day'); // "ayer"
   rtf.format(2, 'week'); // "dentro de 2 semanas"
   ```

4. **Design UI for text expansion**
   ```
   ┌─────────────────────────────────────────────┐
   │ TEXT EXPANSION BY LANGUAGE                  │
   │                                             │
   │ English (base)     →  100%                  │
   │ German             →  130%                  │
   │ French             →  120%                  │
   │ Finnish            →  130-150%              │
   │ Japanese/Chinese   →  80-90%                │
   │ Arabic             →  120-130%              │
   │                                             │
   │ DESIGN RULE: Allow 50% extra space          │
   └─────────────────────────────────────────────┘
   ```

5. **Detect and handle RTL languages**
   ```html
   <!-- Dynamic direction based on language -->
   <html lang="ar" dir="rtl">

   <!-- Or per-element -->
   <p dir="auto">مرحبا</p>
   ```

### > **NEVER**

1. **Concatenate strings for translations**
   ```javascript
   // WRONG: Breaks in many languages
   t('you_have') + count + t('messages')

   // RIGHT: Full sentence with placeholder
   t('you_have_messages', { count })
   ```

2. **Assume date/number formats**
   ```javascript
   // WRONG
   const date = `${month}/${day}/${year}`;

   // RIGHT
   new Intl.DateTimeFormat(locale).format(date);
   ```

3. **Hardcode currency symbols**
4. **Assume left-to-right text direction**
5. **Split sentences across multiple keys**
6. **Use flags to represent languages**

---

## Project Structure

### Translation Files

```
locales/
├── en/
│   ├── common.json      # Shared strings
│   ├── auth.json        # Auth-related
│   ├── dashboard.json   # Dashboard page
│   └── errors.json      # Error messages
├── es/
│   ├── common.json
│   ├── auth.json
│   └── ...
├── ar/                  # RTL language
│   └── ...
└── zh-CN/               # Chinese Simplified
    └── ...
```

### Key Naming Conventions

```json
{
  "namespace.component.element.state": "Translation",

  "auth.login.button.submit": "Sign In",
  "auth.login.button.loading": "Signing in...",
  "auth.login.error.invalid_credentials": "Invalid email or password",

  "dashboard.header.welcome": "Welcome, {{name}}",
  "dashboard.stats.users": "{count, plural, one {# user} other {# users}}",

  "common.actions.save": "Save",
  "common.actions.cancel": "Cancel",
  "common.actions.delete": "Delete"
}
```

---

## Framework Integration

### React (react-i18next)

```typescript
// i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'es', 'de', 'ar', 'zh'],
    ns: ['common', 'auth', 'dashboard'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,  // React already escapes
    },
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator'],
      caches: ['localStorage', 'cookie'],
    },
  });

// Component usage
import { useTranslation, Trans } from 'react-i18next';

function Welcome({ user }) {
  const { t, i18n } = useTranslation();

  return (
    <div>
      {/* Simple translation */}
      <h1>{t('dashboard.header.welcome', { name: user.name })}</h1>

      {/* With components (for embedded links, bold, etc.) */}
      <Trans i18nKey="terms.agreement">
        By signing up, you agree to our <a href="/terms">Terms</a>
      </Trans>

      {/* Pluralization */}
      <p>{t('dashboard.stats.users', { count: user.count })}</p>

      {/* Language switcher */}
      <select
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
      >
        <option value="en">English</option>
        <option value="es">Español</option>
        <option value="ar">العربية</option>
      </select>
    </div>
  );
}
```

### Next.js (next-intl)

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'es', 'de'],
  defaultLocale: 'en',
  localePrefix: 'as-needed'
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};

// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function LocaleLayout({
  children,
  params: { locale }
}) {
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

// Component usage
import { useTranslations } from 'next-intl';

export default function Page() {
  const t = useTranslations('Dashboard');
  return <h1>{t('title')}</h1>;
}
```

### Backend (Python)

```python
from babel import Locale, numbers, dates
from babel.support import Translations
import gettext

# Load translations
def get_translator(locale: str):
    translations = Translations.load('locales', [locale])
    return translations.gettext

# Usage
_ = get_translator('es')
message = _("Welcome back!")

# Formatting
from babel.numbers import format_currency, format_decimal
from babel.dates import format_datetime

# Currency
format_currency(1234.56, 'EUR', locale='de_DE')  # "1.234,56 €"
format_currency(1234.56, 'JPY', locale='ja_JP')  # "¥1,235"

# Numbers
format_decimal(1234567.89, locale='de_DE')  # "1.234.567,89"

# Dates
format_datetime(datetime.now(), locale='es_ES')
# "15 de enero de 2024, 14:30:00"
```

---

## RTL Support

### CSS for RTL

```css
/* Use logical properties (recommended) */
.container {
  /* Instead of margin-left, use: */
  margin-inline-start: 1rem;

  /* Instead of padding-right, use: */
  padding-inline-end: 1rem;

  /* Instead of text-align: left, use: */
  text-align: start;

  /* Instead of float: left, use: */
  float: inline-start;
}

/* Directional overrides when needed */
[dir="rtl"] .icon-arrow {
  transform: scaleX(-1);
}

/* Flexbox automatically flips */
.flex-container {
  display: flex;
  /* Items will reverse in RTL */
}

/* Grid with named areas works automatically */
.grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  /* Columns flip in RTL */
}
```

### RTL Considerations

```
┌─────────────────────────────────────────────┐
│ RTL CHECKLIST                               │
├─────────────────────────────────────────────┤
│ ✓ Navigation flows right-to-left           │
│ ✓ Icons that indicate direction flip       │
│ ✓ Progress bars fill from right            │
│ ✓ Form labels on right side                │
│ ✓ Checkmarks stay on left (cultural)       │
│ ✓ Numbers remain LTR (123 not ٣٢١)         │
│ ✓ Phone numbers remain LTR                 │
│ ✓ Quotation marks change direction         │
└─────────────────────────────────────────────┘
```

---

## Translation Workflow

### Workflow Overview

```
┌─────────────────────────────────────────────┐
│ TRANSLATION WORKFLOW                        │
├─────────────────────────────────────────────┤
│ 1. Developer adds key + English string      │
│ 2. CI extracts new keys to JSON/PO          │
│ 3. Keys pushed to TMS (Crowdin, Lokalise)   │
│ 4. Translators translate in TMS             │
│ 5. CI pulls translations back               │
│ 6. PR created with new translations         │
│ 7. Review and merge                         │
└─────────────────────────────────────────────┘
```

### Key Extraction Script

```javascript
// i18next-parser.config.js
module.exports = {
  locales: ['en', 'es', 'de', 'ar'],
  output: 'locales/$LOCALE/$NAMESPACE.json',
  input: ['src/**/*.{ts,tsx}'],
  defaultNamespace: 'common',
  keySeparator: '.',
  namespaceSeparator: ':',
  // Add context for translators
  contextSeparator: '_',
  createOldCatalogs: false,
  keepRemoved: false,
};
```

### Translation Management Systems

| Tool | Pricing | Features |
|------|---------|----------|
| **Crowdin** | Free OSS | Git sync, in-context |
| **Lokalise** | Paid | Figma plugin, QA |
| **Phrase** | Paid | Enterprise, API |
| **POEditor** | Freemium | Simple, affordable |
| **Transifex** | Paid | Large teams |

---

## Pluralization Rules

### Complex Pluralization (Slavic languages)

```javascript
// Russian has 3 plural forms
{
  "items": "{count, plural, one {# предмет} few {# предмета} many {# предметов} other {# предмета}}"
}

// Arabic has 6 plural forms
{
  "items": "{count, plural, zero {لا عناصر} one {عنصر واحد} two {عنصران} few {# عناصر} many {# عنصرًا} other {# عنصر}}"
}
```

### Ordinals

```javascript
// English ordinals
{
  "place": "{position, selectordinal, one {#st} two {#nd} few {#rd} other {#th}} place"
}
// 1st place, 2nd place, 3rd place, 4th place
```

---

## Date/Time Formatting

### Timezone Handling

```typescript
// Always store in UTC
const utcDate = new Date().toISOString();
// "2024-01-15T14:30:00.000Z"

// Display in user's timezone
const userDate = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  dateStyle: 'full',
  timeStyle: 'long'
}).format(new Date(utcDate));
// "Monday, January 15, 2024 at 9:30:00 AM EST"

// Relative formatting
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
rtf.format(-1, 'day');  // "yesterday"
rtf.format(0, 'day');   // "today"
rtf.format(1, 'day');   // "tomorrow"
```

### Calendar Systems

```javascript
// Different calendars
new Intl.DateTimeFormat('ar-SA-u-ca-islamic').format(new Date());
// "٦ رجب ١٤٤٥ هـ"

new Intl.DateTimeFormat('th-TH-u-ca-buddhist').format(new Date());
// "15 ม.ค. 2567"

new Intl.DateTimeFormat('ja-JP-u-ca-japanese').format(new Date());
// "令和6年1月15日"
```

---

## Testing I18n

### Unit Tests

```typescript
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from './test-i18n';  // Test i18n instance

describe('Localization', () => {
  it('renders translations correctly', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Welcome name="John" />
      </I18nextProvider>
    );

    expect(screen.getByText('Welcome, John')).toBeInTheDocument();
  });

  it('handles pluralization', () => {
    i18n.changeLanguage('en');
    expect(i18n.t('items', { count: 1 })).toBe('1 item');
    expect(i18n.t('items', { count: 5 })).toBe('5 items');
  });

  it('formats numbers correctly', () => {
    expect(formatNumber(1234.56, 'de-DE')).toBe('1.234,56');
    expect(formatNumber(1234.56, 'en-US')).toBe('1,234.56');
  });
});
```

### Pseudo-localization

```javascript
// Extend strings to test UI expansion
function pseudoLocalize(str) {
  const accents = {
    'a': 'àáâãäå', 'e': 'èéêë', 'i': 'ìíîï',
    'o': 'òóôõö', 'u': 'ùúûü'
  };

  return '[!!' + str.split('').map(c =>
    accents[c.toLowerCase()] ?
      accents[c.toLowerCase()][0] : c
  ).join('') + '!!]';
}

pseudoLocalize("Hello World");
// "[!!Hèllò Wòrld!!]"
```

---

## Commands

```bash
# Extract translation keys
npx i18next-parser

# Sort translation files
npx sort-json locales/en/*.json

# Find missing translations
npx i18next-scanner

# Validate JSON syntax
npx jsonlint locales/en/common.json

# Compare translation files
diff <(jq -S . locales/en/common.json) <(jq -S . locales/es/common.json)
```

---

## Resources

- **ICU MessageFormat**: [unicode.org/reports/tr35](https://unicode.org/reports/tr35/tr35-messageFormat.html)
- **CLDR**: [cldr.unicode.org](https://cldr.unicode.org/)
- **i18next**: [i18next.com](https://www.i18next.com/)
- **FormatJS**: [formatjs.io](https://formatjs.io/)
- **MDN Intl**: [developer.mozilla.org/Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)

---

## Examples

### Example 1: React i18n Implementation

**User request:** "Add internationalization to React app"

```jsx
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Trans } from 'react-i18next';

// Initialize
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          "welcome": "Welcome to {{appName}}",
          "login": "Log in",
          "userCount": "{{count}} user",
          "userCount_plural": "{{count}} users"
        }
      },
      es: {
        translation: {
          "welcome": "Bienvenido a {{appName}}",
          "login": "Iniciar sesión",
          "userCount": "{{count}} usuario",
          "userCount_plural": "{{count}} usuarios"
        }
      }
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

// Usage in component
function Welcome() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('welcome', { appName: 'MyApp' })}</h1>
      <button>{t('login')}</button>
      <p>{t('userCount', { count: 5 })}</p>
    </div>
  );
}

// With Trans for complex content
function Message() {
  return (
    <Trans i18nKey="welcome">
      Welcome to <strong>MyApp</strong>, the best app!
    </Trans>
  );
}
