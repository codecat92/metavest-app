## Light Theme — Metavest Design System

### Prinsip utama

- Jangan pernah flip warna secara naif (dark bg → white, dark text → black).
- Glass effect (`rgba(255,255,255,0.08)`) TIDAK BOLEH dipakai di light mode — invisible di atas background terang.
- Ganti glass dengan: solid white card + `box-shadow` halus + border tipis berbasis `rgba(14,20,57,...)`.
- Accent colors (purple #8B5CF6, gold #D4AF37) TIDAK berubah antara dark dan light.

### Token warna light mode

#### Backgrounds

| Token              | Dark Mode | Light Mode |
| ------------------ | --------- | ---------- |
| colors.bg.primary  | #0E1439   | #F0F4FF    |
| colors.bg.deep     | #060910   | #E8EDF8    |
| colors.bg.elevated | #131B4A   | #FFFFFF    |

#### Text

| Token                 | Dark Mode | Light Mode |
| --------------------- | --------- | ---------- |
| colors.text.primary   | #F8FAFC   | #0E1439    |
| colors.text.secondary | #94A3B8   | #475569    |
| colors.text.muted     | #64748B   | #94A3B8    |

#### Semantic (digelapkan agar kontras cukup di bg terang)

| Token                    | Dark Mode | Light Mode |
| ------------------------ | --------- | ---------- |
| colors.semantic.positive | #22C55E   | #15803D    |
| colors.semantic.negative | #EF4444   | #DC2626    |
| colors.semantic.warning  | #F59E0B   | #B45309    |
| colors.semantic.info     | #3B82F6   | #1D4ED8    |

#### Card / Surface (pengganti glass)

| Token                | Dark Mode              | Light Mode          |
| -------------------- | ---------------------- | ------------------- |
| surface.card         | rgba(255,255,255,0.08) | #FFFFFF             |
| surface.cardElevated | rgba(255,255,255,0.12) | #FFFFFF             |
| border.default       | rgba(255,255,255,0.12) | rgba(14,20,57,0.08) |
| border.strong        | rgba(255,255,255,0.18) | rgba(14,20,57,0.15) |

#### Overlay

| Token            | Dark Mode         | Light Mode          |
| ---------------- | ----------------- | ------------------- |
| overlay.modal    | rgba(6,9,16,0.90) | rgba(14,20,57,0.65) |
| overlay.backdrop | rgba(6,9,16,0.60) | rgba(14,20,57,0.45) |

#### Navigation (Tab Bar)

| Token               | Dark Mode              | Light Mode |
| ------------------- | ---------------------- | ---------- |
| tabBar.background   | rgba(255,255,255,0.06) | #E8EDF8    |
| tabBar.activeTint   | #D4AF37                | #D4AF37    |
| tabBar.inactiveTint | #94A3B8                | #94A3B8    |

### Aturan implementasi GlassCard di light mode

Di dark mode, GlassCard pakai `backgroundColor` berupa rgba putih transparan.
Di light mode, GANTI dengan:

- `backgroundColor: '#FFFFFF'`
- `borderColor: rgba(14,20,57,0.08)` untuk elevation 1-2
- `borderColor: rgba(14,20,57,0.15)` untuk elevation 3-4
- Tambahkan `shadow` props React Native berikut untuk elevation 1-2:
  - shadowColor: '#0E1439', shadowOffset: {width:0, height:2}, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2
- Untuk elevation 3-4:
  - shadowColor: '#0E1439', shadowOffset: {width:0, height:4}, shadowOpacity: 0.10, shadowRadius: 16, elevation: 4

### Aturan AppInput di light mode

- backgroundColor: '#FFFFFF'
- borderColor default: rgba(14,20,57,0.15)
- borderColor error: #DC2626
- color (text): #0E1439
- placeholderTextColor: #94A3B8

### Aturan Badge di light mode

Badge menggunakan warna semantic yang LEBIH GELAP agar terbaca.

- success: bg rgba(34,197,94,0.10), border rgba(21,128,61,0.25), text #15803D
- danger: bg rgba(239,68,68,0.10), border rgba(220,38,38,0.25), text #DC2626
- warning: bg rgba(245,158,11,0.10), border rgba(180,83,9,0.25), text #B45309
- info: bg rgba(139,92,246,0.10), border rgba(109,40,217,0.20), text #6D28D9
- neutral: bg rgba(14,20,57,0.06), border rgba(14,20,57,0.12), text #475569
