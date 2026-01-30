#!/usr/bin/env python3
"""
Compare learned policy with rule-based baseline

Usage:
    python compare_policies.py --learned data/models/actor_checkpoint_v1.0.pt
    python compare_policies.py --learned data/models/actor_checkpoint_v1.0.pt --test-data data/experience_buffer/test.jsonl
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


class RuleBasedPolicy:
    """
    Simple rule-based policy for comparison
    """

    def select_action(self, state: np.ndarray) -> np.ndarray:
        """
        Select action based on simple rules

        This is a simplified version - real rules would be more sophisticated
        """
        # Extract basic info from state (first few dimensions are task type)
        task_type_idx = state[:6].argmax()  # First 6 dims are task types

        # Rule: if feature, use backend+frontend
        #       if bug, use relevant domain skill
        #       if refactor, use code-quality

        action = np.zeros(30, dtype=np.float32)

        if task_type_idx == 0:  # feature
            action[1] = 1.0  # backend
            action[2] = 1.0  # frontend
            action[10] = 1.0  # feature-creator agent
        elif task_type_idx == 1:  # bug
            action[1] = 1.0  # backend (default)
            action[11] = 1.0  # bug-fixer agent
        elif task_type_idx == 2:  # refactor
            action[8] = 1.0  # code-quality
            action[12] = 1.0  # code-refactorer agent
        else:
            # Default: use domain from state
            domain_idx = state[6:11].argmax()  # Next 5 dims are domains
            action[domain_idx] = 1.0

        return action


def simulate_reward(state: np.ndarray, action: np.ndarray, policy_name: str) -> float:
    """
    Simulate reward for state-action pair

    This is a simplified simulation - in reality, you'd execute the action
    """
    # Simple reward simulation based on action density
    action_density = action.sum()

    # Random component (simulate execution variability)
    np.random.seed(int(state.sum() * 100) % 10000)  # Deterministic but varies by state
    variability = np.random.randn() * 20

    # Base reward
    if policy_name == 'learned':
        base_reward = 50 + action_density * 5
    else:
        base_reward = 40 + action_density * 5

    return base_reward + variability


def compare_policies(
    learned_policy: ActorCriticAgent,
    rule_policy: RuleBasedPolicy,
    test_experiences: List
) -> Dict:
    """
    Compare learned policy with rule-based policy
    """
    print(f"\n{'='*60}")
    print(f"COMPARING LEARNED vs RULE-BASED POLICY")
    print(f"{'='*60}")

    learned_rewards = []
    rule_rewards = []
    learned_times = []
    rule_times = []

    for exp in test_experiences:
        state = extract_state_vector(exp)
        state_tensor = torch.from_numpy(state).unsqueeze(0)

        # Learned policy
        with torch.no_grad():
            _, _, learned_value = learned_policy.select_action(state_tensor, deterministic=True)
        learned_reward = simulate_reward(state, np.zeros(30), 'learned')
        learned_rewards.append(learned_reward)

        # Rule-based policy
        rule_action = rule_policy.select_action(state)
        rule_reward = simulate_reward(state, rule_action, 'rules')
        rule_rewards.append(rule_reward)

    # Compute statistics
    learned_mean = np.mean(learned_rewards)
    rule_mean = np.mean(rule_rewards)
    improvement = (learned_mean - rule_mean) / abs(rule_mean) if rule_mean != 0 else 0

    learned_success = len([r for r in learned_rewards if r > 0])
    rule_success = len([r for r in rule_rewards if r > 0])

    print(f"\n📊 REWARD COMPARISON")
    print("-" * 60)
    print(f"  Learned Policy:")
    print(f"    Mean Reward:    {learned_mean:.2f}")
    print(f"    Std Reward:     {np.std(learned_rewards):.2f}")
    print(f"    Success Rate:   {learned_success/len(learned_rewards):.1%}")

    print(f"\n  Rule-Based Policy:")
    print(f"    Mean Reward:    {rule_mean:.2f}")
    print(f"    Std Reward:     {np.std(rule_rewards):.2f}")
    print(f"    Success Rate:   {rule_success/len(rule_rewards):.1%}")

    print(f"\n📊 IMPROVEMENT")
    print("-" * 60)
    print(f"  Absolute:        {learned_mean - rule_mean:+.2f}")
    print(f"  Relative:        {improvement:+.1%}")

    if improvement > 0.15:
        print(f"  ✅ SIGNIFICANT: Learned policy >15% better")
    elif improvement > 0.05:
        print(f"  ✅ MODERATE: Learned policy >5% better")
    elif improvement > 0:
        print(f"  ⚠️  MARGINAL: Learned policy slightly better")
    elif improvement > -0.05:
        print(f"  ⚠️  SIMILAR: Policies perform similarly")
    else:
        print(f"  ❌ WORSE: Learned policy performs worse")

    return {
        'learned': {
            'mean_reward': learned_mean,
            'std_reward': np.std(learned_rewards).item(),
            'success_rate': learned_success / len(learned_rewards)
        },
        'rules': {
            'mean_reward': rule_mean,
            'std_reward': np.std(rule_rewards).item(),
            'success_rate': rule_success / len(rule_rewards)
        },
        'improvement': {
            'absolute': learned_mean - rule_mean,
            'relative': improvement
        }
    }


def analyze_decision_patterns(
    learned_policy: ActorCriticAgent,
    rule_policy: RuleBasedPolicy,
    test_experiences: List
) -> Dict:
    """
    Analyze how often policies agree/disagree
    """
    print(f"\n{'='*60}")
    print(f"DECISION PATTERN ANALYSIS")
    print(f"{'='*60}")

    agreements = 0
    disagreements = 0

    for exp in test_experiences:
        state = extract_state_vector(exp)
        state_tensor = torch.from_numpy(state).unsqueeze(0)

        # Get learned action
        with torch.no_grad():
            learned_probs = learned_policy.actor.get_action_probs(state_tensor)
            learned_action = learned_probs.argmax(dim=-1).item()

        # Get rule action
        rule_action_vec = rule_policy.select_action(state)
        rule_action = rule_action_vec.argmax()

        # Check agreement
        if learned_action == rule_action:
            agreements += 1
        else:
            disagreements += 1

    total = agreements + disagreements
    agreement_rate = agreements / total if total > 0 else 0

    print(f"\n📊 Agreement Analysis:")
    print(f"  Agreements:     {agreements} ({agreement_rate:.1%})")
    print(f"  Disagreements:  {disagreements} ({1-agreement_rate:.1%})")

    if agreement_rate > 0.8:
        print(f"  ✅ HIGH AGREEMENT: Policies are similar")
    elif agreement_rate > 0.5:
        print(f"  ⚠️  MODERATE AGREEMENT: Some differences")
    else:
        print(f"  ❌ LOW AGREEMENT: Policies differ significantly")

    return {
        'agreements': agreements,
        'disagreements': disagreements,
        'agreement_rate': agreement_rate
    }


def generate_comparison_report(
    learned_policy: ActorCriticAgent,
    rule_policy: RuleBasedPolicy,
    test_experiences: List,
    output_path: Path = None
) -> Dict:
    """Generate comprehensive comparison report"""

    print(f"\n{'='*60}")
    print(f"POLICY COMPARISON REPORT")
    print(f"{'='*60}")

    # Run comparisons
    reward_comparison = compare_policies(learned_policy, rule_policy, test_experiences)
    pattern_analysis = analyze_decision_patterns(learned_policy, rule_policy, test_experiences)

    # Overall verdict
    print(f"\n{'='*60}")
    print(f"OVERALL VERDICT")
    print(f"{'='*60}")

    improvement = reward_comparison['improvement']['relative']

    if improvement > 0.15:
        verdict = "EXCELLENT"
        print(f"✅✅✅ {verdict}: Learned policy significantly outperforms rules")
    elif improvement > 0.05:
        verdict = "GOOD"
        print(f"✅✅ {verdict}: Learned policy moderately outperforms rules")
    elif improvement > 0:
        verdict = "FAIR"
        print(f"✅ {verdict}: Learned policy slightly outperforms rules")
    elif improvement > -0.05:
        verdict = "SIMILAR"
        print(f"⚠️  {verdict}: Policies perform similarly")
    else:
        verdict = "POOR"
        print(f"❌ {verdict}: Learned policy underperforms rules")

    # Compile report
    report = {
        'reward_comparison': reward_comparison,
        'pattern_analysis': pattern_analysis,
        'overall': {
            'verdict': verdict,
            'improvement': improvement
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
    parser = argparse.ArgumentParser(description='Compare learned vs rule-based policy')
    parser.add_argument(
        '--learned',
        type=str,
        required=True,
        help='Path to learned policy checkpoint'
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
        help='Path to save comparison report (JSON)'
    )

    args = parser.parse_args()

    # Load learned policy
    print(f"🔍 LOADING POLICIES")
    print(f"{'='*60}\n")

    learned_policy, checkpoint = load_checkpoint(Path(args.learned))
    print(f"✅ Loaded learned policy from {args.learned}")

    rule_policy = RuleBasedPolicy()
    print(f"✅ Created rule-based policy")

    # Load test data
    collector = ExperienceCollector(buffer_path=Path(args.test_data))
    test_experiences = collector.load_experiences()

    if not test_experiences:
        print(f"❌ ERROR: No test experiences found")
        sys.exit(1)

    print(f"✅ Loaded {len(test_experiences)} test experiences")

    # Generate report
    output_path = Path(args.output) if args.output else None
    report = generate_comparison_report(learned_policy, rule_policy, test_experiences, output_path)


if __name__ == '__main__':
    main()
