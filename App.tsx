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
import { colors } from '@/theme';
import type { RootStackParamList, TabParamList } from '@/types/navigation';

import LoginScreen from '@/screens/LoginScreen';
import HomeScreen from '@/screens/HomeScreen';
import SignalScreen from '@/screens/SignalScreen';
import TradersScreen from '@/screens/TradersScreen';
import PortfolioScreen from '@/screens/PortfolioScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import PAMMScreen from '@/screens/PAMMScreen';
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
import EconomicsCalendarScreen from '@/screens/EconomicsCalendarScreen';
import NotificationsScreen from '@/screens/NotificationsScreen';
import BrokersScreen from '@/screens/BrokersScreen';
import OTPScreen from '@/screens/OTPScreen';

SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(14,20,57,0.92)',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent.gold,
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

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg.primary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.accent.purple} />
      </View>
    );
  }

  return (
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
      <Stack.Screen name="News" component={NewsScreen} />
      <Stack.Screen name="SignalDetail" component={SignalDetailScreen} />
      <Stack.Screen name="Forum" component={ForumScreen} />
      <Stack.Screen name="CopyTrade" component={CopyTradeScreen} />
      <Stack.Screen name="Market" component={MarketScreen} />
      <Stack.Screen name="Academy" component={AcademyScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
      <Stack.Screen name="EconomicsCalendar" component={EconomicsCalendarScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Brokers" component={BrokersScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk: require('./assets/fonts/SpaceGrotesk-Regular.ttf'),
    'SpaceGrotesk-Medium': require('./assets/fonts/SpaceGrotesk-Medium.ttf'),
    'SpaceGrotesk-SemiBold': require('./assets/fonts/SpaceGrotesk-SemiBold.ttf'),
    'SpaceGrotesk-Bold': require('./assets/fonts/SpaceGrotesk-Bold.ttf'),
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
          <AuthProvider>
            <NavigationContainer>
              <StatusBar style="light" />
              <RootNavigator />
            </NavigationContainer>
          </AuthProvider>
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
