#!/usr/bin/env python3
"""
Experience Collector for ai-core Reinforcement Learning

Collects execution experiences (state, action, reward) for training
Actor-Critic models to optimize orchestration decisions.

Usage:
    python experience_collector.py collect --mode shadow
    python experience_collector.py stats
    python experience_collector.py export --format csv
"""

import json
import os
import sys
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
import numpy as np


# Configuration
EXPERIENCE_BUFFER_PATH = Path(__file__).parent.parent.parent.parent / "data" / "experience_buffer"
EXPERIENCES_FILE = EXPERIENCE_BUFFER_PATH / "experiences.jsonl"


@dataclass
class Experience:
    """Single experience tuple for RL training"""
    state: Dict[str, Any]
    action: Dict[str, Any]
    reward: float
    next_state: Optional[Dict[str, Any]]
    done: bool
    metadata: Dict[str, Any]
    timestamp: str

    def to_dict(self) -> Dict[str, Any]:
        """Convert experience to dictionary"""
        return asdict(self)

    def to_json(self) -> str:
        """Convert experience to JSON string"""
        return json.dumps(self.to_dict())


class ExperienceCollector:
    """
    Collects and manages RL experiences from ai-core executions
    """

    def __init__(self, buffer_path: Path = EXPERIENCES_FILE):
        self.buffer_path = buffer_path
        self.buffer_path.parent.mkdir(parents=True, exist_ok=True)

    def collect(
        self,
        state: Dict[str, Any],
        action: Dict[str, Any],
        reward: float,
        next_state: Optional[Dict[str, Any]] = None,
        done: bool = False,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Experience:
        """
        Collect a single experience from task execution

        Args:
            state: State before action
            action: Action taken
            reward: Reward received
            next_state: State after action (optional)
            done: Whether episode is complete
            metadata: Additional metadata

        Returns:
            Experience object
        """
        experience = Experience(
            state=state,
            action=action,
            reward=reward,
            next_state=next_state,
            done=done,
            metadata=metadata or {},
            timestamp=datetime.now().isoformat()
        )

        # Append to buffer
        self._append_to_buffer(experience)

        return experience

    def collect_batch(
        self,
        experiences: List[Dict[str, Any]]
    ) -> List[Experience]:
        """
        Collect multiple experiences at once

        Args:
            experiences: List of experience dictionaries

        Returns:
            List of Experience objects
        """
        collected = []

        for exp_dict in experiences:
            experience = self.collect(
                state=exp_dict.get('state', {}),
                action=exp_dict.get('action', {}),
                reward=exp_dict.get('reward', 0.0),
                next_state=exp_dict.get('next_state'),
                done=exp_dict.get('done', False),
                metadata=exp_dict.get('metadata', {})
            )
            collected.append(experience)

        return collected

    def _append_to_buffer(self, experience: Experience):
        """Append experience to buffer file"""
        with open(self.buffer_path, 'a') as f:
            f.write(experience.to_json() + '\n')

    def load_experiences(
        self,
        limit: Optional[int] = None,
        task_type: Optional[str] = None,
        domain: Optional[str] = None,
        min_reward: Optional[float] = None
    ) -> List[Experience]:
        """
        Load experiences from buffer with optional filtering

        Args:
            limit: Maximum number of experiences to load
            task_type: Filter by task type
            domain: Filter by domain
            min_reward: Filter by minimum reward

        Returns:
            List of Experience objects
        """
        if not self.buffer_path.exists():
            return []

        experiences = []

        with open(self.buffer_path, 'r') as f:
            for line in f:
                if limit and len(experiences) >= limit:
                    break

                try:
                    exp_dict = json.loads(line.strip())

                    # Apply filters
                    if task_type and exp_dict.get('metadata', {}).get('task_type') != task_type:
                        continue
                    if domain and exp_dict.get('metadata', {}).get('domain') != domain:
                        continue
                    if min_reward and exp_dict.get('reward', 0) < min_reward:
                        continue

                    # Reconstruct Experience object
                    exp = Experience(
                        state=exp_dict['state'],
                        action=exp_dict['action'],
                        reward=exp_dict['reward'],
                        next_state=exp_dict.get('next_state'),
                        done=exp_dict['done'],
                        metadata=exp_dict.get('metadata', {}),
                        timestamp=exp_dict.get('timestamp', datetime.now().isoformat())
                    )
                    experiences.append(exp)

                except (json.JSONDecodeError, KeyError) as e:
                    print(f"Warning: Skipping invalid experience: {e}", file=sys.stderr)
                    continue

        return experiences

    def get_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about collected experiences

        Returns:
            Dictionary with statistics
        """
        experiences = self.load_experiences()

        if not experiences:
            return {
                'total_experiences': 0,
                'buffer_size_mb': 0,
                'message': 'No experiences collected yet'
            }

        rewards = [e.reward for e in experiences]
        successes = [e for e in experiences if e.metadata.get('success', False)]

        # Task type distribution
        task_types = {}
        for exp in experiences:
            task_type = exp.metadata.get('task_type', 'unknown')
            task_types[task_type] = task_types.get(task_type, 0) + 1

        # Domain distribution
        domains = {}
        for exp in experiences:
            domain = exp.metadata.get('domain', 'unknown')
            domains[domain] = domains.get(domain, 0) + 1

        # Complexity distribution
        complexities = {}
        for exp in experiences:
            complexity = exp.metadata.get('complexity', 'unknown')
            complexities[complexity] = complexities.get(complexity, 0) + 1

        # Buffer size
        buffer_size_mb = self.buffer_path.stat().st_size / (1024 * 1024) if self.buffer_path.exists() else 0

        return {
            'total_experiences': len(experiences),
            'buffer_size_mb': round(buffer_size_mb, 2),
            'success_rate': round(len(successes) / len(experiences), 3) if experiences else 0,
            'reward_stats': {
                'mean': round(np.mean(rewards), 2),
                'std': round(np.std(rewards), 2),
                'min': round(np.min(rewards), 2),
                'max': round(np.max(rewards), 2),
                'median': round(np.median(rewards), 2)
            },
            'task_distribution': task_types,
            'domain_distribution': domains,
            'complexity_distribution': complexities,
            'date_range': {
                'oldest': min(e.timestamp for e in experiences),
                'newest': max(e.timestamp for e in experiences)
            }
        }

    def export(
        self,
        output_path: Path,
        format: str = 'jsonl',
        filters: Optional[Dict[str, Any]] = None
    ):
        """
        Export experiences to file

        Args:
            output_path: Output file path
            format: Output format (jsonl, csv, json)
            filters: Optional filters to apply
        """
        # Load experiences with filters
        experiences = self.load_experiences(
            task_type=filters.get('task_type') if filters else None,
            domain=filters.get('domain') if filters else None,
            min_reward=filters.get('min_reward') if filters else None
        )

        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        if format == 'jsonl':
            with open(output_path, 'w') as f:
                for exp in experiences:
                    f.write(exp.to_json() + '\n')

        elif format == 'json':
            with open(output_path, 'w') as f:
                json.dump([e.to_dict() for e in experiences], f, indent=2)

        elif format == 'csv':
            import csv

            if not experiences:
                print("No experiences to export", file=sys.stderr)
                return

            # Flatten experiences for CSV
            with open(output_path, 'w', newline='') as f:
                fieldnames = [
                    'timestamp', 'reward', 'done',
                    'task_type', 'domain', 'complexity',
                    'estimated_time', 'actual_time',
                    'success', 'error_count'
                ]

                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()

                for exp in experiences:
                    row = {
                        'timestamp': exp.timestamp,
                        'reward': exp.reward,
                        'done': exp.done,
                        'task_type': exp.metadata.get('task_type', ''),
                        'domain': exp.metadata.get('domain', ''),
                        'complexity': exp.metadata.get('complexity', ''),
                        'estimated_time': exp.metadata.get('estimated_time', ''),
                        'actual_time': exp.metadata.get('actual_time', ''),
                        'success': exp.metadata.get('success', False),
                        'error_count': exp.metadata.get('error_count', 0)
                    }
                    writer.writerow(row)

        else:
            raise ValueError(f"Unsupported format: {format}")

        print(f"Exported {len(experiences)} experiences to {output_path}")

    def clear(self):
        """Clear the experience buffer"""
        if self.buffer_path.exists():
            self.buffer_path.unlink()
            print(f"Cleared experience buffer: {self.buffer_path}")
        else:
            print("Experience buffer is already empty")


def compute_reward_from_outcome(outcome: Dict[str, Any], context: Dict[str, Any]) -> float:
    """
    Compute reward from execution outcome

    This is the reward function used by the RL system.

    Args:
        outcome: Execution outcome
        context: Execution context

    Returns:
        Reward value
    """
    reward = 0

    # 1. Success reward (dominant)
    if outcome.get('success', False):
        reward += 100
    else:
        reward -= 100

    # 2. Time efficiency
    if outcome.get('success', False):
        estimated = parse_time(context.get('estimated_time', '1 hour'))
        actual = outcome.get('actual_time', estimated)
        efficiency = min(estimated / max(actual, 1), 2.0)
        reward += efficiency * 20

    # 3. Resource efficiency
    resources_used = len(outcome.get('resources_used', []))
    minimum_resources = outcome.get('minimum_resources', resources_used)
    if resources_used <= minimum_resources:
        reward += 10
    else:
        reward -= (resources_used - minimum_resources) * 5

    # 4. Quality metrics
    error_count = outcome.get('error_count', 0)
    if error_count == 0:
        reward += 15
    else:
        reward -= error_count * 10

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
        reward -= 50

    # 7. Confidence bonus
    confidence = context.get('confidence', 0.5)
    reward += confidence * 5

    return reward


def parse_time(time_str: str) -> float:
    """
    Parse time string to minutes

    Examples:
        "30 min" -> 30
        "1 hour" -> 60
        "2 hours" -> 120
    """
    time_str = time_str.lower().strip()

    if 'min' in time_str:
        return float(time_str.replace('min', '').strip())
    elif 'hour' in time_str:
        hours = float(time_str.replace('hours', '').replace('hour', '').strip())
        return hours * 60
    elif 'day' in time_str:
        days = float(time_str.replace('days', '').replace('day', '').strip())
        return days * 8 * 60  # 8 hours per day
    else:
        # Default to 60 minutes
        return 60.0


def main():
    """CLI interface for experience collector"""
    import argparse

    parser = argparse.ArgumentParser(description='Experience Collector for ai-core RL')
    subparsers = parser.add_subparsers(dest='command', help='Command to run')

    # Collect command
    collect_parser = subparsers.add_parser('collect', help='Collect experiences')
    collect_parser.add_argument('--mode', choices=['shadow', 'production'], default='shadow',
                                help='Collection mode')

    # Stats command
    stats_parser = subparsers.add_parser('stats', help='Show statistics')

    # Export command
    export_parser = subparsers.add_parser('export', help='Export experiences')
    export_parser.add_argument('--output', '-o', required=True, help='Output file path')
    export_parser.add_argument('--format', '-f', choices=['jsonl', 'json', 'csv'],
                               default='jsonl', help='Output format')
    export_parser.add_argument('--task-type', help='Filter by task type')
    export_parser.add_argument('--domain', help='Filter by domain')
    export_parser.add_argument('--min-reward', type=float, help='Filter by minimum reward')

    # Clear command
    clear_parser = subparsers.add_parser('clear', help='Clear experience buffer')
    clear_parser.add_argument('--confirm', action='store_true',
                             help='Confirm clearing the buffer')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    collector = ExperienceCollector()

    if args.command == 'collect':
        print(f"Starting experience collection in {args.mode} mode...")
        print("Experiences will be automatically collected during task execution")
        print(f"Buffer location: {EXPERIENCES_FILE}")

    elif args.command == 'stats':
        stats = collector.get_statistics()
        print(json.dumps(stats, indent=2))

    elif args.command == 'export':
        filters = {}
        if args.task_type:
            filters['task_type'] = args.task_type
        if args.domain:
            filters['domain'] = args.domain
        if args.min_reward:
            filters['min_reward'] = args.min_reward

        collector.export(
            output_path=Path(args.output),
            format=args.format,
            filters=filters if filters else None
        )

    elif args.command == 'clear':
        if args.confirm:
            collector.clear()
        else:
            print("Error: --confirm flag required to clear buffer")
            return 1


if __name__ == '__main__':
    sys.exit(main() or 0)
