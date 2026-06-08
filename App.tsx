import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { Home, Zap, Users, BarChart2, User } from 'lucide-react-native';



// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import SignalScreen from './src/screens/SignalScreen';
import TradersScreen from './src/screens/TradersScreen';
import PortfolioScreen from './src/screens/PortfolioScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import PAMMScreen from './src/screens/PAMMScreen';
import NewsScreen from './src/screens/NewsScreen';


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
        tabBarIcon: ({ color, size }) => {
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

export default function App() {
  return (
    <View style={styles.wrapper}>
      <View style={styles.phone}>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Tabs" component={TabNavigator} />
            <Stack.Screen name="PAMM" component={PAMMScreen} />
            <Stack.Screen name="News" component={NewsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
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