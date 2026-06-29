# Metavest Academy — Frontend Development Snapshot

## Project Context

- **Backend:** Laravel 10 API sudah ready di `/api/academy/*`
- **Web Admin Panel:** Sudah dibuat untuk approve/reject instructor & course, serta notifikasi admin
- **Frontend Target:** React Native Expo SDK 54 (`metavest-app`)
- **Existing Screen:** `AcademyScreen.tsx` saat ini adalah Trader Academy legacy (`/user-traders/academies/*`) dan akan diganti total menjadi Metavest Academy

---

## Design Decisions (Final)

| Decision                   | Value                                                                |
| -------------------------- | -------------------------------------------------------------------- |
| Replace AcademyScreen      | Yes. Metavest Academy replaces existing AcademyScreen                |
| Change HomeScreen card     | No. HomeScreen "Metavest Academy" card stays as-is                   |
| Add bottom tab             | No. Keep existing 5 tabs: Home, Signals, Traders, Portfolio, Profile |
| Instructor CRUD            | No on mobile. Instructor creates courses via web portal              |
| Instructor mobile features | Read-only profile + course list + notifications                      |
| Video player               | No for MVP. Lessons are text + images only                           |
| Offline download           | No for MVP                                                           |
| Admin mobile               | No. Admin uses web panel only                                        |

---

## Architecture

### Entry Flow

```
HomeScreen
  └── Card "Metavest Academy" (unchanged)
        └── navigation.navigate('Academy')   →   AcademyCatalogScreen
```

### User Roles in Mobile

1. **Guest / Logged-in User:** Browse courses & instructors
2. **Student:** Enroll, my courses, read lessons, mark complete, review, notifications
3. **Instructor (approved):** View profile, view own courses, notifications

---

## Files to Create

```
src/
├── api/
│   └── academyNew.ts
├── types/
│   └── academy.ts
├── screens/
│   ├── AcademyScreen.tsx          ← REWRITE existing
│   └── academy/
│       ├── CourseDetailScreen.tsx
│       ├── InstructorDetailScreen.tsx
│       ├── MyEnrollmentsScreen.tsx
│       ├── LessonScreen.tsx
│       ├── ReviewScreen.tsx
│       ├── AcademyNotificationsScreen.tsx
│       └── instructor/
│           └── InstructorProfileScreen.tsx
└── components/
    └── academy/
        ├── CourseCard.tsx
        ├── InstructorCard.tsx
        ├── LessonListItem.tsx
        └── EnrollmentCard.tsx
```

## Files to Modify

1. `src/types/navigation.ts` — add new routes
2. `App.tsx` — register new stack screens
3. `src/screens/AcademyScreen.tsx` — rewrite as AcademyCatalogScreen

---

## Navigation Routes to Add

### RootStackParamList

```typescript
AcademyCatalog: undefined;
CourseDetail: {
  courseId: number;
}
InstructorDetail: {
  instructorId: number;
}
MyEnrollments: undefined;
Lesson: {
  courseId: number;
  chapterId: number;
  lessonId: number;
}
Review: {
  courseId: number;
}
AcademyNotifications: undefined;
InstructorProfile: undefined;
```

### App.tsx Registration

```tsx
<Stack.Screen name="AcademyCatalog" component={AcademyCatalogScreen} />
<Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
<Stack.Screen name="InstructorDetail" component={InstructorDetailScreen} />
<Stack.Screen name="MyEnrollments" component={MyEnrollmentsScreen} />
<Stack.Screen name="Lesson" component={LessonScreen} />
<Stack.Screen name="Review" component={ReviewScreen} />
<Stack.Screen name="AcademyNotifications" component={AcademyNotificationsScreen} />
<Stack.Screen name="InstructorProfile" component={InstructorProfileScreen} />
```

> **Note:** `UI_AGENT_CONTEXT.md` says do not change navigation, but adding new screens for a new feature is technically unavoidable.

---

## API Module: `src/api/academyNew.ts`

### Endpoints to implement

```typescript
// Public
GET  /academy/courses
GET  /academy/courses/:id
GET  /academy/courses/:id/reviews
GET  /academy/instructors
GET  /academy/instructors/:id

// Student
POST /academy/courses/:id/enroll
GET  /academy/student/enrollments
GET  /academy/courses/:id/progress
GET  /academy/courses/:id/chapters/:chapter/lessons/:lesson
POST /academy/lessons/:id/complete
POST /academy/courses/:id/reviews
PUT  /academy/courses/:id/reviews

// Notifications
GET  /academy/notifications
GET  /academy/notifications/unread-count
PUT  /academy/notifications/:id/read
PUT  /academy/notifications/read-all

// Instructor (read-only)
GET  /academy/instructor/profile
```

### Response format

```json
{ "success": true|false, "message": "...", "data": { ... } }
```

---

## Screen Specifications

### 1. AcademyCatalogScreen _(rewrite AcademyScreen)_

- Tabs: **Courses** | **Instructors**
- If user is active instructor, add tab: **My Teaching**
- Search, filter by specialization, pull-to-refresh, pagination

### 2. CourseDetailScreen

- Thumbnail, title, instructor, level, rating, students, lessons count
- Description
- Expandable chapter/lesson list
- Reviews section
- CTA: **Enroll** / **Continue** / **Login to Enroll**

### 3. InstructorDetailScreen

- Avatar, name, bio, specializations
- List of courses by instructor

### 4. MyEnrollmentsScreen

- Enrolled courses with progress percentage
- Continue learning button

### 5. LessonScreen

- Title + content (text + images)
- Mark as Complete button
- Previous/Next lesson navigation
- Completed badge

### 6. ReviewScreen

- Rating + comment input
- Submit or edit review
- Only accessible for enrolled students

### 7. AcademyNotificationsScreen

- List user notifications
- Mark read / read all
- Unread badge

### 8. InstructorProfileScreen

- Bio, specializations, avatar, status
- Link to "My Teaching"

---

## Reusable Components to Create

| Component        | Purpose                               |
| ---------------- | ------------------------------------- |
| `CourseCard`     | Display course in list/grid           |
| `InstructorCard` | Display instructor in list            |
| `LessonListItem` | Display lesson inside chapter         |
| `EnrollmentCard` | Display enrolled course with progress |

---

## Conventions to Follow

- **HTTP client:** existing fetch wrapper in `src/api/client.ts`
- **State:** local `useState` + `useFocusEffect`
- **Styling:** `StyleSheet.create` + theme tokens from `@/theme`
- **Components:** reuse `GlassCard`, `AppButton`, `Badge`, `Skeleton`, `EmptyState`
- **Icons:** `lucide-react-native`
- **Alerts:** `useCustomAlert()` — never `Alert.alert()`
- **Images:** follow `ArticleDetailScreen` pattern for server URL
- **SafeArea:** `SafeAreaView` with `edges={['top']}`

---

## Backend Status

| Component                                            | Status              |
| ---------------------------------------------------- | ------------------- |
| Academy API (`/api/academy/*`)                       | ✅ Ready & tested   |
| Admin web panel (approve/reject course & instructor) | ✅ Ready & deployed |
| Instructor web portal (CRUD course/chapter/lesson)   | ⏳ Not built yet    |
| Database migrations                                  | ✅ Applied          |

---

## Implementation Order

1. Create `src/types/academy.ts`
2. Create `src/api/academyNew.ts`
3. Update `src/types/navigation.ts`
4. Update `App.tsx`
5. Create reusable components in `src/components/academy/`
6. Rewrite `src/screens/AcademyScreen.tsx`
7. Create remaining screens
8. Add loading/empty/error states
9. End-to-end testing

---

## Constraints & Warnings

- ❌ DO NOT modify HomeScreen card
- ❌ DO NOT add bottom tab navigation items
- ❌ DO NOT modify auth flow, AuthContext, or login screens
- ❌ DO NOT modify existing `src/api/academy.ts` (Trader Academy legacy)
- ❌ DO NOT build video player or offline download for MVP
- ❌ DO NOT build admin screens in mobile
- ❌ DO NOT build instructor CRUD course/chapter/lesson in mobile

---

## Open Items (Phase 2)

- Build instructor web portal (course/chapter/lesson CRUD)
- Add push notifications for Academy events
- Add video lessons
