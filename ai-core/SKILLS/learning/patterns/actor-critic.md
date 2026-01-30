# Actor-Critic Algorithm Patterns

Detailed implementation patterns for Actor-Critic reinforcement learning in ai-core.

## Overview

Actor-Critic combines two neural networks:
- **Actor**: Learns the policy (π(a|s)) - which action to take
- **Critic**: Learns the value function (V(s)) - how good is the state

**Advantages over pure policy gradient:**
- Lower variance through baseline (critic)
- More stable learning
- Faster convergence
- Better sample efficiency

---

## Architecture

### Network Architectures

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class ActorNetwork(nn.Module):
    """
    Policy network: maps state → action probability distribution
    """
    def __init__(self, state_dim, action_dim, hidden_dims=[256, 128]):
        super(ActorNetwork, self).__init__()

        layers = []
        input_dim = state_dim

        # Hidden layers
        for hidden_dim in hidden_dims:
            layers.append(nn.Linear(input_dim, hidden_dim))
            layers.append(nn.ReLU())
            layers.append(nn.Dropout(0.2))  # Prevent overfitting
            input_dim = hidden_dim

        # Output layer (softmax for probabilities)
        layers.append(nn.Linear(input_dim, action_dim))

        self.network = nn.Sequential(*layers)

    def forward(self, state):
        """Return action probability distribution"""
        logits = self.network(state)
        return F.softmax(logits, dim=-1)

    def select_action(self, state, deterministic=False):
        """
        Select action from policy

        Args:
            state: Current state
            deterministic: If True, take argmax; if False, sample

        Returns:
            action: Selected action
            log_prob: Log probability of action
        """
        probs = self.forward(state)

        if deterministic:
            action = probs.argmax(dim=-1)
        else:
            # Sample from distribution
            action = torch.multinomial(probs, 1).squeeze(-1)

        log_prob = torch.log(probs.gather(-1, action.unsqueeze(-1))).squeeze(-1)

        return action, log_prob


class CriticNetwork(nn.Module):
    """
    Value network: maps state → state value V(s)
    """
    def __init__(self, state_dim, hidden_dims=[256, 128]):
        super(CriticNetwork, self).__init__()

        layers = []
        input_dim = state_dim

        # Hidden layers
        for hidden_dim in hidden_dims:
            layers.append(nn.Linear(input_dim, hidden_dim))
            layers.append(nn.ReLU())
            layers.append(nn.Dropout(0.2))
            input_dim = hidden_dim

        # Output layer (single value)
        layers.append(nn.Linear(input_dim, 1))

        self.network = nn.Sequential(*layers)

    def forward(self, state):
        """Return state value V(s)"""
        return self.network(state).squeeze(-1)


class ActorCriticAgent(nn.Module):
    """
    Combined Actor-Critic agent
    """
    def __init__(self, state_dim, action_dim, hidden_dims=[256, 128]):
        super(ActorCriticAgent, self).__init__()

        self.actor = ActorNetwork(state_dim, action_dim, hidden_dims)
        self.critic = CriticNetwork(state_dim, hidden_dims)

        # Shared optimizer
        self.optimizer = torch.optim.Adam(
            self.parameters(),
            lr=1e-4,
            weight_decay=1e-5
        )

    def forward(self, state):
        """Return both policy and value"""
        policy = self.actor(state)
        value = self.critic(state)
        return policy, value

    def select_action(self, state, deterministic=False):
        """Select action and return value"""
        action, log_prob = self.actor.select_action(state, deterministic)
        value = self.critic(state)
        return action, log_prob, value
```

---

## Algorithms

### Advantage Actor-Critic (A2C)

**Synchronous, advantage-based algorithm with low variance.**

```python
def train_a2c(agent, experiences, gamma=0.99, entropy_coef=0.01):
    """
    Advantage Actor-Critic (A2C) training step

    Args:
        agent: ActorCriticAgent
        experiences: List of Experience tuples
        gamma: Discount factor
        entropy_coef: Entropy regularization coefficient

    Returns:
        Dictionary of metrics
    """
    # Prepare batch
    states = torch.stack([torch.from_numpy(e.state) for e in experiences])
    actions = torch.stack([torch.from_numpy(e.action) for e in experiences])
    rewards = torch.tensor([e.reward for e in experiences], dtype=torch.float32)

    # Forward pass
    policies, values = agent(states)

    # Compute advantages (rewards - baseline)
    advantages = rewards - values.detach()

    # Actor loss: policy gradient with advantage
    # We want to maximize expected advantage
    log_probs = torch.log(policies.gather(1, actions.argmax(dim=1, keepdim=True)))
    actor_loss = -(log_probs * advantages.unsqueeze(1)).mean()

    # Critic loss: MSE between predicted and actual returns
    critic_loss = F.mse_loss(values, rewards)

    # Entropy bonus: encourage exploration
    entropy = -(policies * torch.log(policies + 1e-10)).sum(dim=-1).mean()

    # Combined loss
    total_loss = actor_loss + critic_loss - entropy_coef * entropy

    # Update
    agent.optimizer.zero_grad()
    total_loss.backward()
    torch.nn.utils.clip_grad_norm_(agent.parameters(), max_norm=1.0)
    agent.optimizer.step()

    return {
        'actor_loss': actor_loss.item(),
        'critic_loss': critic_loss.item(),
        'entropy': entropy.item(),
        'total_loss': total_loss.item(),
        'mean_reward': rewards.mean().item(),
        'mean_value': values.mean().item(),
        'mean_advantage': advantages.mean().item()
    }
```

### Proximal Policy Optimization (PPO)

**More stable than A2C, handles large policy updates through clipping.**

```python
def train_ppo(agent, experiences, old_policies, clip_ratio=0.2,
              gamma=0.99, entropy_coef=0.01):
    """
    Proximal Policy Optimization (PPO) training step

    Args:
        agent: ActorCriticAgent
        experiences: List of Experience tuples
        old_policies: Policy from previous iteration
        clip_ratio: PPO clipping parameter
        gamma: Discount factor
        entropy_coef: Entropy regularization coefficient

    Returns:
        Dictionary of metrics
    """
    # Prepare batch
    states = torch.stack([torch.from_numpy(e.state) for e in experiences])
    actions = torch.stack([torch.from_numpy(e.action) for e in experiences])
    rewards = torch.tensor([e.reward for e in experiences], dtype=torch.float32)

    # Forward pass
    policies, values = agent(states)

    # Compute advantages
    advantages = rewards - values.detach()

    # Compute probability ratios
    action_probs = policies.gather(1, actions.argmax(dim=1, keepdim=True))
    old_action_probs = old_policies.gather(1, actions.argmax(dim=1, keepdim=True))
    ratios = action_probs / (old_action_probs + 1e-10)

    # PBO clipped objective
    surr1 = ratios * advantages.unsqueeze(1)
    surr2 = torch.clamp(ratios, 1 - clip_ratio, 1 + clip_ratio) * advantages.unsqueeze(1)
    actor_loss = -torch.min(surr1, surr2).mean()

    # Critic loss
    critic_loss = F.mse_loss(values, rewards)

    # Entropy bonus
    entropy = -(policies * torch.log(policies + 1e-10)).sum(dim=-1).mean()

    # Combined loss
    total_loss = actor_loss + critic_loss - entropy_coef * entropy

    # Update
    agent.optimizer.zero_grad()
    total_loss.backward()
    torch.nn.utils.clip_grad_norm_(agent.parameters(), max_norm=1.0)
    agent.optimizer.step()

    return {
        'actor_loss': actor_loss.item(),
        'critic_loss': critic_loss.item(),
        'entropy': entropy.item(),
        'total_loss': total_loss.item(),
        'mean_reward': rewards.mean().item(),
        'approx_kl': (old_action_probs - action_probs).mean().item()
    }
```

### Soft Actor-Critic (SAC)

**Maximum entropy RL for better exploration.**

```python
class SACAgent(nn.Module):
    """
    Soft Actor-Critic with automatic temperature tuning
    """
    def __init__(self, state_dim, action_dim, hidden_dims=[256, 128]):
        super(SACAgent, self).__init__()

        self.actor = ActorNetwork(state_dim, action_dim, hidden_dims)
        self.critic = CriticNetwork(state_dim, hidden_dims)
        self.critic_target = CriticNetwork(state_dim, hidden_dims)

        # Copy parameters to target
        self.critic_target.load_state_dict(self.critic.state_dict())

        # Temperature parameter (for entropy)
        self.log_alpha = torch.zeros(1, requires_grad=True)
        self.target_entropy = -action_dim  # Target entropy

        # Optimizers
        self.actor_optimizer = torch.optim.Adam(self.actor.parameters(), lr=1e-4)
        self.critic_optimizer = torch.optim.Adam(self.critic.parameters(), lr=1e-4)
        self.alpha_optimizer = torch.optim.Adam([self.log_alpha], lr=1e-4)

    def train_sac(self, experiences, gamma=0.99, tau=0.005):
        """
        SAC training step with automatic temperature tuning
        """
        states = torch.stack([torch.from_numpy(e.state) for e in experiences])
        actions = torch.stack([torch.from_numpy(e.action) for e in experiences])
        rewards = torch.tensor([e.reward for e in experiences], dtype=torch.float32)

        # Actor loss: maximize entropy and reward
        policies, _ = self.actor(states), self.critic(states)
        actor_loss = (self.log_alpha.exp() * (-torch.log(policies + 1e-10)) - \
                     self.critic(states).detach()).mean()

        # Critic loss
        critic_loss = F.mse_loss(self.critic(states), rewards)

        # Temperature loss
        alpha_loss = -(self.log_alpha * \
                      (torch.log(policies + 1e-10) + self.target_entropy).detach()).mean()

        # Update
        self.actor_optimizer.zero_grad()
        actor_loss.backward()
        self.actor_optimizer.step()

        self.critic_optimizer.zero_grad()
        critic_loss.backward()
        self.critic_optimizer.step()

        self.alpha_optimizer.zero_grad()
        alpha_loss.backward()
        self.alpha_optimizer.step()

        # Soft update target
        for param, target_param in zip(self.critic.parameters(),
                                       self.critic_target.parameters()):
            target_param.data.copy_(tau * param.data + (1 - tau) * target_param.data)

        return {
            'actor_loss': actor_loss.item(),
            'critic_loss': critic_loss.item(),
            'alpha_loss': alpha_loss.item(),
            'alpha': self.log_alpha.exp().item()
        }
```

---

## Training Strategies

### Training Loop

```python
def train_actor_critic(experience_buffer, agent, algorithm='a2c',
                       epochs=100, batch_size=64, validation_split=0.2):
    """
    Full training loop for Actor-Critic
    """
    # Split into train/validation
    n_val = int(len(experience_buffer) * validation_split)
    train_experiences = experience_buffer[:-n_val]
    val_experiences = experience_buffer[-n_val:]

    training_history = []
    best_val_reward = float('-inf')
    best_model_state = None

    for epoch in range(epochs):
        # Training
        epoch_metrics = []
        for i in range(0, len(train_experiences), batch_size):
            batch = train_experiences[i:i+batch_size]

            if algorithm == 'a2c':
                metrics = train_a2c(agent, batch)
            elif algorithm == 'ppo':
                metrics = train_ppo(agent, batch, agent.actor(batch[0].state))
            elif algorithm == 'sac':
                metrics = agent.train_sac(batch)

            epoch_metrics.append(metrics)

        # Aggregate epoch metrics
        epoch_summary = {
            'epoch': epoch,
            'train_' + k: np.mean([m[k] for m in epoch_metrics])
            for k in epoch_metrics[0].keys()
        }

        # Validation
        val_metrics = evaluate_policy(agent, val_experiences)
        epoch_summary['val_mean_reward'] = val_metrics['mean_reward']
        epoch_summary['val_success_rate'] = val_metrics['success_rate']

        training_history.append(epoch_summary)

        # Save best model
        if val_metrics['mean_reward'] > best_val_reward:
            best_val_reward = val_metrics['mean_reward']
            best_model_state = agent.state_dict()

        # Logging
        if epoch % 10 == 0:
            print(f"Epoch {epoch}: Train Reward={epoch_summary['train_mean_reward']:.2f}, "
                  f"Val Reward={val_metrics['mean_reward']:.2f}")

    # Load best model
    if best_model_state is not None:
        agent.load_state_dict(best_model_state)

    return agent, training_history
```

### Curriculum Learning

```python
def curriculum_train(experience_buffer, agent):
    """
    Train with curriculum: start simple, increase difficulty
    """
    # Sort by complexity
    simple = [e for e in experience_buffer if e.metadata['complexity'] == 'simple']
    medium = [e for e in experience_buffer if e.metadata['complexity'] == 'medium']
    complex_exp = [e for e in experience_buffer if e.metadata['complexity'] == 'complex']

    # Phase 1: Simple tasks
    print("Phase 1: Training on simple tasks")
    agent, _ = train_actor_critic(simple, agent, epochs=50)

    # Phase 2: Add medium tasks
    print("Phase 2: Adding medium tasks")
    agent, _ = train_actor_critic(simple + medium, agent, epochs=50)

    # Phase 3: All tasks
    print("Phase 3: Training on all tasks")
    agent, history = train_actor_critic(
        simple + medium + complex_exp,
        agent,
        epochs=100
    )

    return agent, history
```

---

## Hyperparameter Tuning

### Grid Search

```python
def grid_search_hyperparams(experience_buffer, param_grid):
    """
    Grid search over hyperparameters
    """
    results = []

    for lr in param_grid['learning_rate']:
        for hidden in param_grid['hidden_dims']:
            for gamma in param_grid['gamma']:

                # Create agent
                agent = ActorCriticAgent(
                    state_dim=50,
                    action_dim=30,
                    hidden_dims=hidden
                )
                agent.optimizer = torch.optim.Adam(agent.parameters(), lr=lr)

                # Train
                agent, history = train_actor_critic(
                    experience_buffer,
                    agent,
                    epochs=50
                )

                # Evaluate
                final_reward = history[-1]['val_mean_reward']

                results.append({
                    'learning_rate': lr,
                    'hidden_dims': hidden,
                    'gamma': gamma,
                    'final_reward': final_reward
                })

                print(f"LR={lr}, Hidden={hidden}, Gamma={gamma}: Reward={final_reward:.2f}")

    # Return best configuration
    return max(results, key=lambda x: x['final_reward'])
```

### Recommended Hyperparameters

```yaml
State Dimension: ~50-100
Action Dimension: ~30-50

Learning Rate: 1e-4
Batch Size: 64-128
Hidden Dims: [256, 128] or [512, 256, 128]
Discount Factor (gamma): 0.99
Entropy Coefficient: 0.01
Clip Ratio (PPO): 0.2
Target Network Update Rate (tau): 0.005

Optimizer: Adam
Weight Decay: 1e-5
Gradient Clipping: 1.0
Dropout: 0.2
```

---

## Model Checkpointing

```python
def save_checkpoint(agent, epoch, metrics, filepath):
    """
    Save model checkpoint
    """
    checkpoint = {
        'epoch': epoch,
        'actor_state_dict': agent.actor.state_dict(),
        'critic_state_dict': agent.critic.state_dict(),
        'optimizer_state_dict': agent.optimizer.state_dict(),
        'metrics': metrics,
        'model_config': {
            'state_dim': agent.actor.network[0].in_features,
            'action_dim': agent.actor.network[-1].out_features,
            'hidden_dims': [layer.out_features for layer in agent.actor.network
                           if isinstance(layer, nn.Linear)][:-1]
        }
    }

    torch.save(checkpoint, filepath)
    print(f"Checkpoint saved to {filepath}")

def load_checkpoint(filepath):
    """
    Load model checkpoint
    """
    checkpoint = torch.load(filepath)

    # Reconstruct model
    config = checkpoint['model_config']
    agent = ActorCriticAgent(
        state_dim=config['state_dim'],
        action_dim=config['action_dim'],
        hidden_dims=config['hidden_dims']
    )

    # Load state
    agent.actor.load_state_dict(checkpoint['actor_state_dict'])
    agent.critic.load_state_dict(checkpoint['critic_state_dict'])
    agent.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])

    return agent, checkpoint
```

---

## Debugging Tools

### Visualization

```python
import matplotlib.pyplot as plt

def plot_training_history(history):
    """
    Plot training metrics over time
    """
    fig, axes = plt.subplots(2, 2, figsize=(12, 8))

    # Actor loss
    axes[0, 0].plot([h['train_actor_loss'] for h in history])
    axes[0, 0].set_title('Actor Loss')
    axes[0, 0].set_xlabel('Epoch')
    axes[0, 0].set_ylabel('Loss')

    # Critic loss
    axes[0, 1].plot([h['train_critic_loss'] for h in history])
    axes[0, 1].set_title('Critic Loss')
    axes[0, 1].set_xlabel('Epoch')
    axes[0, 1].set_ylabel('Loss')

    # Mean reward
    axes[1, 0].plot([h['train_mean_reward'] for h in history], label='Train')
    axes[1, 0].plot([h['val_mean_reward'] for h in history], label='Val')
    axes[1, 0].set_title('Mean Reward')
    axes[1, 0].set_xlabel('Epoch')
    axes[1, 0].set_ylabel('Reward')
    axes[1, 0].legend()

    # Entropy
    axes[1, 1].plot([h['train_entropy'] for h in history])
    axes[1, 1].set_title('Entropy (Exploration)')
    axes[1, 1].set_xlabel('Epoch')
    axes[1, 1].set_ylabel('Entropy')

    plt.tight_layout()
    plt.savefig('training_history.png')
    plt.show()
```

### Policy Analysis

```python
def analyze_policy(agent, state_samples):
    """
    Analyze policy behavior
    """
    actions = []
    confidences = []

    for state in state_samples:
        state_tensor = torch.from_numpy(state).unsqueeze(0)
        policy = agent.actor(state_tensor)
        action = policy.argmax(dim=-1).item()
        confidence = policy.max(dim=-1).values.item()

        actions.append(action)
        confidences.append(confidence)

    return {
        'action_distribution': np.bincount(actions),
        'mean_confidence': np.mean(confidences),
        'low_confidence_ratio': np.mean([c < 0.8 for c in confidences])
    }
```

---

## Best Practices

1. **Start with A2C** - Simple and effective baseline
2. **Use PPO for stability** - If training is unstable
3. **Monitor entropy** - Ensure sufficient exploration
4. **Clip gradients** - Prevent exploding gradients
5. **Use target networks** - For SAC and other algorithms
6. **Normalize rewards** - Scale rewards to reasonable range
7. **Validate frequently** - Check for overfitting
8. **Save checkpoints** - Keep best models

---

**EOF**
