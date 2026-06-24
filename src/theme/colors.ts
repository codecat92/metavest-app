const dark = {
  bg: {
    primary: '#0E1439',
    deep: '#060910',
    elevated: '#131B4A',
  },
  accent: {
    gold: '#D4AF37',
    goldLight: '#F7E8B0',
    purple: '#8B5CF6',
  },
  text: {
    primary: '#F8FAFC',
    secondary: '#94A3B8',
    muted: '#64748B',
  },
  semantic: {
    positive: '#22C55E',
    negative: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
  glass: {
    g1: 'rgba(255,255,255,0.06)',
    g2: 'rgba(255,255,255,0.08)',
    g3: 'rgba(255,255,255,0.12)',
    g4: 'rgba(255,255,255,0.15)',
    border: 'rgba(255,255,255,0.12)',
    borderStrong: 'rgba(255,255,255,0.18)',
  },
  overlay: {
    modal: 'rgba(6,9,16,0.90)',
    backdrop: 'rgba(6,9,16,0.60)',
  },
};

const light = {
  bg: {
    primary: '#CEB9F9',
    deep: '#B89DE0',
    elevated: '#E4D4FB',
  },
  accent: {
    gold: '#D4AF37',
    goldLight: '#B8860B',
    purple: '#7C3AED',
  },
  text: {
    primary: '#F8FAFC',
    secondary: '#CBD5E1',
    muted: '#94A3B8',
  },
  semantic: {
    positive: '#4ADE80',
    negative: '#F87171',
    warning: '#FBBF24',
    info: '#818CF8',
  },
  glass: {
    g1: '#3B1F6B',
    g2: '#3B1F6B',
    g3: '#3B1F6B',
    g4: '#3B1F6B',
    border: 'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.14)',
  },
  overlay: {
    modal: 'rgba(6,9,16,0.85)',
    backdrop: 'rgba(6,9,16,0.55)',
  },
};

export const darkColors = dark;
export const lightColors = light;
export type ColorScheme = typeof dark;
