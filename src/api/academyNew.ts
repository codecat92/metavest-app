import { BASE_URL, getToken } from './client';
import type {
  AcademyApiResponse,
  AcademyPaginatedResponse,
  AcademyNotification,
  CourseProgress,
  CourseListItem,
  CourseDetail,
  Enrollment,
  EnrollmentConfirmation,
  InstructorListItem,
  InstructorDetail,
  InstructorProfile,
  LessonWithProgress,
  LessonCompletion,
  Review,
  ReviewRequest,
  UnreadCount,
} from '@/types/academy';

// ── Internal fetch helper ──

/**
 * Thin wrapper that:
 *  - attaches Bearer token from auth store when available
 *  - prefixes `BASE_URL`
 *  - throws on network failure OR `success: false`
 */
async function academyFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  });

  const json = await res.json();

  if (!res.ok || json.success === false) {
    throw new Error(json.message || 'Request failed');
  }

  return json as T;
}

// ── Public API ──

export const academyNewApi = {
  // ── Public (no token required) ──

  /** List published courses — paginated */
  getCourses: (page = 1) =>
    academyFetch<AcademyPaginatedResponse<CourseListItem>>(
      `/academy/courses?page=${page}`,
    ),

  /** Single course detail */
  getCourse: (id: number) =>
    academyFetch<AcademyApiResponse<CourseDetail>>(`/academy/courses/${id}`),

  /** Course reviews — paginated */
  getCourseReviews: (courseId: number, page = 1) =>
    academyFetch<AcademyPaginatedResponse<Review>>(
      `/academy/courses/${courseId}/reviews?page=${page}`,
    ),

  /** List active instructors — paginated */
  getInstructors: (page = 1) =>
    academyFetch<AcademyPaginatedResponse<InstructorListItem>>(
      `/academy/instructors?page=${page}`,
    ),

  /** Single instructor detail */
  getInstructor: (id: number) =>
    academyFetch<AcademyApiResponse<InstructorDetail>>(
      `/academy/instructors/${id}`,
    ),

  // ── Student (token required) ──

  /** Enroll current user in a course */
  enroll: (courseId: number) =>
    academyFetch<AcademyApiResponse<EnrollmentConfirmation>>(
      `/academy/courses/${courseId}/enroll`,
      { method: 'POST' },
    ),

  /** All enrollments of current user — paginated */
  getEnrollments: (page = 1) =>
    academyFetch<AcademyPaginatedResponse<Enrollment>>(
      `/academy/student/enrollments?page=${page}`,
    ),

  /** Progress of current user in a course */
  getProgress: (courseId: number) =>
    academyFetch<AcademyApiResponse<CourseProgress>>(
      `/academy/courses/${courseId}/progress`,
    ),

  /** Single lesson (content + is_completed) */
  getLesson: (courseId: number, chapterId: number, lessonId: number) =>
    academyFetch<AcademyApiResponse<LessonWithProgress>>(
      `/academy/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`,
    ),

  /** Mark lesson as completed */
  completeLesson: (lessonId: number) =>
    academyFetch<AcademyApiResponse<LessonCompletion>>(
      `/academy/lessons/${lessonId}/complete`,
      { method: 'POST' },
    ),

  /** Submit a new course review */
  createReview: (courseId: number, body: ReviewRequest) =>
    academyFetch<AcademyApiResponse<Review>>(
      `/academy/courses/${courseId}/reviews`,
      { method: 'POST', body: JSON.stringify(body) },
    ),

  /** Update own review */
  updateReview: (courseId: number, body: ReviewRequest) =>
    academyFetch<AcademyApiResponse<Review>>(
      `/academy/courses/${courseId}/reviews`,
      { method: 'PUT', body: JSON.stringify(body) },
    ),

  // ── Notifications (token required) ──

  /** User Academy notifications — paginated */
  getNotifications: (page = 1) =>
    academyFetch<AcademyPaginatedResponse<AcademyNotification>>(
      `/academy/notifications?page=${page}`,
    ),

  /** Unread count badge */
  getUnreadCount: () =>
    academyFetch<AcademyApiResponse<UnreadCount>>(
      '/academy/notifications/unread-count',
    ),

  /** Mark a single notification as read */
  markRead: (id: number) =>
    academyFetch<AcademyApiResponse<AcademyNotification>>(
      `/academy/notifications/${id}/read`,
      { method: 'PUT' },
    ),

  /** Mark all notifications as read */
  markAllRead: () =>
    academyFetch<AcademyApiResponse<null>>(
      '/academy/notifications/read-all',
      { method: 'PUT' },
    ),

  // ── Instructor (token required) ──

  /** Instructor's own profile — view only */
  getInstructorProfile: () =>
    academyFetch<AcademyApiResponse<InstructorProfile>>(
      '/academy/instructor/profile',
    ),
};
