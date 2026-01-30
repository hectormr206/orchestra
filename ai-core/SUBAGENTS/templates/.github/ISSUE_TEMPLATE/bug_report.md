---
name: Bug report
about: Create a report to help us improve
title: '[BUG] '
labels: bug, triage
assignees: ''
---

## 🐛 Bug Description

{{BUG_DESCRIPTION}}

<!-- A clear and concise description of what the bug is. -->

---

## 📍 Location

{{BUG_LOCATION}}

<!-- Where in the codebase does this bug occur? (file path, component, etc.) -->

---

## 🔄 Reproduction Steps

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

{{REPRODUCTION_STEPS}}

<!-- Steps to reproduce the behavior. -->

---

## 🎯 Expected Behavior

{{EXPECTED_BEHAVIOR}}

<!-- A clear and concise description of what you expected to happen. -->

---

## 📸 Screenshots

{{SCREENSHOTS}}

<!-- If applicable, add screenshots to help explain your problem. -->

---

## 🖥️ Actual Behavior

{{ACTUAL_BEHAVIOR}}

<!-- A clear and concise description of what actually happened. -->

---

## 💻 Environment

### OS

- [ ] macOS
- [ ] Linux
- [ ] Windows
- [ ] Other: {{OTHER_OS}}

### Browser (if applicable)

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Other: {{OTHER_BROWSER}}

### Runtime Versions

```bash
# Run commands to get versions
{{RUNTIME_VERSION_COMMANDS}}
```

**Versions:**
- **Node.js**: {{NODE_VERSION}}
- **npm/yarn**: {{NPM_VERSION}}
- **{{RUNTIME_NAME}}**: {{RUNTIME_VERSION}}

### Project Version

```bash
# Get project version
{{GET_VERSION_COMMAND}}
```

**Version**: {{PROJECT_VERSION}}

---

## 📦 Additional Context

{{ADDITIONAL_CONTEXT}}

<!-- Add any other context about the problem here. -->

---

## 🔍 Debug Information

{{DEBUG_INFORMATION}}

<!-- Please include logs, error messages, stack traces, or any other relevant debugging information. -->

<details>
<summary>Click to expand logs</summary>

```
{{LOGS_OUTPUT}}
```

</details>

---

## ✅ Possible Solution

{{POSSIBLE_SOLUTION}}

<!-- Not obligatory, but suggest a fix or reason for the bug. -->

---

## 📊 Priority

- [ ] Critical (blocks release, production down)
- [ ] High (affects many users, major feature broken)
- [ ] Medium (affects some users, minor feature broken)
- [ ] Low (edge case, workaround exists)

---

## 🔗 Related Issues

- Related to #{{RELATED_ISSUE}}
- Blocks #{{BLOCKED_ISSUE}}
- Blocked by #{{BLOCKING_ISSUE}}

---

**EOF**
