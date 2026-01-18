import { Size, Vote } from '../types';

// All 27 combinations of Uncertainty-Complexity-Effort
const POINTS_TABLE: Record<string, number> = {
  'S-S-S': 1,
  'S-S-M': 2,
  'S-S-L': 5,
  'S-M-S': 2,
  'S-M-M': 3,
  'S-M-L': 5,
  'S-L-S': 3,
  'S-L-M': 5,
  'S-L-L': 8,
  'M-S-S': 3,
  'M-S-M': 5,
  'M-S-L': 8,
  'M-M-S': 5,
  'M-M-M': 5,
  'M-M-L': 8,
  'M-L-S': 8,
  'M-L-M': 8,
  'M-L-L': 13,
  'L-S-S': 5,
  'L-S-M': 8,
  'L-S-L': 13,
  'L-M-S': 8,
  'L-M-M': 8,
  'L-M-L': 13,
  'L-L-S': 8,
  'L-L-M': 13,
  'L-L-L': 13,
};

export function calculatePoints(vote: Vote): number | null {
  if (!vote.uncertainty || !vote.complexity || !vote.effort) {
    return null;
  }

  const key = `${vote.uncertainty}-${vote.complexity}-${vote.effort}`;
  return POINTS_TABLE[key] ?? null;
}

export function isVoteComplete(vote: Vote): boolean {
  return !!(vote.uncertainty && vote.complexity && vote.effort);
}

export function getSizeLabel(size: Size): string {
  const labels: Record<Size, string> = {
    S: 'Small',
    M: 'Medium',
    L: 'Large',
  };
  return labels[size];
}

export function getSizeEmoji(size: Size): string {
  const emojis: Record<Size, string> = {
    S: 'S',
    M: 'M',
    L: 'L',
  };
  return emojis[size];
}
