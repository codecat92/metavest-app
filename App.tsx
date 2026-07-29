import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Home, Zap, Users, BarChart2, User } from 'lucide-react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AlertProvider } from '@/context/AlertContext';
import { ThemeProvider, colors, useTheme } from '@/theme';
import type { RootStackParamList, TabParamList } from '@/types/navigation';

import LoginScreen from '@/screens/LoginScreen';
import HomeScreen from '@/screens/HomeScreen';
import SignalScreen from '@/screens/SignalScreen';
import TradersScreen from '@/screens/TradersScreen';
import PortfolioScreen from '@/screens/PortfolioScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import PAMMScreen from '@/screens/PAMMScreen';
import PAMMDetailScreen from '@/screens/PAMMDetailScreen';
import PAMMKycScreen from '@/screens/PAMMKycScreen';
import KYCFinancialScreen from '@/screens/KYCFinancialScreen';
import DepositQuestionsScreen from '@/screens/DepositQuestionsScreen';
import NewsScreen from '@/screens/NewsScreen';
import RegisterScreen from '@/screens/RegisterScreen';
import SignalDetailScreen from '@/screens/SignalDetailScreen';
import ForumScreen from '@/screens/ForumScreen';
import CopyTradeScreen from '@/screens/CopyTradeScreen';
import MarketScreen from '@/screens/MarketScreen';
import AcademyScreen from '@/screens/AcademyScreen';
import ForgotPasswordScreen from '@/screens/ForgotPasswordScreen';
import EditProfileScreen from '@/screens/EditProfileScreen';
import ArticleDetailScreen from '@/screens/ArticleDetailScreen';
import WebViewScreen from '@/screens/WebViewScreen';
import EconomicsCalendarScreen from '@/screens/EconomicsCalendarScreen';
import NotificationsScreen from '@/screens/NotificationsScreen';
import BrokersScreen from '@/screens/BrokersScreen';
import OTPScreen from '@/screens/OTPScreen';
import CourseDetailScreen from '@/screens/academy/CourseDetailScreen';
import LessonScreen from '@/screens/academy/LessonScreen';
import MyEnrollmentsScreen from '@/screens/academy/MyEnrollmentsScreen';
import ReviewScreen from '@/screens/academy/ReviewScreen';
import InstructorDetailScreen from '@/screens/academy/InstructorDetailScreen';
import AcademyNotificationsScreen from '@/screens/academy/AcademyNotificationsScreen';
import ApplyInstructorScreen from '@/screens/academy/ApplyInstructorScreen';
import CreateSignalScreen from '@/screens/trader/CreateSignalScreen';
import MySignalsScreen from '@/screens/trader/MySignalsScreen';
import ReferralListScreen from '@/screens/ReferralListScreen';
import TraderDetailScreen from '@/screens/TraderDetailScreen';
import MyRankScreen from '@/screens/MyRankScreen';

SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabNavigator() {
  const { isDark } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? 'rgba(14,20,57,0.92)' : '#E8EDF8',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent.purple,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color }) => {
          const icons: Record<string, React.ComponentType<{ size: number; color: string; strokeWidth: number }>> = {
            Home,
            Signals: Zap,
            Traders: Users,
            Portfolio: BarChart2,
            Profile: User,
          };
          const Icon = icons[route.name];
          return Icon ? <Icon size={20} color={color} strokeWidth={1.8} /> : null;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Signals" component={SignalScreen} />
      <Tab.Screen name="Traders" component={TradersScreen} />
      <Tab.Screen name="Portfolio" component={PortfolioScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { isLoggedIn, isLoading } = useAuth();
  const { isDark } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg.primary, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ActivityIndicator size="large" color={colors.accent.purple} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack.Navigator
        initialRouteName={isLoggedIn ? 'Tabs' : 'Login'}
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg.primary } }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="OTP" component={OTPScreen} />
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen name="PAMM" component={PAMMScreen} />
        <Stack.Screen name="PAMMDetail" component={PAMMDetailScreen} />
        <Stack.Screen name="PAMMKyc" component={PAMMKycScreen} />
        <Stack.Screen name="KYCFinancial" component={KYCFinancialScreen} />
        <Stack.Screen name="DepositQuestions" component={DepositQuestionsScreen} />
        <Stack.Screen name="News" component={NewsScreen} />
        <Stack.Screen name="SignalDetail" component={SignalDetailScreen} />
        <Stack.Screen name="Forum" component={ForumScreen} />
        <Stack.Screen name="CopyTrade" component={CopyTradeScreen} />
        <Stack.Screen name="Market" component={MarketScreen} />
        <Stack.Screen name="Academy" component={AcademyScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
        <Stack.Screen name="WebView" component={WebViewScreen} />
        <Stack.Screen name="EconomicsCalendar" component={EconomicsCalendarScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Brokers" component={BrokersScreen} />
        <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
        <Stack.Screen name="Lesson" component={LessonScreen} />
        <Stack.Screen name="MyEnrollments" component={MyEnrollmentsScreen} />
        <Stack.Screen name="Review" component={ReviewScreen} />
        <Stack.Screen name="InstructorDetail" component={InstructorDetailScreen} />
        <Stack.Screen name="AcademyNotifications" component={AcademyNotificationsScreen} />
        <Stack.Screen name="ApplyInstructor" component={ApplyInstructorScreen} />
        <Stack.Screen name="CreateSignal" component={CreateSignalScreen} />
        <Stack.Screen name="MySignals" component={MySignalsScreen} />
        <Stack.Screen name="ReferralList" component={ReferralListScreen} />
        <Stack.Screen name="TraderDetail" component={TraderDetailScreen} />
        <Stack.Screen name="MyRank" component={MyRankScreen} />
      </Stack.Navigator>
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope: require('./assets/fonts/Manrope-Regular.ttf'),
    'Manrope-Medium': require('./assets/fonts/Manrope-Medium.ttf'),
    'Manrope-SemiBold': require('./assets/fonts/Manrope-SemiBold.ttf'),
    'Manrope-Bold': require('./assets/fonts/Manrope-Bold.ttf'),
    DMSans: require('./assets/fonts/DMSans-Regular.ttf'),
    'DMSans-Medium': require('./assets/fonts/DMSans-Medium.ttf'),
    'DMSans-SemiBold': require('./assets/fonts/DMSans-SemiBold.ttf'),
    'DMSans-Bold': require('./assets/fonts/DMSans-Bold.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.root} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <AlertProvider>
          <ThemeProvider>
            <AuthProvider>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </AuthProvider>
          </ThemeProvider>
        </AlertProvider>
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.deep,
  },
});
