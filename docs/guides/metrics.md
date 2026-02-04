# Performance Metrics Guide

This guide explains how to measure and track Orchestra's performance metrics.

## Automated Metrics

Run the benchmark script:

```bash
npm run build
node scripts/benchmark.js
```

This measures:
- **Execution Time**: Time to complete typical tasks
- **Parallel Overhead**: Performance difference between parallel and sequential
- **Cache Hit Rate**: Effectiveness of response caching
- **Memory Usage**: RAM consumption during execution

## Manual Metrics

### 1. Recovery Success Rate

**Definition**: Percentage of failed files that successfully recover.

**Measurement**:

```javascript
// Track in Orchestrator
const recoveryAttempts = totalRecoveryAttempts;
const recoverySuccess = successfulRecoveries;
const rate = (recoverySuccess / recoveryAttempts) * 100;

console.log(`Recovery Success Rate: ${rate.toFixed(1)}%`);
// Target: > 90%
```

**How to Improve**:
- Increase `maxIterations` in config
- Improve Consultant prompts
- Enhance Auditor specificity

### 2. Auditor Approval Rate

**Definition**: Percentage of files approved on first audit.

**Measurement**:

```javascript
// Track in Orchestrator
const totalAudits = auditResults.length;
const firstApprovals = auditResults.filter(r => r.status === 'APPROVED').length;
const rate = (firstApprovals / totalAudits) * 100;

console.log(`Auditor Approval Rate: ${rate.toFixed(1)}%`);
// Target: > 95%
```

**How to Improve**:
- Improve Executor prompts
- Enhance Architect planning
- Adjust Auditor strictness

### 3. TUI Uptime

**Definition**: Percentage of time TUI runs without crashes.

**Measurement**:

```bash
# Run TUI for extended period
timeout 3600 orchestra tui  # 1 hour

# Or monitor in production
ps aux | grep "orchestra tui" | grep -v grep
```

**Target**: > 99% uptime

**How to Improve**:
- Report bugs when crashes occur
- Check error logs in `.orchestra/`
- Verify terminal compatibility

### 4. False Positive Rate

**Definition**: Percentage of valid code flagged as invalid.

**Measurement**:

```javascript
// Track validation results
const totalValidations = syntaxValidations.length;
const falsePositives = syntaxValidations.filter(
  v => !v.valid && v.error === 'No error'
).length;
const rate = (falsePositives / totalValidations) * 100;

console.log(`False Positive Rate: ${rate.toFixed(1)}%`);
// Target: < 5%
```

**How to Improve**:
- Update validators for edge cases
- Improve language detection
- Test with various code patterns

## Code Quality Metrics

### Cyclomatic Complexity

**Definition**: Average number of linearly independent paths through code.

**Measurement**:

```bash
npm install -g eslint-plugin-complexity
eslint src/ --plugin complexity
```

**Target**: < 15 per function

**How to Improve**:
- Extract smaller functions
- Reduce nested conditions
- Use early returns

### Code Duplication

**Definition**: Percentage of duplicated code.

**Measurement**:

```bash
npm install -g jscpd
jscpd src/
```

**Target**: < 5%

**How to Improve**:
- Extract common patterns to utilities
- Use composability over repetition
- Apply DRY principle

## Performance Targets

| Metric | Target | Current Status |
|--------|--------|----------------|
| Execution Time | < 5 min | ⏳ Requires benchmark |
| Parallel Overhead | < 10% | ⏳ Requires benchmark |
| Recovery Time | < 30 s/file | ⏳ Requires measurement |
| Memory Usage | < 500 MB | ⏳ Requires benchmark |
| Cache Hit Rate | > 60% | ⏳ Requires measurement |
| Recovery Success | > 90% | ⏳ Operational metric |
| Auditor Approval | > 95% | ⏳ Operational metric |
| TUI Uptime | > 99% | ⏳ Operational metric |
| False Positives | < 5% | ⏳ Operational metric |
| Complexity | < 15 | ⏳ Requires analysis |
| Duplication | < 5% | ⏳ Requires analysis |

## Improving Metrics

### Short-term (Code Changes)

1. **Reduce Parallel Overhead**
   - Optimize `runWithConcurrency` batch size
   - Tune `progressBatchInterval`
   - Use `runWithConcurrencyOptimized`

2. **Lower Memory Usage**
   - Clear cache between sessions
   - Limit checkpoint history
   - Stream large responses

3. **Improve Cache Hit Rate**
   - Use consistent prompt templates
   - Enable prompt caching
   - Adjust cache TTL

### Long-term (Architecture)

1. **Reduce Execution Time**
   - Implement streaming responses
   - Use faster models (GLM 4.7)
   - Enable agent-level parallelization

2. **Improve Recovery Rate**
   - Enhance Consultant knowledge
   - Improve Auditor feedback
   - Add syntax-specific recovery strategies

3. **Increase Auditor Approval**
   - Refine prompts for each agent
   - Add project-specific rules
   - Use plugins for domain expertise

## Tracking Metrics Over Time

Create a metrics log:

```bash
# Run benchmark weekly
node scripts/benchmark.js | tee metrics-$(date +%Y%m%d).log

# Track improvements
grep "Passed:" metrics-*.log
```

Plot metrics to visualize progress:

```javascript
// metrics-chart.js
const fs = require('fs');
const logs = fs.readdirSync('.').filter(f => f.startsWith('metrics-'));
// Parse and plot metrics over time
```

## CI/CD Integration

Add to GitHub Actions:

```yaml
# .github/workflows/benchmark.yml
name: Performance Benchmark
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install
        run: npm install
      - name: Build
        run: npm run build
      - name: Benchmark
        run: node scripts/benchmark.js
```

## See Also

- [Performance Guide](performance.md)
- [Profiling Guide](performance.md#profiling-tools)
- [Development Guide](development.md)
