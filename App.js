import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#050505', padding: 24 }}>
          <Text style={{ color: '#ff5555', fontSize: 16, fontWeight: '700', marginTop: 60 }}>
            ❌ Runtime Error
          </Text>
          <Text style={{ color: '#ffffff', fontSize: 13, marginTop: 12, fontFamily: 'monospace' }}>
            {this.state.error.toString()}
          </Text>
          <Text style={{ color: '#888', fontSize: 11, marginTop: 12, fontFamily: 'monospace' }}>
            {this.state.error.stack}
          </Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}
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
import LanguageScreen from './src/screens/settings/LanguageScreen';
import PrivacyScreen from './src/screens/settings/PrivacyScreen';
import PlaybackScreen from './src/screens/settings/PlaybackScreen';
import ColorSchemeScreen from './src/screens/settings/ColorSchemeScreen';
import IntegrationsScreen from './src/screens/settings/IntegrationsScreen';
import StorageScreen from './src/screens/settings/StorageScreen';
import HotkeysScreen from './src/screens/settings/HotkeysScreen';

import { colors } from './src/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ name, focused }) {
  const icons = {
    Home: focused ? 'home' : 'home-outline',
    Search: focused ? 'search' : 'search-outline',
    Community: focused ? 'people' : 'people-outline',
    Library: focused ? 'musical-notes' : 'musical-notes-outline',
    Settings: focused ? 'settings' : 'settings-outline',
  };
  return (
    <Ionicons
      name={icons[name]}
      size={22}
      color={focused ? colors.text : colors.text35}
    />
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.text06,
          borderTopWidth: 0.5,
          height: 84,
          paddingBottom: 28,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.text35,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          letterSpacing: 0.2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Главная', tabBarIcon: ({ focused }) => <TabIcon name="Home" focused={focused} /> }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ tabBarLabel: 'Поиск', tabBarIcon: ({ focused }) => <TabIcon name="Search" focused={focused} /> }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{ tabBarLabel: 'Сообщество', tabBarIcon: ({ focused }) => <TabIcon name="Community" focused={focused} /> }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{ tabBarLabel: 'Библиотека', tabBarIcon: ({ focused }) => <TabIcon name="Library" focused={focused} /> }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Настройки', tabBarIcon: ({ focused }) => <TabIcon name="Settings" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="Player"
            component={PlayerScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="ArtistDetail" component={ArtistDetailScreen} />
          <Stack.Screen name="AlbumDetail" component={AlbumDetailScreen} />
          <Stack.Screen name="PlaylistDetail" component={PlaylistDetailScreen} />
          <Stack.Screen name="Charts" component={ChartsScreen} />
          <Stack.Screen name="Language" component={LanguageScreen} />
          <Stack.Screen name="Privacy" component={PrivacyScreen} />
          <Stack.Screen name="Playback" component={PlaybackScreen} />
          <Stack.Screen name="ColorScheme" component={ColorSchemeScreen} />
          <Stack.Screen name="Integrations" component={IntegrationsScreen} />
          <Stack.Screen name="Storage" component={StorageScreen} />
          <Stack.Screen name="Hotkeys" component={HotkeysScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
    </ErrorBoundary>
  );
}
