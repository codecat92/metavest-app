import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Home, Zap, Users, BarChart2, User } from 'lucide-react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AlertProvider } from './src/context/AlertContext';



// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import SignalScreen from './src/screens/SignalScreen';
import TradersScreen from './src/screens/TradersScreen';
import PortfolioScreen from './src/screens/PortfolioScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import PAMMScreen from './src/screens/PAMMScreen';
import NewsScreen from './src/screens/NewsScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import SignalDetailScreen from './src/screens/SignalDetailScreen';
import ForumScreen from './src/screens/ForumScreen';
import CopyTradeScreen from './src/screens/CopyTradeScreen';
import MarketScreen from './src/screens/MarketScreen';
import AcademyScreen from './src/screens/AcademyScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import ArticleDetailScreen from './src/screens/ArticleDetailScreen';
import EconomicsCalendarScreen from './src/screens/EconomicsCalendarScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import BrokersScreen from './src/screens/BrokersScreen';



const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#0E1439',
        borderTopColor: 'rgba(201,168,76,0.2)',
        height: 68,
        paddingBottom: 10,
        paddingTop: 8,
      },
      tabBarActiveTintColor: '#C9A84C',
      tabBarInactiveTintColor: '#8899AA',
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
      },
      tabBarIcon: ({ color }) => {
        const icons: Record<string, any> = {
          Home: Home,
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
      <View style={{ flex: 1, backgroundColor: '#0E1439', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#AB4BFF" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={isLoggedIn ? 'Tabs' : 'Login'}
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0E1439' } }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="PAMM" component={PAMMScreen} />
      <Stack.Screen name="News" component={NewsScreen} />
      <Stack.Screen name="SignalDetail" component={SignalDetailScreen} />
      <Stack.Screen name="Forum" component={ForumScreen} />
      <Stack.Screen name="CopyTrade" component={CopyTradeScreen} />
      <Stack.Screen name="Market" component={MarketScreen} />
      <Stack.Screen name="Academy" component={AcademyScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
      <Stack.Screen name="EconomicsCalendar" component={EconomicsCalendarScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Brokers" component={BrokersScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <View style={styles.wrapper}>
      <View style={styles.phone}>
        <AlertProvider>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
        </AlertProvider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#060910',
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  phone: {
    width: 393,
    height: '100%',
    overflow: 'hidden',
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
  },
});