# UI_AGENT_CONTEXT.md — Rules for UI Redesign Agent

> **BACA DOKUMEN INI SEBELUM MEMULAI TUGAS APAPUN.**
> Tugas kamu HANYA mendesain ulang UI. Jangan merusak integrasi yang sudah ada.

---

## 1. PROYEK INI ADALAH...

Aplikasi **social trading** bernama **Metavest**. Backend Laravel 10 sudah production-stable. Frontend React Native (Expo SDK 54) adalah klien mobile yang mengonsumsi API backend.

**Backend adalah source of truth.** Semua endpoint sudah fix. Jangan ubah cara frontend memanggil API.

---

## 2. ARSITEKTUR FRONTEND (WAJIB DIPERTAHANKAN)

### Layer yang TIDAK BOLEH DIUBAH

| Layer | File/Folder | Alasan |
|-------|------------|--------|
| **API Calls** | `src/api/*.ts` | Semua panggilan ke backend — jangan ubah URL, method, body, atau response parsing |
| **Auth System** | `src/api/auth.ts`, `src/context/AuthContext.tsx` | Login 3-step (login → OTP → login-token), token persistence, auto-login |
| **Navigation** | `App.tsx` screen registrations | 17 stack screens + 5 tab screens — jangan hapus, ganti nama, atau ubah params |
| **Alert System** | `src/context/AlertContext.tsx` | Custom dark modal menggantikan system Alert — semua screen pakai `useCustomAlert()` |
| **Base URL** | `src/api/client.ts` | `BASE_URL = 'https://metavest-backend-production.up.railway.app/api'` |

### Yang BOLEH kamu ubah

| Layer | File/Folder | Batasan |
|-------|------------|---------|
| **Component Library** | `src/components/*.tsx` | Tambah komponen baru, perbaiki yang ada — tapi jangan ubah props yang sudah dipakai screens lain |
| **Theme Tokens** | `src/theme/*.ts` | Tambah warna/spacing/typography token — tapi jangan hapus token yang sudah ada (bisa merusak screen) |
| **Screen UI** | `src/screens/*.tsx` | Ganti layout, warna, spacing, animasi — **tapi**: jangan sentuh bagian `useEffect`, API calls (`api.get/post`), navigation params, atau logic auth |

---

## 3. COMPONENT LIBRARY (yang sudah ada)

Kamu **HARUS pakai** komponen yang sudah ada. Boleh tambah baru, tapi jangan buang yang lama.

| Component | Lokasi | Fungsi |
|-----------|--------|--------|
| `AppButton` | `src/components/AppButton.tsx` | Tombol themed (primary/secondary/danger/success/gold) |
| `AppInput` | `src/components/AppInput.tsx` | Text input themed dengan label |
| `AppHeader` | `src/components/AppHeader.tsx` | Header screen dengan back button + judul |
| `GlassCard` | `src/components/GlassCard.tsx` | Card container glass-morphism |
| `Badge` | `src/components/Badge.tsx` | Status/tag badge |
| `EmptyState` | `src/components/EmptyState.tsx` | Placeholder saat data kosong |
| `Skeleton` | `src/components/Skeleton.tsx` | Loading skeleton placeholder |
| `MetavestAlert` | `src/components/MetavestAlert.tsx` | Custom modal alert |

---

## 4. DESIGN TOKENS (wajib pakai, jangan hardcode)

### Colors (`src/theme/colors.ts`)
```ts
bg.primary: '#0E1439'       // Semua screen background
bg.card: 'rgba(14,20,57,0.85)'  // Glass card
accent.purple: '#AB4BFF'    // Primary action, tab active
accent.gold: '#C9A84C'      // Gold highlights, MP badge
accent.green: '#2FEFC4'     // Profit, success, buy
accent.red: '#FF4B6E'       // Loss, error, sell
text.primary: '#FFFFFF'     // Judul, nilai
text.secondary: '#8899AA'   // Label, deskripsi
```

### Typography (`src/theme/typography.ts`)
```ts
Font families:
- Space Grotesk (Regular, Medium, SemiBold, Bold) → headings, buttons, prices
- DM Sans (Regular, Medium, SemiBold, Bold) → body text, labels

Scale:
- h1: 24-36px, Bold, SpaceGrotesk
- h2: 18-22px, Bold/SemiBold, SpaceGrotesk
- body: 13-15px, Regular, DMSans
- label: 10-12px, Medium, DMSans
```

### Spacing (`src/theme/spacing.ts`)
```ts
screen.x: 24px (horizontal padding)
card.padding: 16-20px
list.gap: 10-14px
section.gap: 20-24px
radius: 14-24px (varies by card type)
```

---

## 5. AUTH FLOW (jangan disentuh)

```
1. LoginScreen → email + password
2. POST /login → verifikasi → dapat userId
3. POST /otp/send → kirim OTP ke email (type=0)
4. Navigate ke OTPScreen
5. POST /otp/verify-miss → verifikasi OTP
6. POST /login-token → dapat Sanctum token (3 bulan)
7. Navigate ke Tabs → auto-login via AsyncStorage
```

Jangan ubah flow ini. Jangan hapus OTP screen. Jangan skip verifikasi.

---

## 6. NAVIGATION STRUCTURE (jangan diubah)

### Stack Navigator (17 screens)
```
Login → Register → ForgotPassword → OTP → Tabs
PAMM, News, SignalDetail, Forum, CopyTrade, Market,
Academy, EditProfile, ArticleDetail, EconomicsCalendar,
Notifications, Brokers
```

### Tab Navigator (5 tabs)
```
Home | Signals | Traders | Portfolio | Profile
```

Jangan hapus, rename, atau ubah order screen. Boleh restyle header/tab bar.

---

## 7. API MODULES — DATA FLOW (jangan diubah)

Setiap screen terhubung ke API module spesifik:

| Screen | API Module | Endpoint Utama |
|--------|-----------|----------------|
| LoginScreen | auth.ts, otp.ts | /login, /otp/send, /otp/verify-miss |
| HomeScreen | forex.ts, news.ts | /forex/curr, /forex/percentage, /article-event |
| SignalScreen | signals.ts | /signals/all |
| SignalDetailScreen | signals.ts | /signals/{id}, like/share/execute |
| TradersScreen | follow.ts | /user-traders/active, /followed/* |
| PortfolioScreen | wallet.ts, follow.ts | /wallet/byid, /wallet/history, /wallet/top-up, /wallet/withdraw |
| ProfileScreen | profile.ts | /profile/edit, /profile/profile-image/edit |
| ForumScreen | forum.ts | /forums/posts/*, /forums/comments/* |
| MarketScreen | forex.ts | /forex/time |
| NewsScreen | news.ts | /article-event, /academy-article |
| AcademyScreen | academy.ts | /user-traders/academies/* |
| PAMMScreen | pamm.ts | /pamm/* |
| CopyTradeScreen | copytrade.ts | /copytrades/* |
| BrokersScreen | brokers.ts | /provider-broker |
| NotificationsScreen | notifications.ts | /user-notification/* |
| EconomicsCalendarScreen | client.ts | /economics-calendar/* |

**JANGAN** ubah cara screen memanggil API. **JANGAN** ubah response parsing. **JANGAN** hapus import API module.

---

## 8. PERATURAN PENTING

1. **Backend adalah source of truth** — jangan ubah request body atau expect response shape berbeda
2. **Jangan hapus import** — setiap screen punya import API module, context, dan navigation. Jangan dihapus.
3. **Jangan ubah navigation params** — `navigation.navigate('ScreenName', { param })` harus tetap berfungsi
4. **Pakai theme tokens** — jangan hardcode warna/ukuran. Import dari `src/theme`
5. **Font harus diload** — Space Grotesk dan DM Sans sudah diload di App.tsx via `useFonts`. Jangan tambah font baru tanpa load.
6. **Responsive terbatas** — app ini hanya portrait mobile. Jangan tambah landscape/tablet layout kecuali diminta.
7. **All screens have pre-warm** — LoginScreen melakukan pre-warm fetch ke Railway. Jangan hapus ini.
8. **Error handling tetap** — semua screen pakai `useCustomAlert().showAlert()` untuk error. Jangan ganti ke `Alert.alert()`.

---

## 9. SEBELUM COMMIT — CHECKLIST

- [ ] Semua API import masih ada
- [ ] Semua navigation params masih berfungsi
- [ ] `useCustomAlert()` masih dipakai (bukan `Alert.alert`)
- [ ] Theme tokens dari `src/theme` dipakai (bukan hardcode)
- [ ] Auth flow tidak berubah
- [ ] Tidak ada perubahan di `src/api/`
- [ ] Tidak ada perubahan di `src/context/`
- [ ] Tidak ada perubahan di `App.tsx` navigation structure

---

> **Ingat: tugas kamu adalah UI/UX designer, bukan backend developer. Backend adalah source of truth. Jangan rusak integrasi.**
