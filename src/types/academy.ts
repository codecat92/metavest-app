// ============================================================
// Metavest Academy — TypeScript Types
// Backend response shape: { success: boolean, message: string, data: T }
// ============================================================

// ── String literal types (DB integer → string via accessor) ──

export type CourseStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'archived'
  | 'rejected';

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

export type InstructorStatus =
  | 'pending'
  | 'active'
  | 'suspended'
  | 'rejected';

export type NotificationType =
  | 'instructor_approved'
  | 'instructor_rejected'
  | 'course_approved'
  | 'course_rejected'
  | 'new_instructor_request'
  | 'new_course_request';

// ── API response wrappers ──

export type AcademyApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type AcademyPaginatedResponse<T> = AcademyApiResponse<{
  items: T[];
  pagination: AcademyPagination;
}>;

export type AcademyPagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type AcademyErrorResponse = {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
};

// ── Base models (database structure) ──

export type Specialization = {
  id: number;
  name: string;
};

export type Chapter = {
  id: number;
  course_id: number;
  title: string;
  order: number;
};

export type Lesson = {
  id: number;
  chapter_id: number;
  title: string;
  content: string;
  cover_image: string | null;
  cover_image_url: string | null;
  order: number;
  read_time_minutes: number;
};

// ── API response types ──

/** Instructor snippet inside a course card */
export type CourseInstructor = {
  id: number;
  name: string;
  avatar_url: string | null;
};

/** Course in a list (paginated / catalog) */
export type CourseListItem = {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string | null;
  level: CourseLevel;
  specialization: string;
  instructor: CourseInstructor;
  average_rating: number;
  total_students: number;
  total_lessons: number;
  published_at: string | null;
};

/** Chapter with lessons (course detail) */
export type ChapterDetail = Chapter & {
  lessons: (Lesson & { is_completed?: boolean })[];
};

/** Instructor detail in course detail */
export type CourseDetailInstructor = CourseInstructor & {
  bio: string;
};

/** Full course detail (single course endpoint) */
export type CourseDetail = CourseListItem & {
  instructor: CourseDetailInstructor;
  chapters: ChapterDetail[];
};

/** Instructor in a list (paginated / catalog) */
export type InstructorListItem = {
  id: number;
  name: string;
  avatar_url: string | null;
  bio: string;
  specializations: Specialization[];
  average_rating: number;
  total_courses: number;
  total_students: number;
};

/** Full instructor detail */
export type InstructorDetail = InstructorListItem & {
  status: InstructorStatus;
  verified_at: string | null;
  courses: CourseListItem[];
};

/** Review */
export type Review = {
  id: number;
  rating: number;
  comment: string | null;
  reviewer_name: string;
  reviewer_avatar?: string | null;
  created_at: string;
};

/** Enrollment */
export type Enrollment = {
  id: number;
  course: CourseListItem;
  progress_percentage: number;
  enrolled_at: string;
  completed_at: string | null;
};

/** Lesson with completion status (student view) */
export type LessonWithProgress = Lesson & {
  is_completed: boolean;
};

/** Course progress (student view) */
export type CourseProgress = {
  progress_percentage: number;
  lessons: (Lesson & {
    chapter_id: number;
    is_completed: boolean;
  })[];
};

/** Academy notification */
export type AcademyNotification = {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

/** Unread count */
export type UnreadCount = {
  count: number;
};

/** Instructor profile (instructor's own view) */
export type InstructorProfile = {
  id: number;
  name: string;
  avatar_url: string | null;
  bio: string;
  status: InstructorStatus;
  verified_at: string | null;
  specializations: Specialization[];
  average_rating: number;
  total_courses: number;
  total_students: number;
  courses: CourseListItem[];
};

/** Enrollment confirmation (after POST /enroll) */
export type EnrollmentConfirmation = {
  id: number;
  user_id: string;
  course_id: number;
  enrolled_at: string;
  created_at: string;
  updated_at: string;
};

/** Lesson completion confirmation */
export type LessonCompletion = {
  lesson: Pick<Lesson, 'id' | 'title' | 'cover_image_url' | 'order' | 'read_time_minutes'>;
  completed_at: string;
};

// ── Request types ──

export type ReviewRequest = {
  rating: number;
  comment?: string | null;
};

export type InstructorProfileRequest = {
  bio: string;
  specialization_ids: number[];
  avatar?: string;
};
