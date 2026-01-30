---
name: learning
description: >
  Machine learning patterns for ai-core orchestration. Includes Actor-Critic
  reinforcement learning, experience collection, state management, reward design,
  policy training, and model deployment. Optimizes resource selection and
  execution strategies through continuous learning.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0.0"
  scope: [root]
  auto_invoke:
    - "collect experience"
    - "train policy"
    - "optimize resources"
    - "learning mode"
    - "actor-critic"
    - "reinforcement learning"
allowed-tools: [Read,Write,Edit,Bash,AskUserQuestion]
---

# Learning Skill

You are implementing **machine learning patterns** for ai-core orchestration optimization.

## Mission

**Enable ai-core to learn from experience and improve decision-making:**

1. **State Management** - Represent orchestration states effectively
2. **Experience Collection** - Gather execution data systematically
3. **Reward Design** - Shape rewards to guide learning
4. **Policy Training** - Train Actor-Critic models
5. **Deployment** - Deploy and monitor learned policies

---

## Core Concepts

### Reinforcement Learning Loop

```
State → Action → Environment → Reward → Next State → Experience → Training → Improved Policy
```

### Key Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **State** | Represent current situation | SKILLS/learning/patterns/reinforcement-learning.md |
| **Action** | Decision to make resources/strategy | SUBAGENTS/universal/actor-critic-learner.md |
| **Reward** | Feedback signal for learning | This file |
| **Experience** | State-action-reward tuples | SKILLS/learning/assets/experience_collector.py |
| **Policy** | Mapping from state to action | patterns/actor-critic.md |

---

## State Management

### State Representation

```yaml
# Vectorized state (for neural network)
state_vector = {
  # Task features (one-hot encoded)
  'task_type': [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],  # 13 dims
  'domain': [0, 0, 1, 0, 0, 0, 0, 0, 0],                 # 9 dims
  'complexity': [0, 1, 0],                                # 3 dims
  'risk_level': [0, 1, 0],                                # 3 dims

  # Context features (normalized)
  'estimated_time': 0.5,                                  # 1 dim
  'domain_diversity': 0.4,                                # 1 dim
  'skill_count': 0.6,                                     # 1 dim

  # Historical features
  'success_rate': 0.85,                                   # 1 dim
  'time_accuracy': 0.72,                                  # 1 dim
  'resource_efficiency': 0.90,                            # 1 dim

  # System state
  'concurrent_tasks': 0.2,                                # 1 dim
  'system_load': 0.3,                                     # 1 dim
  'agent_availability': [0.8, 1.0, 0.5, ...]             # N dims
}

# Total: ~50-100 dimensions
```

### State Normalization

```python
def normalize_state(raw_state):
    """
    Normalize state features to [0, 1] range for neural network
    """
    normalized = {}

    # One-hot features (already normalized)
    for key in ['task_type', 'domain', 'complexity', 'risk_level']:
        normalized[key] = raw_state[key]

    # Time features (min-max normalization)
    normalized['estimated_time'] = (
        (raw_state['estimated_time'] - MIN_TIME) /
        (MAX_TIME - MIN_TIME)
    )

    # Count features (clip and normalize)
    normalized['domain_diversity'] = min(raw_state['domain_diversity'], 5) / 5
    normalized['skill_count'] = min(raw_state['skill_count'], 10) / 10

    # Rate features (already 0-1)
    for key in ['success_rate', 'time_accuracy', 'resource_efficiency']:
        normalized[key] = np.clip(raw_state[key], 0, 1)

    # System state
    normalized['concurrent_tasks'] = min(raw_state['concurrent_tasks'], 10) / 10
    normalized['system_load'] = np.clip(raw_state['system_load'], 0, 1)
    normalized['agent_availability'] = np.clip(
        raw_state['agent_availability'], 0, 1
    )

    # Flatten to vector
    return flatten_state(normalized)
```

### State Extraction

```python
def extract_state_from_execution(execution_context):
    """
    Extract state features from execution context
    """
    state = {}

    # Task features (from intent analysis)
    intent = execution_context['intent_analysis']
    state['task_type'] = one_hot_encode(
        intent['classification']['task_type'],
        TASK_TYPES
    )
    state['domain'] = one_hot_encode(
        intent['classification']['primary_domain'],
        DOMAINS
    )
    state['complexity'] = ordinal_encode(
        intent['classification']['complexity'],
        COMPLEXITY_LEVELS
    )
    state['risk_level'] = ordinal_encode(
        intent['classification']['risk_level'],
        RISK_LEVELS
    )

    # Context features
    state['estimated_time'] = parse_time(
        intent['estimated_time']
    )
    state['domain_diversity'] = len(
        intent['classification'].get('secondary_domains', [])
    )
    state['skill_count'] = len(
        intent['resources_needed']['skills']
    )

    # Historical features (from experience buffer)
    similar_tasks = find_similar_tasks(state)
    state['success_rate'] = calculate_success_rate(similar_tasks)
    state['time_accuracy'] = calculate_time_accuracy(similar_tasks)
    state['resource_efficiency'] = calculate_resource_efficiency(similar_tasks)

    # System state (from monitoring)
    state['concurrent_tasks'] = get_concurrent_task_count()
    state['system_load'] = get_system_load()
    state['agent_availability'] = get_agent_availability()

    return normalize_state(state)
```

---

## Experience Collection

### Experience Schema

```python
@dataclass
class Experience:
    """Single experience tuple for RL training"""
    state: np.ndarray              # State vector
    action: np.ndarray             # Action taken
    reward: float                  # Reward received
    next_state: np.ndarray         # Next state
    done: bool                     # Episode complete
    metadata: dict                 # Additional info

    def to_dict(self):
        return {
            'state': self.state.tolist(),
            'action': self.action.tolist(),
            'reward': self.reward,
            'next_state': self.next_state.tolist(),
            'done': self.done,
            'metadata': self.metadata,
            'timestamp': datetime.now().isoformat()
        }
```

### Collection Workflow

```python
def collect_experience(execution_context, outcome):
    """
    Collect experience from task execution
    """
    # Extract state before execution
    state = extract_state_from_execution(execution_context)

    # Record action taken
    action = extract_action_from_execution(execution_context)

    # Compute reward from outcome
    reward = compute_reward(outcome, execution_context)

    # Extract next state (if applicable)
    next_state = extract_next_state(execution_context, outcome)

    # Create experience
    experience = Experience(
        state=state,
        action=action,
        reward=reward,
        next_state=next_state,
        done=outcome['success'],  # Episode complete if successful
        metadata={
            'task_id': execution_context['task_id'],
            'task_type': execution_context['intent_analysis']['classification']['task_type'],
            'domain': execution_context['intent_analysis']['classification']['primary_domain'],
            'complexity': execution_context['intent_analysis']['classification']['complexity'],
            'estimated_time': execution_context['intent_analysis']['estimated_time'],
            'actual_time': outcome['actual_time'],
            'resources_used': outcome['resources_used'],
            'error_count': outcome['error_count'],
            'user_modifications': outcome.get('user_modifications', 0),
            'safety_violations': outcome.get('safety_violations', False),
            'confidence': execution_context.get('confidence', 0.5)
        }
    )

    # Store in buffer
    store_experience(experience)

    return experience
```

### Storage Format

```yaml
# File: data/experience_buffer/experiences.jsonl
# Format: One JSON object per line

{"state": [0, 1, 0, ...], "action": [1, 0, 0, ...], "reward": 85.5, "next_state": [0, 1, 0, ...], "done": true, "metadata": {...}}
{"state": [1, 0, 0, ...], "action": [0, 1, 0, ...], "reward": -45.2, "next_state": [1, 0, 0, ...], "done": false, "metadata": {...}}
{"state": [0, 0, 1, ...], "action": [0, 0, 1, ...], "reward": 120.3, "next_state": [0, 0, 1, ...], "done": true, "metadata": {...}}
```

---

## Reward Function

### Reward Components

```python
def compute_reward(outcome, context):
    """
    Compute reward from execution outcome

    Range: [-100, +180]
    Target: Positive rewards for good outcomes
    """
    reward = 0

    # 1. Success reward (dominant)
    reward += 100 if outcome['success'] else -100

    # 2. Time efficiency
    if outcome['success']:
        estimated_minutes = parse_time(context['estimated_time'])
        actual_minutes = outcome['actual_time']
        efficiency = min(estimated_minutes / max(actual_minutes, 1), 2.0)
        reward += efficiency * 20

    # 3. Resource efficiency
    resources_used = len(outcome['resources_used'])
    minimum_resources = outcome.get('minimum_resources', resources_used)
    if resources_used <= minimum_resources:
        reward += 10
    else:
        reward -= (resources_used - minimum_resources) * 5

    # 4. Quality metrics
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

    # 6. Safety adherence
    if not outcome.get('safety_violations', False):
        reward += 10
    else:
        reward -= 50  # Large penalty for safety issues

    # 7. Confidence bonus
    confidence = context.get('confidence', 0.5)
    reward += confidence * 5

    return reward
```

### Reward Shaping Guidelines

```yaml
DO:
  ✅ Align rewards with user goals
  ✅ Balance multiple objectives
  ✅ Scale components appropriately
  ✅ Penalize unsafe behavior heavily
  ✅ Reward efficiency and quality

DON'T:
  ❌ Make rewards too sparse
  ❌ Create reward hacking opportunities
  ❌ Ignore edge cases
  ❌ Over-penalize exploration
  ❌ Forget about safety
```

### Reward Analysis

```python
def analyze_rewards(experiences):
    """
    Analyze reward distribution for debugging
    """
    rewards = [e.reward for e in experiences]

    analysis = {
        'mean': np.mean(rewards),
        'std': np.std(rewards),
        'min': np.min(rewards),
        'max': np.max(rewards),
        'median': np.median(rewards),
        'percentiles': {
            '25': np.percentile(rewards, 25),
            '50': np.percentile(rewards, 50),
            '75': np.percentile(rewards, 75),
        }
    }

    # Component breakdown
    components = {}
    for exp in experiences:
        for component, value in exp.metadata.get('reward_breakdown', {}).items():
            components.setdefault(component, []).append(value)

    analysis['components'] = {
        comp: {
            'mean': np.mean(values),
            'std': np.std(values)
        }
        for comp, values in components.items()
    }

    return analysis
```

---

## Action Representation

### Action Encoding

```python
def encode_action(resources, strategy, parameters):
    """
    Encode action decision into vector for neural network
    """
    action_vector = []

    # Skills (binary vector)
    all_skills = [
        'security', 'backend', 'frontend', 'database',
        'testing', 'api-design', 'architecture', 'devops',
        'performance', 'mobile', 'ai-ml', 'realtime',
        # ... all skills
    ]
    skills_vector = [1 if s in resources['skills'] else 0 for s in all_skills]
    action_vector.extend(skills_vector)

    # Agents (binary vector)
    all_agents = [
        'feature-creator', 'bug-fixer', 'code-refactorer',
        'pr-reviewer', 'security-specialist', 'performance-optimizer',
        # ... all agents
    ]
    agents_vector = [1 if a in resources['agents'] else 0 for a in all_agents]
    action_vector.extend(agents_vector)

    # Strategy (one-hot)
    strategy_map = {'direct': 0, 'sequential': 1, 'parallel': 2, 'coordinated': 3}
    strategy_vector = [0] * 4
    strategy_vector[strategy_map[strategy]] = 1
    action_vector.extend(strategy_vector)

    # Parameters (normalized)
    timeout_norm = (parameters['timeout_multiplier'] - 0.5) / 1.5  # [0, 1]
    parallelism_norm = (parameters['parallelism'] - 1) / 3  # [0, 1]
    action_vector.extend([timeout_norm, parallelism_norm])

    # Retry strategy (one-hot)
    retry_map = {'fail_fast': 0, 'retry_with_backoff': 1, 'fallback': 2}
    retry_vector = [0] * 3
    retry_vector[retry_map[parameters['retry_strategy']]] = 1
    action_vector.extend(retry_vector)

    # Safety level (one-hot)
    safety_map = {'strict': 0, 'balanced': 1, 'permissive': 2}
    safety_vector = [0] * 3
    safety_vector[safety_map[parameters['safety_level']]] = 1
    action_vector.extend(safety_vector)

    return np.array(action_vector, dtype=np.float32)
```

### Action Decoding

```python
def decode_action(action_vector):
    """
    Decode action vector into structured decision
    """
    idx = 0
    action = {'resources': {}, 'strategy': {}, 'parameters': {}}

    # Decode skills
    all_skills = [...]  # Same as encode
    num_skills = len(all_skills)
    skills_binary = action_vector[idx:idx+num_skills]
    action['resources']['skills'] = [
        skill for skill, used in zip(all_skills, skills_binary) if used > 0.5
    ]
    idx += num_skills

    # Decode agents
    all_agents = [...]  # Same as encode
    num_agents = len(all_agents)
    agents_binary = action_vector[idx:idx+num_agents]
    action['resources']['agents'] = [
        agent for agent, used in zip(all_agents, agents_binary) if used > 0.5
    ]
    idx += num_agents

    # Decode strategy
    strategy_map = {0: 'direct', 1: 'sequential', 2: 'parallel', 3: 'coordinated'}
    strategy_idx = np.argmax(action_vector[idx:idx+4])
    action['strategy']['approach'] = strategy_map[strategy_idx]
    idx += 4

    # Decode parameters
    timeout_norm = action_vector[idx]
    action['parameters']['timeout_multiplier'] = 0.5 + timeout_norm * 1.5
    idx += 1

    parallelism_norm = action_vector[idx]
    action['parameters']['parallelism'] = int(1 + parallelism_norm * 3)
    idx += 1

    # Decode retry strategy
    retry_map = {0: 'fail_fast', 1: 'retry_with_backoff', 2: 'fallback'}
    retry_idx = np.argmax(action_vector[idx:idx+3])
    action['parameters']['retry_strategy'] = retry_map[retry_idx]
    idx += 3

    # Decode safety level
    safety_map = {0: 'strict', 1: 'balanced', 2: 'permissive'}
    safety_idx = np.argmax(action_vector[idx:idx+3])
    action['parameters']['safety_level'] = safety_map[safety_idx]

    return action
```

---

## Training Pipeline

### Data Preparation

```python
def prepare_training_data(experiences, batch_size=64):
    """
    Prepare mini-batch for training
    """
    # Sample batch from experiences
    batch = random.sample(experiences, min(batch_size, len(experiences)))

    # Extract components
    states = torch.stack([torch.from_numpy(e.state) for e in batch])
    actions = torch.stack([torch.from_numpy(e.action) for e in batch])
    rewards = torch.tensor([e.reward for e in batch], dtype=torch.float32)

    return states, actions, rewards
```

### Training Loop

```python
def train_policy(experiences, actor, critic, optimizer, epochs=100):
    """
    Train Actor-Critic policy using A2C
    """
    training_history = []

    for epoch in range(epochs):
        # Prepare batch
        states, actions, rewards = prepare_training_data(experiences)

        # Forward pass
        values = critic(states)
        advantages = rewards - values.detach()

        # Actor loss
        policy = actor(states)
        log_probs = torch.log(policy.gather(1, actions.argmax(dim=1, keepdim=True)))
        actor_loss = -(log_probs * advantages).mean()

        # Critic loss
        critic_loss = F.mse_loss(values.squeeze(), rewards)

        # Update
        optimizer.zero_grad()
        (actor_loss + critic_loss).backward()
        torch.nn.utils.clip_grad_norm_(actor.parameters(), 1.0)
        torch.nn.utils.clip_grad_norm_(critic.parameters(), 1.0)
        optimizer.step()

        # Record metrics
        training_history.append({
            'epoch': epoch,
            'actor_loss': actor_loss.item(),
            'critic_loss': critic_loss.item(),
            'mean_reward': rewards.mean().item(),
            'mean_value': values.mean().item()
        })

    return training_history
```

---

## Model Evaluation

### Evaluation Metrics

```python
def evaluate_policy(model, test_experiences):
    """
    Evaluate policy on test set
    """
    metrics = {}

    # Prediction accuracy
    correct = 0
    for exp in test_experiences:
        predicted_action = model.predict(exp.state)
        if np.allclose(predicted_action, exp.action, atol=0.1):
            correct += 1
    metrics['accuracy'] = correct / len(test_experiences)

    # Average reward
    metrics['mean_reward'] = np.mean([e.reward for e in test_experiences])

    # Success rate
    successful = [e for e in test_experiences if e.metadata.get('success', False)]
    metrics['success_rate'] = len(successful) / len(test_experiences)

    # Resource efficiency
    resources_used = [len(e.metadata.get('resources_used', [])) for e in test_experiences]
    resources_needed = [e.metadata.get('minimum_resources', 1) for e in test_experiences]
    efficiency = [
        needed / max(used, 1) for used, needed in zip(resources_used, resources_needed)
    ]
    metrics['resource_efficiency'] = np.mean(efficiency)

    # Time accuracy
    estimated = [parse_time(e.metadata.get('estimated_time', '1 hour')) for e in test_experiences]
    actual = [e.metadata.get('actual_time', 60) for e in test_experiences]
    time_errors = [abs(e - a) / max(e, 1) for e, a in zip(estimated, actual)]
    metrics['time_accuracy'] = 1 - np.mean(time_errors)

    return metrics
```

### Baseline Comparison

```python
def compare_to_baseline(learned_metrics, rule_based_metrics):
    """
    Compare learned policy to rule-based baseline
    """
    comparison = {}

    for metric in learned_metrics:
        learned = learned_metrics[metric]
        baseline = rule_based_metrics[metric]

        comparison[metric] = {
            'learned': learned,
            'baseline': baseline,
            'improvement': (learned - baseline) / baseline if baseline > 0 else 0,
            'better': learned > baseline
        }

    return comparison
```

---

## Deployment

### Deployment Checklist

```yaml
Pre-deployment:
  [ ] Model trained and validated
  [ ] Test accuracy > 70%
  [ ] Success rate > 85%
  [ ] Safety validation passed
  [ ] Rollback plan ready
  [ ] Monitoring configured
  [ ] Documentation updated

Deployment:
  [ ] Backup current policy
  [ ] Deploy to shadow mode
  [ ] Monitor for 24-48 hours
  [ ] Check metrics dashboard
  [ ] Verify no degradation

Post-deployment:
  [ ] Continue monitoring
  [ ] Collect feedback
  [ ] Track improvements
  [ ] Plan next iteration
```

### Monitoring Metrics

```yaml
Real-time:
  - Success rate (rolling 100)
  - Average reward (rolling 100)
  - Confidence distribution
  - Resource usage
  - Execution time

Daily:
  - Experience buffer size
  - Training progress
  - Model performance
  - Anomaly detection

Weekly:
  - Policy version
  - A/B test results
  - User satisfaction
  - System health
```

---

## Common Patterns

### Pattern 1: Start Simple

```yaml
Don't:
  ❌ Start with complex multi-agent coordination
  ❌ Use all features from day one
  ❌ Deploy to production immediately

Do:
  ✅ Start with single-agent tasks
  ✅ Use minimal feature set
  ✅ Run in shadow mode first
```

### Pattern 2: Iterate Gradually

```yaml
Phase 1: Shadow mode (data collection)
  → Collect experiences
  → Build training dataset
  → Validate data quality

Phase 2: Training (offline)
  → Train initial policy
  → Validate on test set
  → Compare to baseline

Phase 3: A/B testing (limited production)
  → 10% traffic to learned policy
  → Monitor performance
  → Validate safety

Phase 4: Gradual rollout
  → Increase traffic gradually
  → 25% → 50% → 100%
  → Continuous monitoring
```

### Pattern 3: Safety First

```yaml
Always:
  ✅ Maintain fallback to rules
  ✅ Set confidence threshold
  ✅ Monitor for anomalies
  ✅ Have rollback plan

Never:
  ❌ Deploy without testing
  ❌ Ignore safety violations
  ❌ Remove fallback mechanisms
  ❌ Disable monitoring
```

---

## File Operations

### Create Experience Storage

```bash
# Create directory structure
mkdir -p data/experience_buffer
mkdir -p data/models
mkdir -p data/policies
mkdir -p data/metrics

# Initialize experience buffer
touch data/experience_buffer/experiences.jsonl
```

### Start Collection

```bash
# Enable shadow mode
export AI_CORE_LEARNING_MODE=shadow

# Experiences automatically collected
# Check buffer size
wc -l data/experience_buffer/experiences.jsonl
```

### Train Model

```bash
# Train on collected experiences
python -m learning.train \
  --data data/experience_buffer/experiences.jsonl \
  --algorithm a2c \
  --epochs 100 \
  --output data/models/

# Evaluate
python -m learning.evaluate \
  --model data/models/actor_checkpoint_v1.0.pt \
  --test-data data/experience_buffer/test.jsonl
```

---

## Best Practices

1. **Data Quality**: Collect diverse, high-quality experiences
2. **Reward Design**: Align rewards with user goals
3. **Safety**: Always maintain fallback mechanisms
4. **Monitoring**: Track metrics continuously
5. **Iteration**: Improve policies gradually
6. **Documentation**: Document training runs and deployments
7. **Testing**: Validate thoroughly before deployment
8. **Rollback**: Always have rollback plan ready

---

## Troubleshooting

### Issue: Sparse Rewards

```yaml
Symptoms:
  - Most rewards are zero or near-zero
  - Model doesn't learn

Solutions:
  - Add reward shaping
  - Use intermediate rewards
  - Adjust reward scale
  - Check for bugs in reward function
```

### Issue: High Variance

```yaml
Symptoms:
  - Rewards vary wildly
  - Unstable training

Solutions:
  - Increase batch size
  - Use larger replay buffer
  - Implement reward normalization
  - Add entropy regularization
```

### Issue: Policy Collapse

```yaml
Symptoms:
  - Model always predicts same action
  - Performance drops suddenly

Solutions:
  - Increase exploration rate
  - Check for reward hacking
  - Add entropy bonus
  - Verify state representation
```

---

**EOF**

---

## Examples

### Example 1: Collecting Experience for RL Training

```python
from dataclasses import dataclass
from typing import Dict, List, Any
import json

@dataclass
class Experience:
    """Single experience sample for RL training"""
    state: Dict[str, Any]  # Current state (task context, file tree)
    action: str  # Action taken (skill/agent selected)
    reward: float  # Reward signal
    next_state: Dict[str, Any]  # Resulting state
    done: bool  # Whether task completed
    metadata: Dict[str, Any]  # Additional info

class ExperienceCollector:
    def __init__(self):
        self.buffer: List[Experience] = []
    
    def collect(self, experience: Experience):
        """Store experience in buffer"""
        self.buffer.append(experience)
        
        # Persist to disk periodically
        if len(self.buffer) % 100 == 0:
            self._persist()
    
    def _persist(self):
        """Save experiences to file"""
        with open('data/experience_buffer/experiences.jsonl', 'a') as f:
            for exp in self.buffer:
                f.write(json.dumps(exp) + '\n')
        self.buffer.clear()
