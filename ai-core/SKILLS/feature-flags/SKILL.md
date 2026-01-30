---
name: feature-flags
description: >
  Feature flag patterns: A/B testing, gradual rollouts, kill switches,
  experimentation, targeting rules, flag lifecycle management.
  Trigger: When implementing feature flags, A/B tests, or controlled rollouts.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Implementing feature flags"
    - "Setting up A/B testing"
    - "Planning gradual rollouts"
    - "Creating kill switches"
    - "Running experiments"
allowed-tools: [Read,Edit,Write,Grep,Bash]
---

## When to Use

- Rolling out new features gradually
- A/B testing UI or functionality
- Creating kill switches for critical features
- Targeting features to specific users
- Managing long-lived feature branches
- Decoupling deployment from release

---

## Critical Patterns

### > **ALWAYS**

1. **Separate deployment from release**
   ```
   ┌─────────────────────────────────────────────┐
   │ DEPLOYMENT vs RELEASE                       │
   │                                             │
   │ Deployment: Code is in production           │
   │ Release: Feature is available to users      │
   │                                             │
   │ With feature flags:                         │
   │ - Deploy anytime (behind flag)              │
   │ - Release when ready                        │
   │ - Rollback instantly (flip flag)            │
   └─────────────────────────────────────────────┘
   ```

2. **Set flag defaults safely**
   ```typescript
   // Default should be the safe option
   const isNewCheckoutEnabled = featureFlags.isEnabled(
     'new-checkout',
     { default: false }  // Safe default
   );

   // For existing features, default to enabled
   const isLegacySearchEnabled = featureFlags.isEnabled(
     'legacy-search',
     { default: true }  // Don't break existing functionality
   );
   ```

3. **Include flag metadata**
   ```typescript
   interface FeatureFlag {
     key: string;
     name: string;
     description: string;
     owner: string;
     createdAt: Date;
     expiresAt?: Date;  // When should this flag be removed?
     jiraTicket?: string;
     type: 'release' | 'experiment' | 'ops' | 'permission';
   }
   ```

4. **Plan for flag removal**
   ```typescript
   // Track flag age and plan cleanup
   const FLAG_METADATA = {
     'new-checkout': {
       created: '2024-01-15',
       cleanup_by: '2024-04-15',  // 90 days max
       owner: '@frontend-team',
       ticket: 'PROJ-1234'
     }
   };

   // Automated warning for old flags
   function warnOldFlags() {
     Object.entries(FLAG_METADATA).forEach(([key, meta]) => {
       const age = daysSince(meta.created);
       if (age > 60) {
         console.warn(`Flag "${key}" is ${age} days old. Consider removing.`);
       }
     });
   }
   ```

5. **Log flag evaluations**
   ```typescript
   function evaluateFlag(flagKey: string, context: FlagContext): boolean {
     const result = flagProvider.evaluate(flagKey, context);

     // Log for debugging and analytics
     logger.debug('flag_evaluation', {
       flag: flagKey,
       result,
       userId: context.userId,
       timestamp: Date.now()
     });

     // Track for A/B test analytics
     analytics.track('flag_exposure', {
       flag: flagKey,
       variant: result,
       userId: context.userId
     });

     return result;
   }
   ```

### > **NEVER**

1. **Use feature flags for permanent configuration**
2. **Let flags accumulate without cleanup**
3. **Nest flag checks deeply**
4. **Skip logging flag evaluations**
5. **Use flags for access control (use permissions instead)**

---

## Flag Types

| Type | Purpose | Lifecycle |
|------|---------|-----------|
| **Release** | Control feature visibility | Remove after full rollout |
| **Experiment** | A/B testing | Remove after experiment ends |
| **Ops** | Kill switches, circuit breakers | Keep permanently |
| **Permission** | User entitlements | Usually permanent |

---

## Implementation

### Basic Feature Flag Service

```typescript
interface FlagContext {
  userId?: string;
  email?: string;
  country?: string;
  plan?: string;
  percentile?: number;  // 0-100, stable per user
  attributes?: Record<string, any>;
}

interface FlagRule {
  conditions: Condition[];
  result: boolean | string;
}

interface Flag {
  key: string;
  enabled: boolean;
  rules?: FlagRule[];
  defaultValue: boolean | string;
}

class FeatureFlagService {
  private flags: Map<string, Flag> = new Map();

  async loadFlags() {
    // Load from remote config, database, or service
    const response = await fetch('/api/flags');
    const flags = await response.json();
    flags.forEach((flag: Flag) => this.flags.set(flag.key, flag));
  }

  isEnabled(key: string, context: FlagContext = {}): boolean {
    const flag = this.flags.get(key);

    if (!flag) {
      console.warn(`Flag "${key}" not found`);
      return false;
    }

    if (!flag.enabled) {
      return false;
    }

    // Evaluate rules
    if (flag.rules) {
      for (const rule of flag.rules) {
        if (this.evaluateConditions(rule.conditions, context)) {
          return rule.result === true;
        }
      }
    }

    return flag.defaultValue === true;
  }

  private evaluateConditions(conditions: Condition[], context: FlagContext): boolean {
    return conditions.every(condition => {
      const value = context[condition.attribute as keyof FlagContext];
      switch (condition.operator) {
        case 'equals': return value === condition.value;
        case 'contains': return String(value).includes(condition.value);
        case 'in': return (condition.value as any[]).includes(value);
        case 'percentage': return (context.percentile ?? 0) < condition.value;
        default: return false;
      }
    });
  }
}
```

### React Hook

```typescript
import { createContext, useContext, useEffect, useState } from 'react';

const FeatureFlagContext = createContext<FeatureFlagService | null>(null);

export function FeatureFlagProvider({ children }: { children: React.ReactNode }) {
  const [service] = useState(() => new FeatureFlagService());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    service.loadFlags().then(() => setReady(true));
  }, [service]);

  if (!ready) return null;

  return (
    <FeatureFlagContext.Provider value={service}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlag(key: string, context?: FlagContext): boolean {
  const service = useContext(FeatureFlagContext);
  if (!service) throw new Error('FeatureFlagProvider not found');

  return service.isEnabled(key, context);
}

// Usage
function CheckoutPage() {
  const isNewCheckout = useFeatureFlag('new-checkout', { userId: user.id });

  if (isNewCheckout) {
    return <NewCheckout />;
  }
  return <LegacyCheckout />;
}
```

---

## Gradual Rollout

### Percentage-Based

```typescript
// Stable percentage based on user ID
function getPercentile(userId: string, flagKey: string): number {
  const hash = crypto
    .createHash('sha256')
    .update(`${userId}:${flagKey}`)
    .digest('hex');

  // Convert first 8 chars to number, mod 100
  return parseInt(hash.substring(0, 8), 16) % 100;
}

// Rollout configuration
const ROLLOUT_CONFIG = {
  'new-checkout': {
    percentage: 25,  // 25% of users
    excludeCountries: ['DE'],  // Exclude Germany
    includePlans: ['pro', 'enterprise']  // Only paid users
  }
};

function isEnabledForUser(flagKey: string, context: FlagContext): boolean {
  const config = ROLLOUT_CONFIG[flagKey];
  if (!config) return false;

  // Check exclusions
  if (config.excludeCountries?.includes(context.country)) return false;

  // Check inclusions
  if (config.includePlans && !config.includePlans.includes(context.plan)) return false;

  // Percentage check
  const percentile = getPercentile(context.userId!, flagKey);
  return percentile < config.percentage;
}
```

### Ring-Based Rollout

```
┌─────────────────────────────────────────────┐
│ RING DEPLOYMENT                             │
├─────────────────────────────────────────────┤
│ Ring 0: Internal (employees)       → 1%     │
│ Ring 1: Canary (beta users)        → 5%     │
│ Ring 2: Early adopters             → 20%    │
│ Ring 3: General availability       → 100%   │
│                                             │
│ Each ring validates before next promotion   │
└─────────────────────────────────────────────┘
```

```typescript
const RINGS = {
  internal: { percentage: 100, condition: (ctx) => ctx.isEmployee },
  canary: { percentage: 5, condition: (ctx) => ctx.isBetaUser },
  early: { percentage: 20, condition: null },
  ga: { percentage: 100, condition: null }
};

function getCurrentRing(flagKey: string): keyof typeof RINGS {
  // Fetch from config
  return flagConfig[flagKey]?.ring ?? 'internal';
}
```

---

## A/B Testing

### Experiment Configuration

```typescript
interface Experiment {
  key: string;
  name: string;
  variants: Variant[];
  traffic: number;  // 0-100, percentage of users in experiment
  startDate: Date;
  endDate: Date;
  primaryMetric: string;
  minimumSampleSize: number;
}

interface Variant {
  key: string;
  name: string;
  weight: number;  // Relative weight (sum to 100)
}

const CHECKOUT_EXPERIMENT: Experiment = {
  key: 'checkout-redesign',
  name: 'Checkout Page Redesign',
  variants: [
    { key: 'control', name: 'Current Checkout', weight: 50 },
    { key: 'variant-a', name: 'Simplified Checkout', weight: 50 }
  ],
  traffic: 100,
  startDate: new Date('2024-01-15'),
  endDate: new Date('2024-02-15'),
  primaryMetric: 'conversion_rate',
  minimumSampleSize: 10000
};
```

### Variant Assignment

```typescript
function assignVariant(experiment: Experiment, userId: string): Variant | null {
  // Check if user is in experiment traffic
  const trafficPercentile = getPercentile(userId, `${experiment.key}:traffic`);
  if (trafficPercentile >= experiment.traffic) {
    return null;  // User not in experiment
  }

  // Assign to variant
  const variantPercentile = getPercentile(userId, experiment.key);
  let cumulative = 0;

  for (const variant of experiment.variants) {
    cumulative += variant.weight;
    if (variantPercentile < cumulative) {
      return variant;
    }
  }

  return experiment.variants[0];  // Fallback
}
```

### Analytics Integration

```typescript
// Track exposure
function trackExposure(experimentKey: string, variant: Variant, userId: string) {
  analytics.track('experiment_exposure', {
    experiment: experimentKey,
    variant: variant.key,
    userId,
    timestamp: Date.now()
  });
}

// Track conversion
function trackConversion(experimentKey: string, metricName: string, value: number, userId: string) {
  analytics.track('experiment_conversion', {
    experiment: experimentKey,
    metric: metricName,
    value,
    userId,
    timestamp: Date.now()
  });
}

// Usage in component
function CheckoutPage() {
  const variant = useExperiment('checkout-redesign');

  useEffect(() => {
    if (variant) {
      trackExposure('checkout-redesign', variant, userId);
    }
  }, [variant]);

  const handlePurchase = () => {
    trackConversion('checkout-redesign', 'purchase', orderTotal, userId);
  };
}
```

---

## Kill Switches

### Implementation

```typescript
// Operational flags for emergencies
const KILL_SWITCHES = {
  'kill-payments': {
    description: 'Disable payment processing',
    fallback: 'maintenance-page'
  },
  'kill-signups': {
    description: 'Disable new user registration',
    fallback: 'waitlist-page'
  },
  'kill-external-api': {
    description: 'Disable external API calls',
    fallback: 'cached-data'
  }
};

// Fast evaluation without network
class KillSwitchService {
  private switches: Map<string, boolean> = new Map();
  private lastFetch: number = 0;
  private ttl: number = 5000;  // 5 seconds

  async check(key: string): Promise<boolean> {
    // Fetch if stale
    if (Date.now() - this.lastFetch > this.ttl) {
      await this.refresh();
    }
    return this.switches.get(key) ?? false;
  }

  private async refresh() {
    try {
      const response = await fetch('/api/kill-switches', {
        timeout: 1000  // Fast timeout
      });
      const data = await response.json();
      this.switches = new Map(Object.entries(data));
      this.lastFetch = Date.now();
    } catch {
      // Keep existing values on failure
      console.error('Failed to refresh kill switches');
    }
  }
}

// Usage
async function processPayment(order: Order) {
  if (await killSwitches.check('kill-payments')) {
    throw new ServiceUnavailableError('Payments temporarily disabled');
  }
  // Process payment...
}
```

---

## Flag Management

### LaunchDarkly Configuration

```typescript
import * as LaunchDarkly from 'launchdarkly-node-server-sdk';

const client = LaunchDarkly.init(process.env.LAUNCHDARKLY_SDK_KEY!);

await client.waitForInitialization();

// Evaluate flag
const showFeature = await client.variation(
  'new-feature',
  { key: userId, email: userEmail, custom: { plan: 'pro' } },
  false  // default
);

// Track event
client.track('purchase', { key: userId }, { amount: 99.99 });
```

### Unleash Configuration

```typescript
import { initialize } from 'unleash-client';

const unleash = initialize({
  url: 'https://unleash.example.com/api',
  appName: 'my-app',
  customHeaders: { Authorization: process.env.UNLEASH_API_KEY }
});

// Wait for ready
unleash.on('ready', () => {
  const enabled = unleash.isEnabled('new-feature', {
    userId: '123',
    properties: { plan: 'pro' }
  });
});
```

---

## Cleanup Strategy

### Flag Lifecycle

```
┌─────────────────────────────────────────────┐
│ FLAG LIFECYCLE                              │
├─────────────────────────────────────────────┤
│ 1. Create flag (disabled)                   │
│ 2. Implement feature behind flag            │
│ 3. Enable for testing (internal)            │
│ 4. Gradual rollout (canary → GA)           │
│ 5. Full rollout (100%)                      │
│ 6. Remove flag code                         │
│ 7. Archive/delete flag                      │
│                                             │
│ MAX LIFETIME: 90 days (release flags)       │
└─────────────────────────────────────────────┘
```

### Automated Cleanup

```typescript
// ESLint rule to catch old flags
// eslint-plugin-feature-flags
module.exports = {
  rules: {
    'no-stale-flags': {
      create(context) {
        const staleFlagDate = new Date();
        staleFlagDate.setDate(staleFlagDate.getDate() - 90);

        return {
          CallExpression(node) {
            if (isFeatureFlagCall(node)) {
              const flagKey = getFlagKey(node);
              const flagMeta = getFlagMetadata(flagKey);

              if (flagMeta && new Date(flagMeta.created) < staleFlagDate) {
                context.report({
                  node,
                  message: `Flag "${flagKey}" is older than 90 days. Consider removing.`
                });
              }
            }
          }
        };
      }
    }
  }
};
```

---

## Commands

```bash
# LaunchDarkly CLI
ld flag list
ld flag get new-feature
ld flag update new-feature --on
ld flag update new-feature --off

# Feature flag grep
grep -rn "isEnabled\|useFeatureFlag" --include="*.ts" src/

# Find stale flags
node scripts/find-stale-flags.js

# Generate flag report
node scripts/flag-report.js > flags.csv
```

---

## Resources

- **LaunchDarkly**: [launchdarkly.com](https://launchdarkly.com/)
- **Unleash**: [getunleash.io](https://www.getunleash.io/)
- **Split**: [split.io](https://www.split.io/)
- **Flagsmith**: [flagsmith.com](https://www.flagsmith.com/)
- **Martin Fowler on Feature Toggles**: [martinfowler.com/articles/feature-toggles.html](https://martinfowler.com/articles/feature-toggles.html)

---

## Examples

### Example 1: Feature Flag Implementation

**User request:** "Implement feature flags for gradual rollout"

```python
from featureflags.client import CfClient
from featureflags.config import *
from featureflags.evaluations.auth_target import Target

# Initialize client
client = CfClient(
    sdk_key="your-sdk-key",
    enable_stream=True,
    enable_analytics=True
)

# Define user/target
target = Target(
    identifier="user-123",
    name="John Doe",
    attributes={
        "email": "john@example.com",
        "tier": "premium",
        "country": "US"
    }
)

# Check feature flag
def show_new_dashboard():
    flag_key = "new-dashboard-ui"
    
    result = client.boolean_variation(
        flag_key,
        target,
        default_value=False
    )
    
    if result:
        return render_new_dashboard()
    else:
        return render_old_dashboard()

# Gradual rollout: 10% of users
def is_user_in_rollout(user_id: str, percentage: int) -> bool:
    """Determine if user is in rollout percentage"""
    hash_val = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
    return (hash_val % 100) < percentage
