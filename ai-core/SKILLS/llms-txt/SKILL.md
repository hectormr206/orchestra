# llms.txt

> **Standard for LLM-friendly website documentation** - `/llms.txt` file specification.
> Helps LLMs understand and use websites effectively through structured Markdown files.

## Overview

**llms.txt** is a proposed standard for adding a `/llms.txt` file to websites that provides LLM-friendly content. This file offers brief background information, guidance, and links to detailed markdown files.

### Why llms.txt?

- **Context windows are limited** - LLMs can't handle entire websites
- **HTML is LLM-hostile** - Navigation, ads, JS make parsing difficult
- **Structured information** - Curated, concise content in one place
- **Inference-time useful** - Helps when users actively seek assistance

### Key Benefits

| Use Case | Benefit |
|----------|---------|
| **Development** | Quick access to programming documentation and APIs |
| **Business** | Structure, services, pricing, policies |
| **E-commerce** | Product information, return policies |
| **Restaurants** | Menus, hours, location |
| **Education** | Course information, resources |
| **Personal sites** | CV, portfolio, background |

---

## File Format Specification

### Location

```yaml
Required: /llms.txt (root of website)
Optional: Subpaths like /docs/llms.txt
```

### Structure (In Order)

```markdown
# Title (H1 - REQUIRED)

> Summary (blockquote - optional but recommended)

Additional information (paragraphs, lists, etc.)

## Section Name (H2)

- [Link Title](URL): Optional description
- [Another Link](URL): Description

## Optional (H2 - special meaning)

- [Secondary Content](URL): Can be skipped for shorter context
```

### Components

1. **H1 Title** (Required)
   ```markdown
   # Project Name
   ```

2. **Blockquote Summary** (Recommended)
   ```markdown
   > Brief summary containing key information
   ```

3. **Additional Information** (Optional)
   - Paragraphs, lists, code blocks
   - **NOT** headings (except H2 for sections)
   - Details about interpreting the files

4. **H2 Sections** (Zero or more)
   ```markdown
   ## Section Name

   - [Link](URL): Description
   - [Link 2](URL): Description 2
   ```

5. **"Optional" Section** (Special meaning)
   - URLs here can be skipped for shorter context
   - Use for secondary/supplementary information

---

## Complete Example

```markdown
# FastHTML

> FastHTML is a python library which brings together Starlette, Uvicorn, HTMX, and fastcore's `FT` "FastTags" into a library for creating server-rendered hypermedia applications.

Important notes:

- Although parts of its API are inspired by FastAPI, it is *not* compatible with FastAPI syntax and is not targeted at creating API services
- FastHTML is compatible with JS-native web components and any vanilla JS library, but not with React, Vue, or Svelte.

## Docs

- [FastHTML quick start](https://fastht.ml/docs/tutorials/quickstart_for_web_devs.html.md): A brief overview of many FastHTML features
- [HTMX reference](https://github.com/bigskysoftware/htmx/blob/master/www/content/reference.md): Brief description of all HTMX attributes, CSS classes, headers, events, extensions, js lib methods, and config options

## Examples

- [Todo list application](https://github.com/AnswerDotAI/fasthtml/blob/main/examples/adv_app.py): Detailed walk-thru of a complete CRUD app in FastHTML showing idiomatic use of FastHTML and HTMX patterns.

## Optional

- [Starlette full documentation](https://gist.githubusercontent.com/.../starlette-sml.md): A subset of the Starlette documentation useful for FastHTML development.
```

---

## Domain-Specific Examples

### Restaurant

```markdown
# Nate the Great's Grill

> Nate the Great's Grill is a popular destination off of Sesame Street that has been serving the community for over 20 years. We offer the best BBQ for a great price.

Here are our weekly hours:

- Monday - Friday: 9am - 9pm
- Saturday: 11am - 9pm
- Sunday: Closed

## Menus

- [Lunch Menu](https://host/lunch.html.md): Our lunch menu served from 11am to 4pm every day.
- [Dinner Menu](https://host/dinner.html.md): Our dinner menu served from 4pm to 9pm every day.

## Optional

- [Dessert Menu](https://host/dessert.md): Desserts and beverages
```

### Software Documentation

```markdown
# Project Name

> One-line summary of what this project does and who it's for.

Key concepts:

- Concept 1: Brief explanation
- Concept 2: Brief explanation

## Getting Started

- [Installation Guide](https://docs.example.com/install.md): Step-by-step installation
- [Quick Start](https://docs.example.com/quickstart.md): 5-minute tutorial

## API Reference

- [Core API](https://docs.example.com/api/core.md): Main API endpoints
- [Advanced](https://docs.example.com/api/advanced.md): Advanced usage

## Optional

- [Changelog](https://docs.example.com/changelog.md): Version history
- [Contributing](https://docs.example.com/contributing.md): How to contribute
```

### E-commerce

```markdown
# Store Name

> Premium quality products with fast shipping and easy returns.

Store Policies:

- Free shipping on orders over $50
- 30-day return policy
- Price match guarantee

## Products

- [New Arrivals](https://store.com/new.md): Latest products
- [Best Sellers](https://store.com/bestsellers.md): Top-rated items

## Customer Service

- [Shipping Info](https://store.com/shipping.md): Shipping times and costs
- [Returns](https://store.com/returns.md): Return policy and process
```

---

## Best Practices

### Content Guidelines

1. **Use concise, clear language**
   - Avoid ambiguous terms
   - No unexplained jargon
   - Be direct and specific

2. **Include informative descriptions**
   - Each link should have a clear purpose
   - Describe what the user will find
   - Keep descriptions brief

3. **Structure for LLM consumption**
   - Most important info first
   - Logical flow of sections
   - Use "Optional" for secondary content

4. **Test with LLMs**
   - Verify LLMs can answer questions about your content
   - Use tools like `llms_txt2ctx` to generate context
   - Test multiple LLMs if possible

### Link Format

```markdown
✅ GOOD:
- [FastHTML quick start](https://fastht.ml/docs/quickstart.md): Brief overview of features

❌ BAD:
- [click here](https://fastht.ml/docs/quickstart.md)
- [Documentation](https://fastht.ml/docs/quickstart.md)
```

### Section Organization

```yaml
Primary Sections (always include):
  - Getting Started
  - Documentation
  - Examples
  - API Reference

Secondary Sections (use "Optional"):
  - Changelog
  - Contributing
  - Troubleshooting
  - Advanced Topics
```

---

## Tools & Implementations

### Python Module & CLI

**Installation**:
```bash
pip install llms-txt
```

**CLI Usage**:
```bash
# Convert llms.txt to XML context
llms_txt2ctx llms.txt > llms.md

# Include optional section
llms_txt2ctx --optional True llms.txt > llms-full.md
```

**Python API**:
```python
from llms_txt import parse_llms_file, create_ctx

# Parse llms.txt
parsed = parse_llms_file(text)
print(parsed.title)       # "FastHTML"
print(parsed.summary)     # Summary text
print(parsed.sections)    # Dict of sections

# Create LLM context (XML format)
ctx = create_ctx(text, optional=False)
```

**Simple Parser (<20 lines)**:
```python
from pathlib import Path
import re, itertools

def chunked(it, chunk_sz):
    it = iter(it)
    return iter(lambda: list(itertools.islice(it, chunk_sz)), [])

def parse_llms_txt(txt):
    """Parse llms.txt file contents to a dict"""
    def _p(links):
        link_pat = r'-\s*\[(?P<title>[^\]]+)\]\((?P<url>[^\)]+)\)(?::\s*(?P<desc>.*))?'
        return [re.search(link_pat, l).groupdict()
                for l in re.split(r'\n+', links.strip()) if l.strip()]

    start, *rest = re.split(r'^##\s*(.*?$)', txt, flags=re.MULTILINE)
    sects = {k: _p(v) for k, v in dict(chunked(rest, 2)).items()}
    pat = r'^#\s*(?P<title>.+?$)\n+(?:^>\s*(?P<summary>.+?$)$)?\n+(?P<info>.*)'
    d = re.search(pat, start.strip(), (re.MULTILINE | re.DOTALL)).groupdict()
    d['sections'] = sects
    return d
```

### JavaScript Implementation

```javascript
// Parse llms.txt in JavaScript
function parseLlmsTxt(text) {
  const lines = text.split('\n');
  const result = {
    title: '',
    summary: '',
    info: '',
    sections: {}
  };

  let currentSection = null;
  let currentLinks = [];

  for (const line of lines) {
    // Parse H1 title
    if (line.startsWith('# ')) {
      result.title = line.substring(2);
    }
    // Parse blockquote summary
    else if (line.startsWith('> ')) {
      result.summary += line.substring(2) + '\n';
    }
    // Parse H2 sections
    else if (line.startsWith('## ')) {
      if (currentSection) {
        result.sections[currentSection] = currentLinks;
      }
      currentSection = line.substring(3);
      currentLinks = [];
    }
    // Parse links
    else if (line.match(/^- \[.*\]\(.*\)/)) {
      const match = line.match(/^- \[(.*?)\]\((.*?)\)(?::\s*(.*))?$/);
      if (match) {
        currentLinks.push({
          title: match[1],
          url: match[2],
          desc: match[3] || null
        });
      }
    }
    // Additional info
    else if (line.trim() && !line.startsWith('#')) {
      result.info += line + '\n';
    }
  }

  if (currentSection) {
    result.sections[currentSection] = currentLinks;
  }

  return result;
}
```

### Framework Plugins

#### VitePress Plugin

```bash
npm install vitepress-plugin-llms
```

```javascript
// .vitepress/config.js
import { llmsPlugin } from 'vitepress-plugin-llms';

export default {
  plugins: [
    llmsPlugin({
      // Auto-generate llms.txt from VitePress docs
      includeOptional: ['changelog', 'contributing']
    })
  ]
};
```

#### Docusaurus Plugin

```bash
npm install docusaurus-plugin-llms
```

```javascript
// docusaurus.config.js
module.exports = {
  plugins: [
    [
      'docusaurus-plugin-llms',
      {
        // Configuration
        sections: ['docs', 'blog', 'api']
      }
    ]
  ]
};
```

---

## Integration with LLMs

### Claude (Anthropic)

```python
from claudette import *
from llms_txt import create_ctx
import requests

model = models[1]  # Sonnet 3.5
chat = Chat(model, sp="You are a helpful and concise assistant.")

# Fetch and parse llms.txt
url = 'https://example.com/llms.txt'
text = requests.get(url).text
llm_ctx = create_ctx(text)

# Provide context to Claude
chat(llm_ctx + '\n\nThe above is necessary context for the conversation.')

# Now ask questions
res = chat("How do I create a simple FastHTML app?")
print(contents(res))
```

### Testing with LLMs

```python
#!/usr/bin/env python3
"""Test llms.txt with Claude"""

from claudette import *
from llms_txt import create_ctx
import requests

model = models[1]
chat = Chat(model, sp="You are a helpful and concise assistant.")

url = 'https://your-site.com/llms.txt'
text = requests.get(url).text
llm_ctx = create_ctx(text)

chat(llm_ctx + '\n\nThe above is necessary context for the conversation.')

while True:
    msg = input('Your question about the site: ')
    if not msg:
        break
    res = chat(msg)
    print('From Claude:', contents(res))
```

---

## Existing Standards Comparison

| Standard | Purpose | Format | Target Audience |
|----------|---------|--------|-----------------|
| **llms.txt** | Curated LLM context | Markdown | LLMs at inference time |
| **robots.txt** | Crawler access rules | Text | Search engine crawlers |
| **sitemap.xml** | All indexable pages | XML | Search engines |
| **README.md** | Project documentation | Markdown | Humans |

### Why not sitemap.xml?

```yaml
sitemap.xml limitations:
  - No LLM-readable versions (.md)
  - Only internal URLs
  - Too large for context windows
  - Includes unnecessary information

llms.txt advantages:
  - Curated content selection
  - External references allowed
  - Concise and focused
  - Markdown (LLM-native)
```

---

## Markdown Pages Convention

**Proposal**: Pages with useful information should have `.md` versions at the same URL.

```
HTML page:    https://example.com/docs/api.html
Markdown:     https://example.com/docs/api.html.md

Index page:   https://example.com/docs/
Markdown:     https://example.com/docs/index.html.md
```

**Benefits**:
- LLMs get clean, structured content
- No HTML parsing needed
- Maintains URL consistency
- Humans can still use HTML version

---

## Directories

Projects using llms.txt:

- **llmstxt.site** - Directory of llms.txt files
- **directory.llmstxt.cloud** - Community directory
- **FastHTML** - https://fastht.ml/docs/llms.txt
- **nbdev projects** - Auto-generated .md versions

---

## Quick Start Checklist

- [ ] Create `/llms.txt` at website root
- [ ] Add H1 title (required)
- [ ] Add blockquote summary (recommended)
- [ ] Add key information sections
- [ ] Create H2 sections for links
- [ ] Use "Optional" for secondary content
- [ ] Test with `llms_txt2ctx` CLI
- [ ] Verify with actual LLM
- [ ] Add `.md` versions of key pages
- [ ] Submit to llms.txt directories

---

## Resources

- **Official Site**: https://llmstxt.org
- **GitHub**: https://github.com/AnswerDotAI/llms-txt
- **Python Module**: https://pypi.org/project/llms-txt/
- **Specification**: https://llmstxt.org/core.html
- **Domain Examples**: https://llmstxt.org/domains.html
