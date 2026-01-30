#!/usr/bin/env python3
"""
Monitor Actor-Critic learning system

Usage:
    python monitor.py --data data/experience_buffer/experiences.jsonl
    python monitor.py --data data/experience_buffer/experiences.jsonl --watch
"""

import argparse
import json
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List

import numpy as np

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from experience_collector import ExperienceCollector


def load_experiences(filepath: Path) -> List:
    """Load experiences from buffer"""
    collector = ExperienceCollector(buffer_path=filepath)
    return collector.load_experiences()


def compute_basic_stats(experiences: List) -> Dict:
    """Compute basic statistics"""
    if not experiences:
        return {}

    rewards = [e.reward for e in experiences]
    successful = [e for e in experiences if e.reward > 0]

    return {
        'total': len(experiences),
        'mean_reward': np.mean(rewards),
        'std_reward': np.std(rewards),
        'min_reward': np.min(rewards),
        'max_reward': np.max(rewards),
        'success_rate': len(successful) / len(experiences),
        'positive': len(successful),
        'negative': len(experiences) - len(successful)
    }


def analyze_by_task_type(experiences: List) -> Dict:
    """Analyze experiences by task type"""
    by_task = {}

    for exp in experiences:
        task_type = exp.metadata.get('task_type', 'unknown')
        if task_type not in by_task:
            by_task[task_type] = []
        by_task[task_type].append(exp)

    results = {}
    for task_type, exps in by_task.items():
        rewards = [e.reward for e in exps]
        successful = len([r for r in rewards if r > 0])

        results[task_type] = {
            'count': len(exps),
            'mean_reward': np.mean(rewards),
            'success_rate': successful / len(exps)
        }

    return results


def analyze_by_domain(experiences: List) -> Dict:
    """Analyze experiences by domain"""
    by_domain = {}

    for exp in experiences:
        domain = exp.metadata.get('domain', 'unknown')
        if domain not in by_domain:
            by_domain[domain] = []
        by_domain[domain].append(exp)

    results = {}
    for domain, exps in by_domain.items():
        rewards = [e.reward for e in exps]
        successful = len([r for r in rewards if r > 0])

        results[domain] = {
            'count': len(exps),
            'mean_reward': np.mean(rewards),
            'success_rate': successful / len(exps)
        }

    return results


def analyze_by_complexity(experiences: List) -> Dict:
    """Analyze experiences by complexity"""
    by_complexity = {}

    for exp in experiences:
        complexity = exp.metadata.get('complexity', 'unknown')
        if complexity not in by_complexity:
            by_complexity[complexity] = []
        by_complexity[complexity].append(exp)

    results = {}
    for complexity, exps in by_complexity.items():
        rewards = [e.reward for e in exps]
        successful = len([r for r in rewards if r > 0])

        results[complexity] = {
            'count': len(exps),
            'mean_reward': np.mean(rewards),
            'success_rate': successful / len(exps)
        }

    return results


def temporal_analysis(experiences: List) -> Dict:
    """Analyze experiences over time"""
    # Sort by timestamp
    sorted_exps = sorted(experiences, key=lambda e: e.timestamp)

    # Split into quarters
    n = len(sorted_exps)
    quarters = [
        sorted_exps[:n//4],
        sorted_exps[n//4:n//2],
        sorted_exps[n//2:3*n//4],
        sorted_exps[3*n//4:]
    ]

    results = {
        'first_quarter': {'mean_reward': np.mean([e.reward for e in quarters[0]])},
        'second_quarter': {'mean_reward': np.mean([e.reward for e in quarters[1]])},
        'third_quarter': {'mean_reward': np.mean([e.reward for e in quarters[2]])},
        'fourth_quarter': {'mean_reward': np.mean([e.reward for e in quarters[3]])},
    }

    # Trend
    rewards_by_quarter = [
        results['first_quarter']['mean_reward'],
        results['second_quarter']['mean_reward'],
        results['third_quarter']['mean_reward'],
        results['fourth_quarter']['mean_reward']
    ]

    # Simple trend detection
    if rewards_by_quarter[-1] > rewards_by_quarter[0]:
        trend = 'improving'
    elif rewards_by_quarter[-1] < rewards_by_quarter[0]:
        trend = 'declining'
    else:
        trend = 'stable'

    results['trend'] = trend

    return results


def print_dashboard(stats: Dict, by_task: Dict, by_domain: Dict, by_complexity: Dict):
    """Print monitoring dashboard"""
    print("\n" + "=" * 80)
    print(f"🔍 AI-CORE LEARNING MONITORING DASHBOARD")
    print(f"   {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

    # Basic Stats
    print("\n📊 OVERALL STATISTICS")
    print("-" * 80)
    print(f"  Total Experiences:    {stats['total']:>10,}")
    print(f"  Mean Reward:          {stats['mean_reward']:>10.2f}")
    print(f"  Std Reward:           {stats['std_reward']:>10.2f}")
    print(f"  Min Reward:           {stats['min_reward']:>10.2f}")
    print(f"  Max Reward:           {stats['max_reward']:>10.2f}")
    print(f"  Success Rate:         {stats['success_rate']:>10.1%}")
    print(f"  Positive:             {stats['positive']:>10,}")
    print(f"  Negative:             {stats['negative']:>10,}")

    # Task Type
    print("\n📊 BY TASK TYPE")
    print("-" * 80)
    print(f"  {'Task Type':<20} {'Count':>8} {'Mean Reward':>12} {'Success Rate':>12}")
    print("-" * 80)

    for task_type, metrics in sorted(by_task.items(), key=lambda x: x[1]['count'], reverse=True)[:10]:
        print(f"  {task_type:<20} {metrics['count']:>8} {metrics['mean_reward']:>12.2f} {metrics['success_rate']:>11.1%}")

    # Domain
    print("\n📊 BY DOMAIN")
    print("-" * 80)
    print(f"  {'Domain':<20} {'Count':>8} {'Mean Reward':>12} {'Success Rate':>12}")
    print("-" * 80)

    for domain, metrics in sorted(by_domain.items(), key=lambda x: x[1]['count'], reverse=True):
        print(f"  {domain:<20} {metrics['count']:>8} {metrics['mean_reward']:>12.2f} {metrics['success_rate']:>11.1%}")

    # Complexity
    print("\n📊 BY COMPLEXITY")
    print("-" * 80)
    print(f"  {'Complexity':<20} {'Count':>8} {'Mean Reward':>12} {'Success Rate':>12}")
    print("-" * 80)

    for complexity, metrics in sorted(by_complexity.items()):
        print(f"  {complexity:<20} {metrics['count']:>8} {metrics['mean_reward']:>12.2f} {metrics['success_rate']:>11.1%}")

    # Health Check
    print("\n🏥 SYSTEM HEALTH")
    print("-" * 80)

    issues = []

    if stats['total'] < 100:
        issues.append(f"⚠️  Low experience count ({stats['total']} < 100)")

    if stats['mean_reward'] < 0:
        issues.append(f"⚠️  Negative mean reward ({stats['mean_reward']:.2f})")

    if stats['success_rate'] < 0.7:
        issues.append(f"⚠️  Low success rate ({stats['success_rate']:.1%} < 70%)")

    if issues:
        for issue in issues:
            print(f"  {issue}")
    else:
        print(f"  ✅ All systems healthy")

    # Recommendations
    print("\n💡 RECOMMENDATIONS")
    print("-" * 80)

    if stats['total'] < 100:
        print(f"  • Collect more experiences (need at least 100)")
    elif stats['total'] < 1000:
        print(f"  • Consider collecting more data for better training")
    else:
        print(f"  • Sufficient data for training")

    if stats['mean_reward'] < 0:
        print(f"  • Review reward function - negative mean reward")
    elif stats['mean_reward'] < 50:
        print(f"  • Reward function looks OK but could be improved")

    if stats['success_rate'] < 0.7:
        print(f"  • Investigate low success rate tasks")
    else:
        print(f"  • Success rate is healthy")

    print("\n" + "=" * 80)


def save_report(
    stats: Dict,
    by_task: Dict,
    by_domain: Dict,
    by_complexity: Dict,
    output_path: Path
):
    """Save monitoring report to file"""
    report = {
        'timestamp': datetime.now().isoformat(),
        'stats': stats,
        'by_task': by_task,
        'by_domain': by_domain,
        'by_complexity': by_complexity
    }

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w') as f:
        json.dump(report, f, indent=2)

    print(f"\n✅ Report saved to: {output_path}")


def main():
    parser = argparse.ArgumentParser(description='Monitor Actor-Critic learning system')
    parser.add_argument(
        '--data',
        type=str,
        default='data/experience_buffer/experiences.jsonl',
        help='Path to experiences file'
    )
    parser.add_argument(
        '--output',
        type=str,
        default=None,
        help='Path to save monitoring report (JSON)'
    )
    parser.add_argument(
        '--watch',
        action='store_true',
        help='Watch mode: refresh every 30 seconds'
    )
    parser.add_argument(
        '--interval',
        type=int,
        default=30,
        help='Refresh interval for watch mode (seconds)'
    )

    args = parser.parse_args()

    if args.watch:
        print("🔄 WATCH MODE: Press Ctrl+C to stop\n")

        try:
            while True:
                # Clear screen (simple version)
                print("\n" * 100)

                # Load and analyze
                experiences = load_experiences(Path(args.data))

                if not experiences:
                    print("⚠️  No experiences found yet")
                    print(f"   Run in shadow mode to collect data")
                else:
                    stats = compute_basic_stats(experiences)
                    by_task = analyze_by_task_type(experiences)
                    by_domain = analyze_by_domain(experiences)
                    by_complexity = analyze_by_complexity(experiences)

                    print_dashboard(stats, by_task, by_domain, by_complexity)

                    # Save report if requested
                    if args.output:
                        save_report(
                            stats,
                            by_task,
                            by_domain,
                            by_complexity,
                            Path(args.output)
                        )

                print(f"\n⏱️  Refreshing in {args.interval} seconds...")
                time.sleep(args.interval)

        except KeyboardInterrupt:
            print("\n\n👋 Watch mode stopped")
    else:
        # Single run
        experiences = load_experiences(Path(args.data))

        if not experiences:
            print("❌ No experiences found")
            print(f"   Path: {args.data}")
            print(f"   Run in shadow mode to collect data first")
            sys.exit(1)

        # Compute all analyses
        stats = compute_basic_stats(experiences)
        by_task = analyze_by_task_type(experiences)
        by_domain = analyze_by_domain(experiences)
        by_complexity = analyze_by_complexity(experiences)

        # Print dashboard
        print_dashboard(stats, by_task, by_domain, by_complexity)

        # Save report if requested
        if args.output:
            save_report(
                stats,
                by_task,
                by_domain,
                by_complexity,
                Path(args.output)
            )


if __name__ == '__main__':
    main()
