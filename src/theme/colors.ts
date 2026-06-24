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
    g1: '#0E1439',
    g2: '#0E1439',
    g3: '#0E1439',
    g4: '#0E1439',
    border: 'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.12)',
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
    primary: '#1E0A3C',
    secondary: '#4A2A6B',
    muted: '#7B5EA7',
  },
  semantic: {
    positive: '#16A34A',
    negative: '#DC2626',
    warning: '#D97706',
    info: '#4C1D95',
  },
  glass: {
    g1: 'rgba(255,255,255,0.25)',
    g2: 'rgba(255,255,255,0.35)',
    g3: 'rgba(255,255,255,0.45)',
    g4: 'rgba(255,255,255,0.55)',
    border: 'rgba(255,255,255,0.40)',
    borderStrong: 'rgba(255,255,255,0.55)',
  },
  overlay: {
    modal: 'rgba(30,10,60,0.70)',
    backdrop: 'rgba(30,10,60,0.40)',
  },
};

export const darkColors = dark;
export const lightColors = light;
export type ColorScheme = typeof dark;
