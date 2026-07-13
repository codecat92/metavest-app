import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { Article } from '@/api/news';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  OTP: { userId: string; email: string; type: string };
  Tabs: undefined;
  PAMM: undefined;
  PAMMDetail: { brokerId: number };
  News: undefined;
  SignalDetail: { signalId: number };
  Forum: undefined;
  CopyTrade: undefined;
  Market: undefined;
  Academy: undefined;
  EditProfile: undefined;
  ArticleDetail: { article: Article };
  WebView: { url: string; title?: string };
  EconomicsCalendar: undefined;
  Notifications: undefined;
  Brokers: undefined;
  AcademyCatalog: undefined;
  CourseDetail: { courseId: number };
  InstructorDetail: { instructorId: number };
  MyEnrollments: undefined;
  Lesson: {
    courseId: number;
    chapterId: number;
    lessonId: number;
    allLessons: { lessonId: number; chapterId: number }[];
  };
  Review: { courseId: number };
  AcademyNotifications: undefined;
  InstructorProfile: undefined;
  ApplyInstructor: undefined;
  CreateSignal: { signalId?: number } | undefined;
  MySignals: undefined;
  ReferralList: undefined;
};

export type TabParamList = {
  Home: undefined;
  Signals: undefined;
  Traders: undefined;
  Portfolio: undefined;
  Profile: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<TabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;
