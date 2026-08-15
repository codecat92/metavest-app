import { ComponentType } from 'react';
import { Shield, Award, Star, Trophy, Gem } from 'lucide-react-native';

export interface RankProgress {
  current_rank: number;
  rank_name: string;
  invite_count: number;
  total_deposit: number;
  next_rank: {
    rank: number;
    rank_name: string;
    min_invites: number;
    min_deposit: number;
  } | null;
}

type RankIcon = ComponentType<{ size: number; color: string }>;

export const rankIcons: Record<number, RankIcon> = {
  1: Shield,
  2: Award,
  3: Star,
  4: Trophy,
  5: Gem,
};

export const rankColors: Record<number, string> = {
  1: '#9CA3AF',
  2: '#CD7F32',
  3: '#A8A8A8',
  4: '#FFD700',
  5: '#E01E5A',
};

export const tierColors: Record<number, { ring: string; gradient: string }> = {
  1: { ring: '#b8bcc9', gradient: '#3a3f4d' },
  2: { ring: '#d99a5f', gradient: '#4a3020' },
  3: { ring: '#c9cbd6', gradient: '#3a3d4a' },
  4: { ring: '#f0c96b', gradient: '#4a3f10' },
  5: { ring: '#c9a8f0', gradient: '#2a2450' },
};
