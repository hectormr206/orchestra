#!/usr/bin/env python3
"""
PyTorch implementation of Actor-Critic networks for ai-core

Simple, functional implementation for validation and training.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from typing import Dict, List, Tuple, Optional


class ActorNetwork(nn.Module):
    """
    Policy network: maps state → action probability distribution
    """

    def __init__(self, state_dim: int, action_dim: int, hidden_dims: List[int] = [256, 128]):
        super(ActorNetwork, self).__init__()

        layers = []
        input_dim = state_dim

        for hidden_dim in hidden_dims:
            layers.extend([
                nn.Linear(input_dim, hidden_dim),
                nn.ReLU(),
                nn.Dropout(0.2),
            ])
            input_dim = hidden_dim

        # Output layer
        layers.append(nn.Linear(input_dim, action_dim))

        self.network = nn.Sequential(*layers)

    def forward(self, state: torch.Tensor) -> torch.Tensor:
        """Return action probability distribution"""
        logits = self.network(state)
        return F.softmax(logits, dim=-1)

    def select_action(
        self,
        state: torch.Tensor,
        deterministic: bool = False
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Select action from policy

        Returns:
            action: Selected action
            log_prob: Log probability of action
        """
        probs = self.forward(state)

        if deterministic:
            action = probs.argmax(dim=-1)
        else:
            action = torch.multinomial(probs, 1).squeeze(-1)

        log_prob = torch.log(probs.gather(-1, action.unsqueeze(-1))).squeeze(-1)

        return action, log_prob

    def get_action_probs(self, state: torch.Tensor) -> torch.Tensor:
        """Get action probabilities (for analysis)"""
        with torch.no_grad():
            return self.forward(state)


class CriticNetwork(nn.Module):
    """
    Value network: maps state → state value V(s)
    """

    def __init__(self, state_dim: int, hidden_dims: List[int] = [256, 128]):
        super(CriticNetwork, self).__init__()

        layers = []
        input_dim = state_dim

        for hidden_dim in hidden_dims:
            layers.extend([
                nn.Linear(input_dim, hidden_dim),
                nn.ReLU(),
                nn.Dropout(0.2),
            ])
            input_dim = hidden_dim

        # Output layer (single value)
        layers.append(nn.Linear(input_dim, 1))

        self.network = nn.Sequential(*layers)

    def forward(self, state: torch.Tensor) -> torch.Tensor:
        """Return state value V(s)"""
        return self.network(state).squeeze(-1)


class ActorCriticAgent(nn.Module):
    """
    Combined Actor-Critic agent
    """

    def __init__(
        self,
        state_dim: int,
        action_dim: int,
        hidden_dims: List[int] = [256, 128],
        learning_rate: float = 1e-4
    ):
        super(ActorCriticAgent, self).__init__()

        self.actor = ActorNetwork(state_dim, action_dim, hidden_dims)
        self.critic = CriticNetwork(state_dim, hidden_dims)

        # Optimizer
        self.optimizer = torch.optim.Adam(
            self.parameters(),
            lr=learning_rate,
            weight_decay=1e-5
        )

        self.state_dim = state_dim
        self.action_dim = action_dim

    def forward(self, state: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """Return both policy and value"""
        policy = self.actor(state)
        value = self.critic(state)
        return policy, value

    def select_action(
        self,
        state: torch.Tensor,
        deterministic: bool = False
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        Select action and return value

        Returns:
            action: Selected action
            log_prob: Log probability
            value: State value
        """
        action, log_prob = self.actor.select_action(state, deterministic)
        value = self.critic(state)
        return action, log_prob, value

    def get_action_config(self, action_vector: np.ndarray) -> Dict:
        """
        Convert action vector to configuration dictionary

        This is a placeholder - in real implementation, decode properly
        """
        return {
            'resources': {
                'skills': ['backend', 'frontend'],  # Placeholder
                'agents': ['feature-creator']
            },
            'strategy': {
                'approach': 'coordinated'
            },
            'parameters': {
                'timeout_multiplier': 1.0,
                'parallelism': 2
            }
        }

    def get_confidence(self, state: torch.Tensor, action: torch.Tensor) -> float:
        """
        Get confidence score for action

        Returns the probability of the selected action
        """
        with torch.no_grad():
            probs = self.actor.get_action_probs(state)
            if action.dim() == 0:
                action = action.unsqueeze(0)
            confidence = probs.gather(-1, action.unsqueeze(-1) if action.dim() == 1 else action)
            return confidence.item()


def train_a2c(
    agent: ActorCriticAgent,
    states: torch.Tensor,
    actions: torch.Tensor,
    rewards: torch.Tensor,
    entropy_coef: float = 0.01
) -> Dict[str, float]:
    """
    Advantage Actor-Critic (A2C) training step

    Args:
        agent: ActorCriticAgent
        states: Batch of states
        actions: Batch of actions
        rewards: Batch of rewards
        entropy_coef: Entropy regularization coefficient

    Returns:
        Dictionary of training metrics
    """
    # Forward pass
    policies, values = agent(states)

    # Compute advantages (rewards - baseline)
    advantages = rewards - values.detach()

    # Actor loss: policy gradient with advantage
    # For discrete actions, use the action index
    action_indices = actions.argmax(dim=-1)
    log_probs = torch.log(policies.gather(1, action_indices.unsqueeze(1))).squeeze(1)
    actor_loss = -(log_probs * advantages).mean()

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


def save_checkpoint(
    agent: ActorCriticAgent,
    epoch: int,
    metrics: Dict,
    filepath: str
):
    """Save model checkpoint"""
    checkpoint = {
        'epoch': epoch,
        'actor_state_dict': agent.actor.state_dict(),
        'critic_state_dict': agent.critic.state_dict(),
        'optimizer_state_dict': agent.optimizer.state_dict(),
        'metrics': metrics,
        'model_config': {
            'state_dim': agent.state_dim,
            'action_dim': agent.action_dim,
        }
    }

    torch.save(checkpoint, filepath)
    print(f"✅ Checkpoint saved to {filepath}")


def load_checkpoint(filepath: str) -> Tuple[ActorCriticAgent, Dict]:
    """Load model checkpoint"""
    checkpoint = torch.load(filepath, weights_only=False)

    # Reconstruct model
    config = checkpoint['model_config']
    agent = ActorCriticAgent(
        state_dim=config['state_dim'],
        action_dim=config['action_dim']
    )

    # Load state
    agent.actor.load_state_dict(checkpoint['actor_state_dict'])
    agent.critic.load_state_dict(checkpoint['critic_state_dict'])
    agent.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])

    return agent, checkpoint


if __name__ == '__main__':
    # Test the networks
    print("Testing Actor-Critic networks...")

    state_dim = 50
    action_dim = 30
    batch_size = 4

    # Create agent
    agent = ActorCriticAgent(state_dim, action_dim)
    print(f"✅ Created agent: {state_dim} -> {action_dim}")

    # Test forward pass
    states = torch.randn(batch_size, state_dim)
    actions, log_probs, values = agent.select_action(states)
    print(f"✅ Forward pass: actions={actions.shape}, values={values.shape}")

    # Test training step
    rewards = torch.randn(batch_size)
    actions_one_hot = torch.zeros(batch_size, action_dim)
    actions_one_hot[range(batch_size), actions] = 1

    metrics = train_a2c(agent, states, actions_one_hot, rewards)
    print(f"✅ Training step: actor_loss={metrics['actor_loss']:.4f}")

    # Test save/load
    save_checkpoint(agent, 0, metrics, '/tmp/test_checkpoint.pt')
    agent_loaded, ckpt = load_checkpoint('/tmp/test_checkpoint.pt')
    print(f"✅ Save/load checkpoint successful")

    print("\n✅ All tests passed!")
