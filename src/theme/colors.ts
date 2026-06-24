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
    primary: '#F5F5F7',
    deep: '#E8E8ED',
    elevated: '#FFFFFF',
  },
  accent: {
    gold: '#D4AF37',
    goldLight: '#B8860B',
    purple: '#8B5CF6',
  },
  text: {
    primary: '#1D1D1F',
    secondary: '#6E6E73',
    muted: '#86868B',
  },
  semantic: {
    positive: '#22C55E',
    negative: '#DC2626',
    warning: '#D97706',
    info: '#3B82F6',
  },
  glass: {
    g1: '#FFFFFF',
    g2: '#FFFFFF',
    g3: '#FFFFFF',
    g4: '#FFFFFF',
    border: '#E8E8ED',
    borderStrong: '#D2D2D7',
  },
  overlay: {
    modal: 'rgba(0,0,0,0.40)',
    backdrop: 'rgba(0,0,0,0.25)',
  },
};

export const darkColors = dark;
export const lightColors = light;
export type ColorScheme = typeof dark;
