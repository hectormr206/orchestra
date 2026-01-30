#!/usr/bin/env python3
"""
Evaluate trained Actor-Critic model on test set

Usage:
    python evaluate.py --model data/models/actor_checkpoint_v1.0.pt
    python evaluate.py --model data/models/actor_checkpoint_v1.0.pt --test-data data/experience_buffer/test.jsonl
"""

import argparse
import json
import sys
from pathlib import Path
from typing import List, Dict

import numpy as np
import torch

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from experience_collector import ExperienceCollector
from models import load_checkpoint, ActorCriticAgent

# Import from train.py
from train import extract_state_vector, extract_action_vector


def load_model(filepath: Path) -> ActorCriticAgent:
    """Load trained model"""
    if not filepath.exists():
        print(f"❌ ERROR: Model file not found: {filepath}")
        sys.exit(1)

    agent, checkpoint = load_checkpoint(str(filepath))
    print(f"✅ Loaded model from {filepath}")
    print(f"   Epoch: {checkpoint['epoch']}")
    print(f"   Metrics: {checkpoint['metrics']}")

    return agent


def load_test_experiences(filepath: Path) -> List:
    """Load test experiences"""
    collector = ExperienceCollector(buffer_path=filepath)
    experiences = collector.load_experiences()

    if not experiences:
        print(f"❌ ERROR: No experiences found in {filepath}")
        sys.exit(1)

    print(f"✅ Loaded {len(experiences)} test experiences")
    return experiences


def evaluate_accuracy(agent: ActorCriticAgent, test_experiences: List) -> Dict:
    """
    Evaluate prediction accuracy

    Checks if predicted actions match actual actions
    """
    print(f"\n{'='*60}")
    print(f"EVALUATING PREDICTION ACCURACY")
    print(f"{'='*60}")

    correct = 0
    total = len(test_experiences)
    confidences = []

    for exp in test_experiences:
        # Extract state
        state = extract_state_vector(exp)
        state_tensor = torch.from_numpy(state).unsqueeze(0)

        # Get predicted action probabilities
        with torch.no_grad():
            probs = agent.actor.get_action_probs(state_tensor)

        # Get actual action
        actual_action = extract_action_vector(exp)
        actual_idx = actual_action.argmax()

        # Predicted action (argmax)
        predicted_idx = probs.argmax(dim=-1).item()

        # Check if correct
        if predicted_idx == actual_idx:
            correct += 1

        # Confidence (probability of predicted action)
        confidence = probs[0, predicted_idx].item()
        confidences.append(confidence)

    accuracy = correct / total

    print(f"\n📊 Results:")
    print(f"   Accuracy: {accuracy:.1%}")
    print(f"   Correct: {correct}/{total}")
    print(f"   Mean Confidence: {np.mean(confidences):.2f}")
    print(f"   Low Confidence Ratio (<0.8): {np.mean([c < 0.8 for c in confidences]):.1%}")

    # Verdict
    if accuracy > 0.7:
        print(f"   ✅ GOOD: Accuracy > 70%")
    elif accuracy > 0.5:
        print(f"   ⚠️  FAIR: Accuracy between 50-70%")
    else:
        print(f"   ❌ POOR: Accuracy < 50% (similar to random)")

    return {
        'accuracy': accuracy,
        'correct': correct,
        'total': total,
        'mean_confidence': np.mean(confidences),
        'low_confidence_ratio': np.mean([c < 0.8 for c in confidences])
    }


def evaluate_rewards(agent: ActorCriticAgent, test_experiences: List) -> Dict:
    """
    Evaluate reward statistics

    Analyzes the rewards of experiences in test set
    """
    print(f"\n{'='*60}")
    print(f"EVALUATING REWARDS")
    print(f"{'='*60}")

    rewards = [exp.reward for exp in test_experiences]

    # Predict values for states
    predicted_values = []
    for exp in test_experiences:
        state = extract_state_vector(exp)
        state_tensor = torch.from_numpy(state).unsqueeze(0)

        with torch.no_grad():
            value = agent.critic(state_tensor)
        predicted_values.append(value.item())

    print(f"\n📊 Actual Rewards:")
    print(f"   Mean: {np.mean(rewards):.2f}")
    print(f"   Std: {np.std(rewards):.2f}")
    print(f"   Min: {np.min(rewards):.2f}")
    print(f"   Max: {np.max(rewards):.2f}")
    print(f"   Median: {np.median(rewards):.2f}")

    print(f"\n📊 Predicted Values:")
    print(f"   Mean: {np.mean(predicted_values):.2f}")
    print(f"   Std: {np.std(predicted_values):.2f}")

    # Success rate
    successful = [r for r in rewards if r > 0]
    success_rate = len(successful) / len(rewards)

    print(f"\n📊 Success Rate:")
    print(f"   Positive Rewards: {len(successful)}/{len(rewards)}")
    print(f"   Success Rate: {success_rate:.1%}")

    if success_rate > 0.85:
        print(f"   ✅ EXCELLENT: Success rate > 85%")
    elif success_rate > 0.7:
        print(f"   ✅ GOOD: Success rate > 70%")
    elif success_rate > 0.5:
        print(f"   ⚠️  FAIR: Success rate > 50%")
    else:
        print(f"   ❌ POOR: Success rate < 50%")

    # Value prediction error
    value_errors = [abs(r - v) for r, v in zip(rewards, predicted_values)]
    print(f"\n📊 Value Prediction Error:")
    print(f"   Mean Error: {np.mean(value_errors):.2f}")
    print(f"   MAE: {np.mean(value_errors):.2f}")

    return {
        'mean_reward': np.mean(rewards),
        'std_reward': np.std(rewards),
        'min_reward': np.min(rewards),
        'max_reward': np.max(rewards),
        'success_rate': success_rate,
        'mean_value': np.mean(predicted_values),
        'mae': np.mean(value_errors)
    }


def analyze_by_task_type(test_experiences: List) -> Dict:
    """
    Analyze performance by task type
    """
    print(f"\n{'='*60}")
    print(f"ANALYSIS BY TASK TYPE")
    print(f"{'='*60}")

    # Group by task type
    by_task = {}
    for exp in test_experiences:
        task_type = exp.metadata.get('task_type', 'unknown')
        if task_type not in by_task:
            by_task[task_type] = []
        by_task[task_type].append(exp)

    # Analyze each
    results = {}
    for task_type, exps in by_task.items():
        rewards = [e.reward for e in exps]
        success_rate = len([r for r in rewards if r > 0]) / len(rewards)

        results[task_type] = {
            'count': len(exps),
            'mean_reward': np.mean(rewards),
            'success_rate': success_rate
        }

    # Print table
    print(f"\n{'Task Type':<15} {'Count':>6} {'Mean Reward':>12} {'Success Rate':>12}")
    print(f"{'-'*60}")

    for task_type, metrics in sorted(results.items(), key=lambda x: x[1]['count'], reverse=True):
        print(f"{task_type:<15} {metrics['count']:>6} {metrics['mean_reward']:>12.2f} {metrics['success_rate']:>11.1%}")

    return results


def compare_with_baseline(agent: ActorCriticAgent, test_experiences: List) -> Dict:
    """
    Compare learned policy with simple baseline

    Baseline: Predict most common action for each task type
    """
    print(f"\n{'='*60}")
    print(f"COMPARISON WITH BASELINE")
    print(f"{'='*60}")

    # Simple baseline: predict mean reward
    mean_reward = np.mean([e.reward for e in test_experiences])

    # Learned policy: predict value
    predicted_values = []
    for exp in test_experiences:
        state = extract_state_vector(exp)
        state_tensor = torch.from_numpy(state).unsqueeze(0)

        with torch.no_grad():
            value = agent.critic(state_tensor)
        predicted_values.append(value.item())

    # Calculate correlation
    actual_rewards = [e.reward for e in test_experiences]
    correlation = np.corrcoef(actual_rewards, predicted_values)[0, 1]

    print(f"\n📊 Baseline (Mean Reward):")
    print(f"   Value: {mean_reward:.2f}")

    print(f"\n📊 Learned Policy:")
    print(f"   Mean Predicted Value: {np.mean(predicted_values):.2f}")
    print(f"   Correlation with actual: {correlation:.3f}")

    if correlation > 0.5:
        print(f"   ✅ GOOD: Strong positive correlation (>0.5)")
    elif correlation > 0.3:
        print(f"   ⚠️  FAIR: Moderate correlation (>0.3)")
    elif correlation > 0:
        print(f"   ⚠️  WEAK: Weak correlation")
    else:
        print(f"   ❌ POOR: No or negative correlation")

    return {
        'baseline_reward': mean_reward,
        'mean_predicted_value': np.mean(predicted_values),
        'correlation': correlation
    }


def generate_report(agent: ActorCriticAgent, test_experiences: List, output_path: Path = None):
    """Generate comprehensive evaluation report"""
    print(f"\n{'='*60}")
    print(f"GENERATING EVALUATION REPORT")
    print(f"{'='*60}")

    # Run all evaluations
    accuracy_metrics = evaluate_accuracy(agent, test_experiences)
    reward_metrics = evaluate_rewards(agent, test_experiences)
    task_analysis = analyze_by_task_type(test_experiences)
    baseline_comparison = compare_with_baseline(agent, test_experiences)

    # Overall verdict
    print(f"\n{'='*60}")
    print(f"OVERALL VERDICT")
    print(f"{'='*60}")

    passed = 0
    total = 4

    if accuracy_metrics['accuracy'] > 0.7:
        print(f"✅ Accuracy > 70%")
        passed += 1
    else:
        print(f"❌ Accuracy < 70%")

    if reward_metrics['success_rate'] > 0.85:
        print(f"✅ Success rate > 85%")
        passed += 1
    else:
        print(f"❌ Success rate < 85%")

    if reward_metrics['mean_reward'] > 0:
        print(f"✅ Mean reward positive")
        passed += 1
    else:
        print(f"❌ Mean reward negative")

    if baseline_comparison['correlation'] > 0.3:
        print(f"✅ Correlation with actual > 0.3")
        passed += 1
    else:
        print(f"❌ Correlation with actual < 0.3")

    print(f"\n{passed}/{total} criteria passed")

    if passed == 4:
        print(f"\n✅✅✅ EXCELLENT: Model is working very well!")
    elif passed >= 3:
        print(f"\n✅✅ GOOD: Model is working well with minor issues")
    elif passed >= 2:
        print(f"\n⚠️  FAIR: Model shows some learning but needs improvement")
    else:
        print(f"\n❌ POOR: Model is not learning effectively")

    # Compile report
    report = {
        'accuracy_metrics': accuracy_metrics,
        'reward_metrics': reward_metrics,
        'task_analysis': task_analysis,
        'baseline_comparison': baseline_comparison,
        'overall': {
            'passed': passed,
            'total': total,
            'verdict': 'excellent' if passed == 4 else 'good' if passed >= 3 else 'fair' if passed >= 2 else 'poor'
        }
    }

    # Save report
    if output_path:
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2)

        print(f"\n✅ Report saved to: {output_path}")

    return report


def main():
    parser = argparse.ArgumentParser(description='Evaluate Actor-Critic model')
    parser.add_argument(
        '--model',
        type=str,
        required=True,
        help='Path to trained model checkpoint'
    )
    parser.add_argument(
        '--test-data',
        type=str,
        default='data/experience_buffer/experiences.jsonl',
        help='Path to test experiences'
    )
    parser.add_argument(
        '--output',
        type=str,
        default=None,
        help='Path to save evaluation report (JSON)'
    )

    args = parser.parse_args()

    # Load model
    print(f"🔍 EVALUATING ACTOR-CRITIC MODEL")
    print(f"{'='*60}\n")

    agent = load_model(Path(args.model))

    # Load test data
    test_experiences = load_test_experiences(Path(args.test_data))

    # Generate report
    output_path = Path(args.output) if args.output else None
    report = generate_report(agent, test_experiences, output_path)


if __name__ == '__main__':
    main()
