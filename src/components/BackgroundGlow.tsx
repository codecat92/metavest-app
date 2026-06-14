// KOMPONEN: BackgroundGlow — Dua radial gradient ungu halus di pojok layar
// glowTopRight: pojok kanan atas (cx=100%, cy=0%), opacity 0.35
// glowBottomLeft: pojok kiri bawah (cx=0%, cy=100%), opacity 0.15
// Warna: #2A0E42 — ungu sangat gelap, menyatu dengan background navy #0E1439
// Ditempatkan sebelum ScrollView agar berada di belakang semua konten UI
// pointerEvents="none" agar tidak memblokir sentuhan/scroll
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { StyleSheet } from 'react-native';

export default function BackgroundGlow() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="glowTopRight" cx="100%" cy="0%" r="60%">
          <Stop offset="0%" stopColor="rgba(42,14,66,0.35)" stopOpacity="1" />
          <Stop offset="70%" stopColor="rgba(42,14,66,0)" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="glowBottomLeft" cx="0%" cy="100%" r="60%">
          <Stop offset="0%" stopColor="rgba(42,14,66,0.15)" stopOpacity="1" />
          <Stop offset="70%" stopColor="rgba(42,14,66,0)" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#glowTopRight)" />
      <Rect width="100%" height="100%" fill="url(#glowBottomLeft)" />
    </Svg>
  );
}
