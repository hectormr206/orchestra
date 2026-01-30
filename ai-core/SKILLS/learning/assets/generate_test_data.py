#!/usr/bin/env python3
"""
Generate synthetic test experiences for Actor-Critic training

Creates realistic fake experiences to validate the training pipeline.

Usage:
    python generate_test_data.py --count 1000 --output data/experience_buffer/experiences.jsonl
    python generate_test_data.py --count 5000 --output data/experience_buffer/test_experiences.jsonl --seed 42
"""

import argparse
import json
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict
import numpy as np


# Task types and their characteristics
TASK_TYPES = [
    'feature', 'bug', 'refactor', 'test', 'docs', 'review',
    'deploy', 'security', 'performance', 'architecture',
    'database', 'maintenance', 'optimization'
]

DOMAINS = [
    'frontend', 'backend', 'database', 'devops',
    'mobile', 'ai/ml', 'security', 'testing', 'architecture'
]

COMPLEXITIES = ['simple', 'medium', 'complex']

RISK_LEVELS = ['low', 'medium', 'high']

STRATEGIES = ['direct', 'sequential', 'parallel', 'coordinated']


def generate_experience(exp_id: int, seed: int = None) -> Dict:
    """
    Generate a single realistic experience

    Args:
        exp_id: Experience ID
        seed: Random seed for reproducibility

    Returns:
        Dictionary representing an experience
    """
    if seed is not None:
        random.seed(seed + exp_id)
        np.random.seed(seed + exp_id)

    # Select task characteristics
    task_type = random.choice(TASK_TYPES)
    domain = random.choice(DOMAINS)
    complexity = random.choice(COMPLEXITIES)
    risk_level = random.choice(RISK_LEVELS)

    # Determine secondary domains (0-2 additional)
    n_secondary = random.choices([0, 1, 2], weights=[0.5, 0.3, 0.2])[0]
    secondary_domains = random.sample([d for d in DOMAINS if d != domain], n_secondary)

    # Determine skills needed based on task and domain
    skills_map = {
        'frontend': ['frontend', 'accessibility'],
        'backend': ['backend', 'api-design'],
        'database': ['database'],
        'security': ['security', 'compliance'],
        'testing': ['testing', 'backend'],
        'ai/ml': ['ai-ml', 'data-analytics'],
        'devops': ['devops', 'infrastructure', 'ci-cd'],
        'performance': ['performance', 'observability'],
        'architecture': ['architecture', 'documentation'],
        'mobile': ['mobile', 'frontend'],
    }

    skills_needed = skills_map.get(domain, ['backend'])
    if task_type == 'security':
        skills_needed = ['security', 'backend', 'compliance']
    elif task_type == 'performance':
        skills_needed = ['performance', 'backend', 'database', 'observability']
    elif task_type == 'test':
        skills_needed = ['testing', 'backend']
    elif task_type == 'refactor':
        skills_needed = ['code-quality', 'backend']
    elif task_type == 'review':
        skills_needed = ['code-quality', 'testing']

    # Add secondary domain skills
    for sec_domain in secondary_domains:
        sec_skills = skills_map.get(sec_domain, [])
        skills_needed.extend(sec_skills)

    # Remove duplicates
    skills_needed = list(set(skills_needed))

    # Determine agents needed
    agents_map = {
        'feature': ['feature-creator'],
        'bug': ['bug-fixer'],
        'refactor': ['code-refactorer'],
        'test': ['testing-specialist'],
        'review': ['pr-reviewer'],
        'deploy': ['devops-specialist'],
        'security': ['security-specialist'],
        'performance': ['performance-optimizer'],
        'architecture': ['architecture-advisor'],
        'database': ['database-specialist'],
        'maintenance': ['maintenance-coordinator'],
    }

    agents_needed = agents_map.get(task_type, [])

    # Add security-specialist for high risk
    if risk_level == 'high' and 'security-specialist' not in agents_needed:
        agents_needed.append('security-specialist')

    # Determine complexity-based success probability
    success_prob = {
        'simple': 0.90,
        'medium': 0.75,
        'complex': 0.60
    }[complexity]

    # Adjust based on domain and task
    if task_type == 'feature':
        success_prob -= 0.05
    elif task_type == 'bug':
        success_prob -= 0.10
    elif task_type == 'security':
        success_prob -= 0.15
    elif task_type == 'performance':
        success_prob -= 0.10

    # Determine success
    success = random.random() < success_prob

    # Estimate time based on complexity
    base_times = {
        'simple': (15, 45),      # 15-45 minutes
        'medium': (60, 180),     # 1-3 hours
        'complex': (240, 480)    # 4-8 hours
    }[complexity]

    estimated_time = random.randint(*base_times)

    # Actual time (with variability)
    time_variance = random.uniform(0.7, 1.5)  # +/- 50%
    actual_time = int(estimated_time * time_variance)

    # Count errors
    if success:
        error_count = random.choices([0, 1, 2], weights=[0.7, 0.25, 0.05])[0]
    else:
        error_count = random.choices([1, 2, 3, 4], weights=[0.3, 0.4, 0.2, 0.1])[0]

    # User modifications (0-3)
    user_modifications = random.choices([0, 1, 2, 3], weights=[0.6, 0.25, 0.12, 0.03])[0]

    # Safety violations (rare but serious)
    safety_violations = False
    if risk_level == 'high' and random.random() < 0.1:
        safety_violations = True

    # Determine resources used
    skills_used = skills_needed.copy()
    if not success:
        # Failed tasks might use more skills trying to fix
        skills_used.extend(random.choices(['backend', 'testing', 'security'], k=random.randint(0, 2)))
        skills_used = list(set(skills_used))

    agents_used = agents_needed.copy()
    if complexity == 'complex' and not agents_used:
        agents_used.append('feature-creator')

    # Compute reward using the reward function logic
    reward = 0

    # 1. Success reward (dominant)
    if success:
        reward += 100
    else:
        reward -= 100

    # 2. Time efficiency
    if success:
        efficiency = min(estimated_time / max(actual_time, 1), 2.0)
        reward += efficiency * 20

    # 3. Resource efficiency
    resources_used = len(skills_used) + len(agents_used)
    minimum_resources = len(skills_needed) + len(agents_needed)
    if resources_used <= minimum_resources:
        reward += 10
    else:
        reward -= (resources_used - minimum_resources) * 5

    # 4. Quality metrics
    if error_count == 0:
        reward += 15
    else:
        reward -= error_count * 10

    # 5. User satisfaction
    if user_modifications == 0:
        reward += 10
    else:
        reward -= user_modifications * 5

    # 6. Safety adherence
    if not safety_violations:
        reward += 10
    else:
        reward -= 50

    # 7. Confidence bonus (simulated)
    confidence = random.uniform(0.5, 0.95)
    reward += confidence * 5

    # Add some noise to reward
    reward += random.uniform(-5, 5)

    # Format estimated time
    if estimated_time < 60:
        estimated_time_str = f"{estimated_time} min"
    else:
        hours = estimated_time // 60
        mins = estimated_time % 60
        if mins > 0:
            estimated_time_str = f"{hours}h {mins}m"
        else:
            estimated_time_str = f"{hours} hours"

    # Create experience dictionary
    experience = {
        'state': {
            'task_type': task_type,
            'domain': domain,
            'secondary_domains': secondary_domains,
            'complexity': complexity,
            'risk_level': risk_level,
            'estimated_time': estimated_time_str,
            'domain_diversity': len(secondary_domains),
            'skill_count': len(skills_needed)
        },
        'action': {
            'resources': {
                'skills': skills_used,
                'agents': agents_used
            },
            'strategy': {
                'approach': random.choice(STRATEGIES),
                'parallelism': random.choices([1, 2, 3], weights=[0.5, 0.3, 0.2])[0]
            },
            'parameters': {
                'timeout_multiplier': random.uniform(0.8, 1.5),
                'retry_strategy': random.choice(['fail_fast', 'retry_with_backoff', 'fallback']),
                'safety_level': random.choice(['strict', 'balanced', 'permissive'])
            }
        },
        'reward': round(reward, 2),
        'next_state': None,  # Simplified for synthetic data
        'done': success,
        'metadata': {
            'task_id': f'task_{exp_id:06d}',
            'task_type': task_type,
            'domain': domain,
            'complexity': complexity,
            'risk_level': risk_level,
            'estimated_time': estimated_time_str,
            'actual_time': actual_time,
            'skills_used': skills_used,
            'agents_used': agents_used,
            'strategy': random.choice(STRATEGIES),
            'success': success,
            'error_count': error_count,
            'user_modifications': user_modifications,
            'safety_violations': safety_violations,
            'confidence': round(confidence, 2)
        },
        'timestamp': (datetime.now() - timedelta(hours=random.randint(0, 720))).isoformat()
    }

    return experience


def generate_test_data(
    count: int,
    output_path: Path,
    seed: int = None,
    verbose: bool = True
) -> List[Dict]:
    """
    Generate synthetic test experiences

    Args:
        count: Number of experiences to generate
        output_path: Path to output file
        seed: Random seed
        verbose: Print progress

    Returns:
        List of generated experiences
    """
    if seed is not None:
        random.seed(seed)
        np.random.seed(seed)

    if verbose:
        print(f"\n{'='*60}")
        print(f"GENERATING SYNTHETIC TEST DATA")
        print(f"{'='*60}")
        print(f"Count: {count}")
        print(f"Output: {output_path}")
        print(f"Seed: {seed if seed else 'random'}")
        print(f"\nGenerating...")

    # Create output directory
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    experiences = []

    # Generate experiences
    for i in range(count):
        exp = generate_experience(i, seed)
        experiences.append(exp)

        if verbose and (i + 1) % 100 == 0:
            print(f"  Generated {i + 1}/{count}...")

    # Write to file (JSONL format)
    with open(output_path, 'w') as f:
        for exp in experiences:
            f.write(json.dumps(exp) + '\n')

    if verbose:
        print(f"\n✅ Generated {count} experiences")
        print(f"✅ Saved to: {output_path}")

        # Statistics
        print_statistics(experiences)

    return experiences


def print_statistics(experiences: List[Dict]):
    """Print statistics about generated data"""
    print(f"\n{'='*60}")
    print(f"DATA STATISTICS")
    print(f"{'='*60}")

    # Count by task type
    task_counts = {}
    for exp in experiences:
        task = exp['metadata']['task_type']
        task_counts[task] = task_counts.get(task, 0) + 1

    print(f"\n📊 By Task Type:")
    for task, count in sorted(task_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {task:<15} {count:>6} ({count/len(experiences)*100:.1f}%)")

    # Count by domain
    domain_counts = {}
    for exp in experiences:
        domain = exp['metadata']['domain']
        domain_counts[domain] = domain_counts.get(domain, 0) + 1

    print(f"\n📊 By Domain:")
    for domain, count in sorted(domain_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {domain:<15} {count:>6} ({count/len(experiences)*100:.1f}%)")

    # Count by complexity
    complexity_counts = {}
    for exp in experiences:
        complexity = exp['metadata']['complexity']
        complexity_counts[complexity] = complexity_counts.get(complexity, 0) + 1

    print(f"\n📊 By Complexity:")
    for complexity, count in sorted(complexity_counts.items()):
        print(f"  {complexity:<15} {count:>6} ({count/len(experiences)*100:.1f}%)")

    # Rewards
    rewards = [exp['reward'] for exp in experiences]
    successful = [r for r in rewards if r > 0]

    print(f"\n📊 Rewards:")
    print(f"  Mean: {np.mean(rewards):.2f}")
    print(f"  Std: {np.std(rewards):.2f}")
    print(f"  Min: {np.min(rewards):.2f}")
    print(f"  Max: {np.max(rewards):.2f}")
    print(f"  Positive: {len(successful)}/{len(experiences)} ({len(successful)/len(experiences)*100:.1f}%)")

    # Success rate
    success_count = sum(1 for exp in experiences if exp['metadata']['success'])
    print(f"\n📊 Success Rate: {success_count/len(experiences)*100:.1f}%")


def main():
    parser = argparse.ArgumentParser(description='Generate synthetic test data for Actor-Critic training')
    parser.add_argument(
        '--count',
        type=int,
        default=1000,
        help='Number of experiences to generate (default: 1000)'
    )
    parser.add_argument(
        '--output',
        type=str,
        default='data/experience_buffer/experiences.jsonl',
        help='Output file path (default: data/experience_buffer/experiences.jsonl)'
    )
    parser.add_argument(
        '--seed',
        type=int,
        default=None,
        help='Random seed for reproducibility (default: random)'
    )
    parser.add_argument(
        '--quiet',
        action='store_true',
        help='Suppress progress output'
    )

    args = parser.parse_args()

    # Validate count
    if args.count < 1:
        print("❌ ERROR: count must be at least 1")
        sys.exit(1)

    # Generate data
    generate_test_data(
        count=args.count,
        output_path=Path(args.output),
        seed=args.seed,
        verbose=not args.quiet
    )


if __name__ == '__main__':
    main()
