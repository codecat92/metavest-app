import type { ComponentType } from 'react';
import {
  Rocket, Gem, TrendingUp, Globe, Brain, Shield, Flame, Leaf,
  Zap, BookOpen, Trophy, Star, Cpu, GraduationCap,
} from 'lucide-react-native';

export interface ChatAvatarPreset {
  key: string;
  Icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  color: string;
}

// Preset logo grup — key harus sinkron dengan ChatGroup::AVATARS di backend.
export const CHAT_AVATARS: ChatAvatarPreset[] = [
  { key: 'rocket', Icon: Rocket, color: '#8B5CF6' },
  { key: 'gem', Icon: Gem, color: '#D4AF37' },
  { key: 'trending', Icon: TrendingUp, color: '#22C55E' },
  { key: 'globe', Icon: Globe, color: '#3B82F6' },
  { key: 'brain', Icon: Brain, color: '#EC4899' },
  { key: 'shield', Icon: Shield, color: '#14B8A6' },
  { key: 'flame', Icon: Flame, color: '#F97316' },
  { key: 'leaf', Icon: Leaf, color: '#16A34A' },
  { key: 'bolt', Icon: Zap, color: '#EAB308' },
  { key: 'book', Icon: BookOpen, color: '#6366F1' },
  { key: 'trophy', Icon: Trophy, color: '#F59E0B' },
  { key: 'star', Icon: Star, color: '#FBBF24' },
  { key: 'cpu', Icon: Cpu, color: '#06B6D4' },
  { key: 'graduation', Icon: GraduationCap, color: '#A855F7' },
];

export function getChatAvatar(key?: string | null): ChatAvatarPreset | null {
  if (!key) return null;
  return CHAT_AVATARS.find(a => a.key === key) ?? null;
}
