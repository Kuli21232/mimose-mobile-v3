import React, { useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PlayerScreen from './src/screens/PlayerScreen';
import ArtistDetailScreen from './src/screens/ArtistDetailScreen';
import AlbumDetailScreen from './src/screens/AlbumDetailScreen';
import PlaylistDetailScreen from './src/screens/PlaylistDetailScreen';
import ChartsScreen from './src/screens/ChartsScreen';
import MessengerScreen from './src/screens/MessengerScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RoomScreen from './src/screens/RoomScreen';
import LanguageScreen from './src/screens/settings/LanguageScreen';
import PrivacyScreen from './src/screens/settings/PrivacyScreen';
import PlaybackScreen from './src/screens/settings/PlaybackScreen';
import ColorSchemeScreen from './src/screens/settings/ColorSchemeScreen';
import IntegrationsScreen from './src/screens/settings/IntegrationsScreen';
import StorageScreen from './src/screens/settings/StorageScreen';
import HotkeysScreen from './src/screens/settings/HotkeysScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

import useAuthStore from './src/store/authStore';
import useSettingsStore from './src/store/settingsStore';
import useSocialStore from './src/store/socialStore';
import { useAppTheme } from './src/theme';
import { useI18n } from './src/i18n';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    const { theme } = this.props;

    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: theme.bg, padding: 24 }}>
          <Text style={{ color: theme.error, fontSize: 16, fontWeight: '700', marginTop: 60 }}>
            Runtime Error
          </Text>
          <Text style={{ color: theme.text, fontSize: 13, marginTop: 12, fontFamily: 'monospace' }}>
            {this.state.error.toString()}
          </Text>
          <Text style={{ color: theme.text40, fontSize: 11, marginTop: 12, fontFamily: 'monospace' }}>
            {this.state.error.stack}
          </Text>
        </ScrollView>
      );
    }

    return this.props.children;
  }
}

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ name, focused, theme }) {
  const icons = {
    Home: focused ? 'home' : 'home-outline',
    Search: focused ? 'search' : 'search-outline',
    Community: focused ? 'people' : 'people-outline',
    Library: focused ? 'musical-notes' : 'musical-notes-outline',
    Settings: focused ? 'settings' : 'settings-outline',
  };

  return (
    <Ionicons name={icons[name]} size={22} color={focused ? theme.accent : theme.text35} />
  );
}

function MainTabs() {
  const theme = useAppTheme();
  const { strings } = useI18n();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.glassBorderStrong,
          borderTopWidth: 0.5,
          height: 84,
          paddingBottom: 28,
          paddingTop: 10,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.text35,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.2 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: strings.tabs.home, tabBarIcon: ({ focused }) => <TabIcon name="Home" focused={focused} theme={theme} /> }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ tabBarLabel: strings.tabs.search, tabBarIcon: ({ focused }) => <TabIcon name="Search" focused={focused} theme={theme} /> }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{ tabBarLabel: strings.tabs.community, tabBarIcon: ({ focused }) => <TabIcon name="Community" focused={focused} theme={theme} /> }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{ tabBarLabel: strings.tabs.library, tabBarIcon: ({ focused }) => <TabIcon name="Library" focused={focused} theme={theme} /> }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: strings.tabs.settings, tabBarIcon: ({ focused }) => <TabIcon name="Settings" focused={focused} theme={theme} /> }}
      />
    </Tab.Navigator>
  );
}

function AuthNavigator() {
  const theme = useAppTheme();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const theme = useAppTheme();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Player" component={PlayerScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="ArtistDetail" component={ArtistDetailScreen} />
      <Stack.Screen name="AlbumDetail" component={AlbumDetailScreen} />
      <Stack.Screen name="PlaylistDetail" component={PlaylistDetailScreen} />
      <Stack.Screen name="Charts" component={ChartsScreen} />
      <Stack.Screen name="Messenger" component={MessengerScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Room" component={RoomScreen} />
      <Stack.Screen name="Language" component={LanguageScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="Playback" component={PlaybackScreen} />
      <Stack.Screen name="ColorScheme" component={ColorSchemeScreen} />
      <Stack.Screen name="Integrations" component={IntegrationsScreen} />
      <Stack.Screen name="Storage" component={StorageScreen} />
      <Stack.Screen name="Hotkeys" component={HotkeysScreen} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const theme = useAppTheme();
  const initAuth = useAuthStore((state) => state.init);
  const authLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const settingsReady = useSettingsStore((state) => state.isReady);
  const initSettings = useSettingsStore((state) => state.init);
  const initSocial = useSocialStore((state) => state.init);
  const resetSocial = useSocialStore((state) => state.reset);

  useEffect(() => {
    initAuth();
    initSettings();
  }, [initAuth, initSettings]);

  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated && user) {
      initSocial(user);
      return;
    }

    resetSocial();
  }, [authLoading, initSocial, isAuthenticated, resetSocial, user]);

  if (authLoading || !settingsReady) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="leaf-outline" size={32} color={theme.accentMuted} />
        <ActivityIndicator color={theme.accentMuted} style={{ marginTop: 20 }} />
      </View>
    );
  }

  return isAuthenticated ? <AppNavigator /> : <AuthNavigator />;
}

function ThemedApp() {
  const theme = useAppTheme();

  const navigationTheme = {
    ...NavigationDarkTheme,
    colors: {
      ...NavigationDarkTheme.colors,
      background: theme.bg,
      card: theme.tabBar,
      text: theme.text,
      primary: theme.accent,
      border: theme.glassBorderStrong,
      notification: theme.accent,
    },
  };

  return (
    <ErrorBoundary theme={theme}>
      <SafeAreaProvider>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

export default function App() {
  return <ThemedApp />;
}
