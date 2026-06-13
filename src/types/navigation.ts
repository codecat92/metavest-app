import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  OTP: { userId: string; email: string; type: string };
  Tabs: undefined;
  PAMM: undefined;
  News: undefined;
  SignalDetail: { signalId: number };
  Forum: undefined;
  CopyTrade: undefined;
  Market: undefined;
  Academy: undefined;
  EditProfile: undefined;
  ArticleDetail: undefined;
  EconomicsCalendar: undefined;
  Notifications: undefined;
  Brokers: undefined;
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
