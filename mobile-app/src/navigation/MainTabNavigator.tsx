// src/navigation/MainTabNavigator.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, GlassmorphismStyles, Spacing } from '../styles';
import { MainTabParamList } from '../types/navigation';

// Import screens and navigators
import DashboardNavigator from './DashboardNavigator';
import CollectionNavigator from './CollectionNavigator';
import AddCoinScreen from '../screens/collection/AddCoinScreen';
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

interface TabBarIconProps {
  routeName: string;
  focused: boolean;
}

const TabBarIcon: React.FC<TabBarIconProps> = ({ routeName, focused }) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'Dashboard': return '🏠';
      case 'Collection': return '🪙';
      case 'AddCoin': return '➕';
      case 'Analytics': return '📊';
      case 'Profile': return '👤';
      default: return '•';
    }
  };

  return (
    <Text style={[
      styles.tabIcon,
      { color: focused ? '#000' : Colors.text.primary }
    ]}>
      {getIcon(routeName)}
    </Text>
  );
};

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const CustomTabBar: React.FC<CustomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <BlurView 
      intensity={80} 
      style={[
        styles.tabBarContainer,
        { 
          bottom: insets.bottom + 10,
          paddingBottom: Math.max(insets.bottom / 2, 8),
        }
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined 
          ? options.tabBarLabel 
          : options.title !== undefined 
          ? options.title 
          : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={[
              styles.tabItem,
              isFocused && styles.tabItemFocused,
            ]}
          >
            <TabBarIcon routeName={route.name} focused={isFocused} />
            <Text style={[
              styles.tabLabel,
              { color: isFocused ? '#000' : Colors.text.primary }
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </BlurView>
  );
};

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Dashboard"
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardNavigator}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="Collection" 
        component={CollectionNavigator}
        options={{ tabBarLabel: 'Collection' }}
      />
      <Tab.Screen 
        name="AddCoin" 
        component={AddCoinScreen}
        options={{ tabBarLabel: 'Add Coin' }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{ tabBarLabel: 'Analytics' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    ...GlassmorphismStyles.navigation,
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.lg,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: 15,
    minHeight: 56,
    justifyContent: 'center',
  },
  tabItemFocused: {
    backgroundColor: Colors.primary.gold,
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});