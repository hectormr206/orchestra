# Reinforcement Learning Fundamentals

Core RL concepts and patterns for ai-core orchestration optimization.

## What is Reinforcement Learning?

**Reinforcement Learning (RL)** is a machine learning paradigm where an agent learns to make decisions by interacting with an environment and receiving feedback in the form of rewards.

### Key Components

```yaml
Agent: The decision-maker (ai-core orchestrator)
Environment: The system being optimized (development workflow)
State: Current situation (task features, context, system state)
Action: Decision to make (resource selection, execution strategy)
Reward: Feedback signal (success, efficiency, quality)
Policy: Strategy for choosing actions (learned model)
```

---

## RL Framework for ai-core

### The Loop

```
┌─────────────────────────────────────────────────────────────┐
│                    RL Training Loop                          │
└─────────────────────────────────────────────────────────────┘

User Request
    ↓
┌─────────────────┐
│  Extract State  │  ← Task features, context, history
└────────┬────────┘
         ↓
┌─────────────────┐
│  Select Action  │  ← Policy: resources, strategy, parameters
└────────┬────────┘
         ↓
┌─────────────────┐
│   Execute       │  ← Orchestrator runs task
└────────┬────────┘
         ↓
┌─────────────────┐
│  Observe       │  ← Success, time, resources, errors
│  Outcome       │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Compute Reward │  ← Score the outcome
└────────┬────────┘
         ↓
┌─────────────────┐
│   Store        │  ← Save experience to buffer
│  Experience    │
└────────┬────────┘
         ↓
┌─────────────────┐
│   Train        │  ← Update policy from batch of experiences
│   Policy       │
└─────────────────┘
```

---

## State Space

### Definition

**State** = Complete information needed to make a decision

### State Components for ai-core

```python
state = {
    # 1. Task Features (what needs to be done)
    'task_type': 'feature|bug|refactor|test|docs|review|...',
    'primary_domain': 'frontend|backend|database|security|...',
    'secondary_domains': ['domain1', 'domain2'],
    'complexity': 'simple|medium|complex',
    'risk_level': 'low|medium|high',

    # 2. Context Features (additional information)
    'estimated_time': 120,  # minutes
    'description_length': 45,  # words
    'domain_diversity': 2,  # number of domains
    'required_skills': ['security', 'backend', 'api-design'],

    # 3. Historical Features (past performance)
    'success_rate': 0.85,  # last 10 similar tasks
    'avg_time_diff': 0.2,  # (estimated - actual) / estimated
    'resource_efficiency': 0.90,  # optimal / actual resources
    'error_rate': 0.10,  # errors per task

    # 4. System State (current conditions)
    'concurrent_tasks': 2,
    'system_load': 0.35,  # CPU/memory utilization
    'agent_availability': {
        'feature-creator': 0.8,  # 80% available
        'bug-fixer': 1.0,  # 100% available
        'security-specialist': 0.0  # Busy
    }
}
```

### State Representation

```python
def encode_state(state_dict):
    """
    Convert state dictionary to vector for neural network
    """
    features = []

    # 1. Task type (one-hot: 13 dims)
    task_types = ['feature', 'bug', 'refactor', 'test', 'docs',
                  'review', 'deploy', 'security', 'performance',
                  'architecture', 'database', 'maintenance', 'optimization']
    task_type_vec = one_hot(state_dict['task_type'], task_types)
    features.extend(task_type_vec)

    # 2. Domain (one-hot: 9 dims)
    domains = ['frontend', 'backend', 'database', 'devops',
               'mobile', 'ai/ml', 'security', 'testing', 'architecture']
    domain_vec = one_hot(state_dict['primary_domain'], domains)
    features.extend(domain_vec)

    # 3. Complexity (ordinal: 3 dims)
    complexity_levels = ['simple', 'medium', 'complex']
    complexity_vec = ordinal_encode(state_dict['complexity'], complexity_levels)
    features.extend(complexity_vec)

    # 4. Risk level (ordinal: 3 dims)
    risk_levels = ['low', 'medium', 'high']
    risk_vec = ordinal_encode(state_dict['risk_level'], risk_levels)
    features.extend(risk_vec)

    # 5. Estimated time (normalized: 1 dim)
    time_norm = min(state_dict['estimated_time'], 480) / 480  # Cap at 8 hours
    features.append(time_norm)

    # 6. Domain diversity (normalized: 1 dim)
    diversity_norm = min(state_dict['domain_diversity'], 5) / 5
    features.append(diversity_norm)

    # 7. Skill count (normalized: 1 dim)
    skill_count_norm = min(len(state_dict['required_skills']), 10) / 10
    features.append(skill_count_norm)

    # 8. Success rate (1 dim, already 0-1)
    features.append(np.clip(state_dict['success_rate'], 0, 1))

    # 9. Time accuracy (1 dim, clip to 0-1)
    features.append(np.clip(state_dict['avg_time_diff'], 0, 1))

    # 10. Resource efficiency (1 dim, already 0-1)
    features.append(np.clip(state_dict['resource_efficiency'], 0, 1))

    # 11. Concurrent tasks (normalized: 1 dim)
    concurrent_norm = min(state_dict['concurrent_tasks'], 10) / 10
    features.append(concurrent_norm)

    # 12. System load (1 dim, already 0-1)
    features.append(np.clip(state_dict['system_load'], 0, 1))

    # 13. Agent availability (N dims, one per agent)
    agents = ['feature-creator', 'bug-fixer', 'code-refactorer',
              'pr-reviewer', 'security-specialist', 'performance-optimizer',
              'testing-specialist', 'database-specialist']
    agent_avails = [state_dict['agent_availability'].get(a, 1.0) for a in agents]
    features.extend(agent_avails)

    return np.array(features, dtype=np.float32)


def one_hot(value, categories):
    """Create one-hot encoded vector"""
    vec = [0] * len(categories)
    vec[categories.index(value)] = 1
    return vec


def ordinal_encode(value, categories):
    """Create ordinal encoded vector"""
    idx = categories.index(value)
    vec = [0] * len(categories)
    vec[idx] = 1
    return vec
```

### State Dimensions

```yaml
Total dimensions: ~50-100

Breakdown:
  - Task type: 13
  - Domain: 9
  - Complexity: 3
  - Risk level: 3
  - Context: 3
  - Historical: 3
  - System: 2 + N_agents
  - Total: ~36 + N_agents

For 15 agents: ~51 dimensions
```

---

## Action Space

### Definition

**Action** = Decision made by the policy

### Action Components for ai-core

```python
action = {
    # 1. Resource Selection
    'resources': {
        'skills': ['security', 'backend', 'api-design'],
        'agents': ['feature-creator']
    },

    # 2. Execution Strategy
    'strategy': {
        'approach': 'coordinated',  # direct|sequential|parallel|coordinated
        'parallelism': 2,  # Number of parallel agents
    },

    # 3. Execution Parameters
    'parameters': {
        'timeout_multiplier': 1.5,  # 0.5-2.0x normal timeout
        'retry_strategy': 'retry_with_backoff',  # fail_fast|retry_with_backoff|fallback
        'safety_level': 'balanced'  # strict|balanced|permissive
    }
}
```

### Action Representation

```python
def encode_action(action_dict):
    """
    Convert action dictionary to vector for neural network
    """
    features = []

    # 1. Skills (binary: N_skills dims)
    all_skills = [
        'security', 'backend', 'frontend', 'database',
        'testing', 'api-design', 'architecture', 'devops',
        'performance', 'mobile', 'ai-ml', 'realtime',
        'code-quality', 'git-workflow', 'ci-cd',
        'documentation', 'error-handling', 'logging',
        'observability', 'scalability', 'compliance'
    ]
    skills_vec = [1 if s in action_dict['resources']['skills'] else 0
                  for s in all_skills]
    features.extend(skills_vec)

    # 2. Agents (binary: N_agents dims)
    all_agents = [
        'feature-creator', 'bug-fixer', 'code-refactorer',
        'pr-reviewer', 'security-specialist', 'performance-optimizer',
        'testing-specialist', 'database-specialist',
        'frontend-specialist', 'backend-specialist',
        'devops-specialist', 'architecture-advisor',
        'documentation-writer', 'maintenance-coordinator'
    ]
    agents_vec = [1 if a in action_dict['resources']['agents'] else 0
                  for a in all_agents]
    features.extend(agents_vec)

    # 3. Strategy approach (one-hot: 4 dims)
    approaches = ['direct', 'sequential', 'parallel', 'coordinated']
    strategy_vec = one_hot(action_dict['strategy']['approach'], approaches)
    features.extend(strategy_vec)

    # 4. Parallelism (normalized: 1 dim)
    parallelism_norm = (action_dict['strategy']['parallelism'] - 1) / 3
    features.append(parallelism_norm)

    # 5. Timeout multiplier (normalized: 1 dim)
    timeout_norm = (action_dict['parameters']['timeout_multiplier'] - 0.5) / 1.5
    features.append(timeout_norm)

    # 6. Retry strategy (one-hot: 3 dims)
    retry_strategies = ['fail_fast', 'retry_with_backoff', 'fallback']
    retry_vec = one_hot(action_dict['parameters']['retry_strategy'], retry_strategies)
    features.extend(retry_vec)

    # 7. Safety level (one-hot: 3 dims)
    safety_levels = ['strict', 'balanced', 'permissive']
    safety_vec = one_hot(action_dict['parameters']['safety_level'], safety_levels)
    features.extend(safety_vec)

    return np.array(features, dtype=np.float32)
```

### Action Dimensions

```yaml
Total dimensions: ~50

Breakdown:
  - Skills: 20
  - Agents: 14
  - Strategy: 4
  - Parallelism: 1
  - Timeout: 1
  - Retry: 3
  - Safety: 3
  - Total: 46
```

---

## Reward Function

### Definition

**Reward** = Scalar feedback signal that guides learning

### Reward Components

```python
def compute_reward(outcome, context):
    """
    Compute reward for ai-core task execution

    Returns: float in range [-100, +180]
    """
    reward = 0

    # ===== Primary Reward =====

    # 1. Success (dominant signal)
    if outcome['success']:
        reward += 100
    else:
        reward -= 100

    # ===== Efficiency Rewards =====

    # 2. Time efficiency
    if outcome['success']:
        estimated = parse_time(context['estimated_time'])
        actual = outcome['actual_time']
        efficiency = min(estimated / max(actual, 1), 2.0)  # Cap at 2x
        reward += efficiency * 20

    # 3. Resource efficiency
    resources_used = len(outcome['resources_used'])
    resources_needed = outcome.get('minimum_resources', resources_used)
    if resources_used <= resources_needed:
        reward += 10
    else:
        reward -= (resources_used - resources_needed) * 5

    # ===== Quality Rewards =====

    # 4. Error-free execution
    if outcome['error_count'] == 0:
        reward += 15
    else:
        reward -= outcome['error_count'] * 10

    # 5. User satisfaction (implicit)
    user_modifications = outcome.get('user_modifications', 0)
    if user_modifications == 0:
        reward += 10
    else:
        reward -= user_modifications * 5

    # ===== Safety Rewards =====

    # 6. Safety adherence
    if not outcome.get('safety_violations', False):
        reward += 10
    else:
        reward -= 50  # Large penalty

    # ===== Confidence Bonus =====

    # 7. High confidence predictions
    confidence = context.get('confidence', 0.5)
    reward += confidence * 5

    return reward
```

### Reward Distribution

```yaml
Positive Rewards:
  +100: Success
  + 20: Fast execution (2x faster than estimate)
  + 10: Minimal resources
  + 15: Error-free
  + 10: Zero user modifications
  + 10: Safe operation
  +  5: Maximum confidence
  -----
  +180: Maximum possible reward

Negative Rewards:
  -100: Failure
  - 20: Slow execution (2x slower than estimate)
  -  5 per excess resource
  - 10 per error
  -  5 per user modification
  - 50: Safety violation
  -----
  -100+: Negative territory

Typical Range: -50 to +150
Target: > 0 (positive on average)
```

---

## Policy

### Definition

**Policy** = Strategy that maps states to actions: π(a|s)

### Policy Types

```yaml
1. Deterministic Policy:
   π(a|s) = a  (Always choose same action for same state)

2. Stochastic Policy:
   π(a|s) = P(a|s)  (Probability distribution over actions)

3. Greedy Policy:
   π(a|s) = argmax_a Q(s,a)  (Choose action with max value)

4. Epsilon-Greedy Policy:
   With probability ε: random action
   With probability 1-ε: greedy action
```

### Policy in ai-core

```python
class Policy:
    """
    Learned policy for ai-core orchestration
    """
    def __init__(self, actor_network):
        self.actor = actor_network

    def select_action(self, state, deterministic=False, epsilon=0.1):
        """
        Select action using policy

        Args:
            state: Current state vector
            deterministic: If True, use greedy policy
            epsilon: Exploration rate (for epsilon-greedy)

        Returns:
            action: Selected action vector
            confidence: Probability of selected action
        """
        state_tensor = torch.from_numpy(state).unsqueeze(0)

        # Get action probabilities
        with torch.no_grad():
            probs = self.actor(state_tensor)

        # Epsilon-greedy exploration
        if not deterministic and random.random() < epsilon:
            # Random action (exploration)
            action_idx = random.randint(0, len(probs) - 1)
            confidence = 1.0 / len(probs)
        else:
            # Greedy action (exploitation)
            action_idx = probs.argmax(dim=-1).item()
            confidence = probs.max(dim=-1).values.item()

        # Create action vector
        action = torch.zeros_like(probs)
        action[action_idx] = 1.0

        return action.numpy().squeeze(), confidence

    def get_action_config(self, action_vector):
        """
        Convert action vector to configuration dictionary
        """
        return decode_action(action_vector)
```

---

## Value Function

### Definition

**Value Function** = Expected future reward from a state: V(s) = E[R|s]

### Value in Actor-Critic

```python
class ValueFunction:
    """
    Value function for ai-core states
    """
    def __init__(self, critic_network):
        self.critic = critic_network

    def evaluate_state(self, state):
        """
        Evaluate state value

        Args:
            state: Current state vector

        Returns:
            value: Expected future reward
        """
        state_tensor = torch.from_numpy(state).unsqueeze(0)

        with torch.no_grad():
            value = self.critic(state_tensor)

        return value.item()

    def compute_advantage(self, state, reward):
        """
        Compute advantage: A(s,a) = R - V(s)

        Advantage tells us how much better this action was
        compared to average actions from this state.
        """
        value = self.evaluate_state(state)
        advantage = reward - value
        return advantage
```

---

## Experience Replay

### Definition

**Experience Replay** = Store experiences and sample randomly for training

### Benefits

```yaml
1. Break correlation: Random samples are independent
2. Efficient reuse: Each experience used multiple times
3. Stability: Reduce variance in gradients
4. Flexibility: Can prioritize important experiences
```

### Implementation

```python
class ExperienceBuffer:
    """
    Replay buffer for RL experiences
    """
    def __init__(self, capacity=10000):
        self.capacity = capacity
        self.buffer = []
        self.position = 0

    def push(self, experience):
        """
        Add experience to buffer
        """
        if len(self.buffer) < self.capacity:
            self.buffer.append(experience)
        else:
            # Overwrite oldest experience
            self.buffer[self.position] = experience
            self.position = (self.position + 1) % self.capacity

    def sample(self, batch_size):
        """
        Sample random batch of experiences
        """
        return random.sample(self.buffer, min(batch_size, len(self.buffer)))

    def sample_by_task_type(self, task_type, batch_size):
        """
        Sample experiences filtered by task type
        Useful for targeted training
        """
        filtered = [e for e in self.buffer
                    if e.metadata['task_type'] == task_type]
        return random.sample(filtered, min(batch_size, len(filtered)))

    def get_statistics(self):
        """
        Get buffer statistics
        """
        return {
            'size': len(self.buffer),
            'capacity': self.capacity,
            'full': len(self.buffer) == self.capacity,
            'task_distribution': Counter([
                e.metadata['task_type'] for e in self.buffer
            ]),
            'domain_distribution': Counter([
                e.metadata['domain'] for e in self.buffer
            ]),
            'mean_reward': np.mean([e.reward for e in self.buffer]),
            'success_rate': np.mean([
                1 if e.metadata.get('success', False) else 0
                for e in self.buffer
            ])
        }
```

---

## Exploration vs Exploitation

### The Dilemma

```
Exploitation: Use what we know works (greedy action)
Exploration: Try new things to learn more (random action)

Too much exploitation → Local optimum, never discovers better strategies
Too much exploration → Wastes time on bad actions, slow learning
```

### Strategies

```yaml
1. Epsilon-Greedy:
   ε = 0.1  # 10% random exploration
   Decay ε over time: ε = ε * 0.995

2. Boltzmann (Softmax):
   P(a|s) = exp(Q(s,a) / τ) / Σ exp(Q(s,a') / τ)
   Temperature τ controls exploration
   High τ → More exploration
   Low τ → More exploitation

3. Upper Confidence Bound (UCB):
   Choose action that maximizes: Q(s,a) + c * sqrt(ln(N) / N_a)
   Balance: high value + uncertainty

4. Thompson Sampling:
   Sample from value distribution
   Natural exploration through uncertainty
```

### Implementation for ai-core

```python
def select_action_with_exploration(policy, state, strategy='epsilon_greedy'):
    """
    Select action with exploration strategy

    Args:
        policy: Learned policy
        state: Current state
        strategy: 'epsilon_greedy', 'boltzmann', 'ucb'

    Returns:
        action, exploration_used
    """
    if strategy == 'epsilon_greedy':
        epsilon = 0.1  # 10% exploration
        if random.random() < epsilon:
            # Random action (exploration)
            action = random_action()
            return action, True
        else:
            # Greedy action (exploitation)
            action = policy.get_greedy_action(state)
            return action, False

    elif strategy == 'boltzmann':
        temperature = 1.0
        action_probs = policy.get_action_probs(state)
        action_probs = softmax(action_probs / temperature)
        action = sample(action_probs)

        # Exploration if low probability action chosen
        max_prob = action_probs.max()
        exploration = max_prob < 0.8
        return action, exploration

    elif strategy == 'ucb':
        # Use action value + exploration bonus
        action_values = policy.get_action_values(state)
        action_counts = policy.get_action_counts(state)

        exploration_bonus = 2.0 * np.sqrt(np.log(sum(action_counts)) / (action_counts + 1))
        ucb_values = action_values + exploration_bonus

        action = ucb_values.argmax()
        exploration = exploration_bonus[action] > 0.5
        return action, exploration
```

---

## Training Loop

### Full RL Training

```python
def train_rl_agent(experience_buffer, policy, value_function,
                   epochs=100, batch_size=64):
    """
    Train RL agent using experience replay
    """
    training_history = []

    for epoch in range(epochs):
        epoch_metrics = []

        # Sample mini-batches
        for _ in range(10):  # 10 batches per epoch
            batch = experience_buffer.sample(batch_size)

            # Compute advantages
            advantages = []
            for exp in batch:
                adv = value_function.compute_advantage(
                    exp.state,
                    exp.reward
                )
                advantages.append(adv)

            # Update policy (Actor)
            policy_loss = compute_policy_loss(batch, advantages)
            policy.update(policy_loss)

            # Update value function (Critic)
            value_loss = compute_value_loss(batch)
            value_function.update(value_loss)

            epoch_metrics.append({
                'policy_loss': policy_loss,
                'value_loss': value_loss,
                'mean_advantage': np.mean(advantages)
            })

        # Aggregate and log
        epoch_summary = {
            'epoch': epoch,
            'policy_loss': np.mean([m['policy_loss'] for m in epoch_metrics]),
            'value_loss': np.mean([m['value_loss'] for m in epoch_metrics]),
            'mean_advantage': np.mean([m['mean_advantage'] for m in epoch_metrics])
        }
        training_history.append(epoch_summary)

        if epoch % 10 == 0:
            print(f"Epoch {epoch}: Policy Loss={epoch_summary['policy_loss']:.4f}, "
                  f"Value Loss={epoch_summary['value_loss']:.4f}")

    return training_history
```

---

## Key Concepts Summary

| Concept | Description | ai-core Example |
|---------|-------------|-----------------|
| **State** | Current situation | Task features, context, history |
| **Action** | Decision to make | Resources, strategy, parameters |
| **Reward** | Feedback signal | Success, efficiency, quality score |
| **Policy** | Decision-making strategy | Neural network mapping state→action |
| **Value** | Expected future reward | How good is this state |
| **Advantage** | Relative action quality | How much better than average |
| **Exploration** | Trying new things | Random actions, epsilon-greedy |
| **Exploitation** | Using known knowledge | Greedy actions, learned policy |

---

## Common RL Challenges

### Challenge 1: Sparse Rewards

```yaml
Problem:
  - Rewards only at end of episode
  - Hard to learn which actions led to reward

Solutions:
  - Reward shaping (intermediate rewards)
  - Reward propagation (credit assignment)
  - Hindsight experience replay
```

### Challenge 2: Credit Assignment

```yaml
Problem:
  - Which action deserves credit/blame?
  - Long sequences of actions

Solutions:
  - Temporal difference learning
  - Eligibility traces
  - Reward discounting (gamma)
```

### Challenge 3: Exploration

```yaml
Problem:
  - Need to explore to find optimal strategy
  - Exploration wastes time on bad actions

Solutions:
  - Epsilon-greedy with decay
  - Optimistic initialization
  - Intrinsic motivation (curiosity)
```

### Challenge 4: Stability

```yaml
Problem:
  - Training is unstable
  - Performance collapses suddenly

Solutions:
  - Experience replay
  - Target networks
  - Gradient clipping
  - Smaller learning rates
```

---

## Best Practices

1. **Start simple** - Use basic algorithms before advanced ones
2. **Monitor metrics** - Track rewards, losses, exploration
3. **Normalize inputs** - Scale features to [0, 1]
4. **Tune rewards** - Align with desired behavior
5. **Use replay buffer** - Break correlation, reuse data
6. **Validate frequently** - Check for overfitting
7. **Save checkpoints** - Keep best models
8. **Be patient** - RL can take time to converge

---

**EOF**
