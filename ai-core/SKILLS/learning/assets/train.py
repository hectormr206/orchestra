#!/usr/bin/env python3
"""
Train Actor-Critic model on collected experiences

Usage:
    python train.py --data data/experience_buffer/experiences.jsonl
    python train.py --data data/experience_buffer/experiences.jsonl --epochs 100 --batch-size 64
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Tuple

import numpy as np
import torch
import torch.nn.functional as F

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from experience_collector import ExperienceCollector, Experience
from models import ActorCriticAgent, train_a2c, save_checkpoint


def load_experiences(filepath: Path) -> List[Experience]:
    """Load experiences from JSONL file"""
    collector = ExperienceCollector(buffer_path=filepath)
    experiences = collector.load_experiences()

    if not experiences:
        print(f"❌ ERROR: No experiences found in {filepath}")
        print(f"   Run in shadow mode first to collect experiences")
        sys.exit(1)

    print(f"✅ Loaded {len(experiences)} experiences")
    return experiences


def extract_state_vector(exp: Experience) -> np.ndarray:
    """
    Extract state vector from experience

    Simplified version - in production, use proper feature extraction
    """
    # For now, create a simple feature vector from metadata
    features = []

    # Task type (one-hot encode simple version)
    task_type = exp.metadata.get('task_type', 'feature')
    task_types = ['feature', 'bug', 'refactor', 'test', 'docs', 'review']
    features.extend([1.0 if task_type == t else 0.0 for t in task_types])

    # Domain (one-hot encode)
    domain = exp.metadata.get('domain', 'backend')
    domains = ['frontend', 'backend', 'database', 'security', 'testing']
    features.extend([1.0 if domain == d else 0.0 for d in domains])

    # Complexity (ordinal)
    complexity = exp.metadata.get('complexity', 'medium')
    complexity_levels = ['simple', 'medium', 'complex']
    idx = complexity_levels.index(complexity) if complexity in complexity_levels else 1
    features.extend([1.0 if i == idx else 0.0 for i in range(3)])

    # Risk level (ordinal)
    risk = exp.metadata.get('risk_level', 'low')
    risk_levels = ['low', 'medium', 'high']
    idx = risk_levels.index(risk) if risk in risk_levels else 0
    features.extend([1.0 if i == idx else 0.0 for i in range(3)])

    # Estimated time (normalized)
    # Parse time string to minutes (simplified)
    time_str = exp.metadata.get('estimated_time', '1 hour')
    if 'hour' in time_str.lower():
        hours = float(time_str.lower().replace('hours', '').replace('hour', '').strip())
        time_mins = hours * 60
    elif 'min' in time_str.lower():
        time_mins = float(time_str.lower().replace('min', '').strip())
    else:
        time_mins = 60.0

    features.append(min(time_mins / 480, 1.0))  # Normalize to [0, 1]

    # Add some padding to reach desired dimension
    while len(features) < 50:
        features.append(0.0)

    return np.array(features[:50], dtype=np.float32)


def extract_action_vector(exp: Experience) -> np.ndarray:
    """
    Extract action vector from experience

    Simplified version - in production, use proper action encoding
    """
    # For now, create a simple action vector
    features = []

    # Skills used (binary vector)
    all_skills = [
        'security', 'backend', 'frontend', 'database',
        'testing', 'api-design', 'architecture', 'devops',
        'performance', 'code-quality'
    ]
    skills_used = exp.metadata.get('skills_used', [])

    # Try to infer skills from domain
    domain = exp.metadata.get('domain', '')
    if not skills_used and domain:
        if domain == 'backend':
            skills_used = ['backend', 'api-design']
        elif domain == 'frontend':
            skills_used = ['frontend']
        elif domain == 'database':
            skills_used = ['database']
        elif domain == 'security':
            skills_used = ['security']

    features.extend([1.0 if s in skills_used else 0.0 for s in all_skills])

    # Agents used (binary)
    all_agents = [
        'feature-creator', 'bug-fixer', 'code-refactorer',
        'pr-reviewer', 'security-specialist'
    ]
    agents_used = exp.metadata.get('agents_used', [])
    features.extend([1.0 if a in agents_used else 0.0 for a in all_agents])

    # Strategy (one-hot)
    strategies = ['direct', 'sequential', 'parallel', 'coordinated']
    strategy = exp.metadata.get('strategy', 'direct')
    idx = strategies.index(strategy) if strategy in strategies else 0
    features.extend([1.0 if i == idx else 0.0 for i in range(4)])

    # Add padding to reach desired dimension
    while len(features) < 30:
        features.append(0.0)

    return np.array(features[:30], dtype=np.float32)


def prepare_batch(
    experiences: List[Experience],
    batch_size: int
) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
    """Prepare a batch for training"""
    # Sample batch
    batch = np.random.choice(experiences, min(batch_size, len(experiences)), replace=False)

    # Extract states, actions, rewards
    states = torch.stack([torch.from_numpy(extract_state_vector(exp)) for exp in batch])
    actions = torch.stack([torch.from_numpy(extract_action_vector(exp)) for exp in batch])
    rewards = torch.tensor([exp.reward for exp in batch], dtype=torch.float32)

    return states, actions, rewards


def train(
    experiences: List[Experience],
    state_dim: int,
    action_dim: int,
    epochs: int = 100,
    batch_size: int = 64,
    validation_split: float = 0.2,
    learning_rate: float = 1e-4,
    output_dir: Path = Path('data/models')
):
    """
    Train Actor-Critic model
    """
    print(f"\n{'='*60}")
    print(f"TRAINING ACTOR-CRITIC MODEL")
    print(f"{'='*60}")
    print(f"Experiences: {len(experiences)}")
    print(f"Epochs: {epochs}")
    print(f"Batch size: {batch_size}")
    print(f"Learning rate: {learning_rate}")
    print(f"State dim: {state_dim}")
    print(f"Action dim: {action_dim}")

    # Split train/val
    n_val = int(len(experiences) * validation_split)
    train_exps = experiences[:-n_val]
    val_exps = experiences[-n_val:]

    print(f"Train: {len(train_exps)}")
    print(f"Val: {len(val_exps)}")

    # Create agent
    agent = ActorCriticAgent(
        state_dim=state_dim,
        action_dim=action_dim,
        learning_rate=learning_rate
    )
    print(f"✅ Created Actor-Critic agent")

    # Create output directory
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Training loop
    training_history = []
    best_val_reward = float('-inf')

    print(f"\n{'='*60}")
    print(f"STARTING TRAINING")
    print(f"{'='*60}\n")

    for epoch in range(epochs):
        # Training
        epoch_metrics = []

        for _ in range(10):  # 10 batches per epoch
            states, actions, rewards = prepare_batch(train_exps, batch_size)
            metrics = train_a2c(agent, states, actions, rewards)
            epoch_metrics.append(metrics)

        # Aggregate epoch metrics
        epoch_summary = {'epoch': epoch}
        for k in epoch_metrics[0].keys():
            epoch_summary['train_' + k] = np.mean([m[k] for m in epoch_metrics])

        # Validation
        val_states, val_actions, val_rewards = prepare_batch(val_exps, batch_size)
        with torch.no_grad():
            _, val_values = agent(val_states)
        val_reward = val_rewards.mean().item()

        epoch_summary['val_mean_reward'] = val_reward

        training_history.append(epoch_summary)

        # Save best model
        if val_reward > best_val_reward:
            best_val_reward = val_reward
            checkpoint_path = output_dir / 'actor_checkpoint_best.pt'
            save_checkpoint(agent, epoch, epoch_summary, str(checkpoint_path))

        # Logging
        if epoch % 10 == 0 or epoch == epochs - 1:
            print(f"Epoch {epoch:3d}: "
                  f"Actor Loss={epoch_summary['train_actor_loss']:.4f}, "
                  f"Critic Loss={epoch_summary['train_critic_loss']:.4f}, "
                  f"Train Reward={epoch_summary['train_mean_reward']:.2f}, "
                  f"Val Reward={val_reward:.2f}, "
                  f"Entropy={epoch_summary['train_entropy']:.4f}")

    # Save final model
    final_checkpoint_path = output_dir / f'actor_checkpoint_v1.0.pt'
    save_checkpoint(agent, epochs, training_history[-1], str(final_checkpoint_path))

    # Save training history
    history_path = output_dir / 'training_history.json'
    with open(history_path, 'w') as f:
        json.dump(training_history, f, indent=2)

    print(f"\n{'='*60}")
    print(f"TRAINING COMPLETE")
    print(f"{'='*60}")
    print(f"✅ Final model saved to: {final_checkpoint_path}")
    print(f"✅ Training history saved to: {history_path}")
    print(f"✅ Best validation reward: {best_val_reward:.2f}")

    # Summary
    print(f"\nFINAL METRICS:")
    print(f"  Actor Loss: {training_history[-1]['train_actor_loss']:.4f}")
    print(f"  Critic Loss: {training_history[-1]['train_critic_loss']:.4f}")
    print(f"  Mean Reward: {training_history[-1]['train_mean_reward']:.2f}")
    print(f"  Entropy: {training_history[-1]['train_entropy']:.4f}")

    # Verdict
    final_reward = training_history[-1]['train_mean_reward']
    if final_reward > 0:
        print(f"\n✅ SUCCESS: Model learned positive reward policy")
    elif final_reward > -50:
        print(f"\n⚠️  PARTIAL: Model shows some learning but needs improvement")
    else:
        print(f"\n❌ FAILED: Model did not learn effectively")

    return agent, training_history


def main():
    parser = argparse.ArgumentParser(description='Train Actor-Critic model')
    parser.add_argument(
        '--data',
        type=str,
        default='data/experience_buffer/experiences.jsonl',
        help='Path to experiences file'
    )
    parser.add_argument(
        '--epochs',
        type=int,
        default=100,
        help='Number of training epochs'
    )
    parser.add_argument(
        '--batch-size',
        type=int,
        default=64,
        help='Batch size for training'
    )
    parser.add_argument(
        '--learning-rate',
        type=float,
        default=1e-4,
        help='Learning rate'
    )
    parser.add_argument(
        '--state-dim',
        type=int,
        default=50,
        help='State vector dimension'
    )
    parser.add_argument(
        '--action-dim',
        type=int,
        default=30,
        help='Action vector dimension'
    )
    parser.add_argument(
        '--output-dir',
        type=str,
        default='data/models',
        help='Output directory for models'
    )
    parser.add_argument(
        '--val-split',
        type=float,
        default=0.2,
        help='Validation split ratio'
    )

    args = parser.parse_args()

    # Load experiences
    experiences = load_experiences(Path(args.data))

    if len(experiences) < 100:
        print(f"\n⚠️  WARNING: Only {len(experiences)} experiences")
        print(f"   Minimum recommended: 100")
        print(f"   Will train anyway, but results may be poor")

    # Train
    train(
        experiences=experiences,
        state_dim=args.state_dim,
        action_dim=args.action_dim,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate,
        output_dir=Path(args.output_dir),
        validation_split=args.val_split
    )


if __name__ == '__main__':
    main()
