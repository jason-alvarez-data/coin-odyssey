// src/navigation/SimpleTabNavigator.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../styles';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import CollectionNavigator from './CollectionNavigator';
import AddCoinScreen from '../screens/collection/AddCoinScreen';
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

const TabBarIcon = ({ routeName, focused }: { routeName: string; focused: boolean }) => {
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

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.tabBarContainer,
      { 
        bottom: insets.bottom + 10,
        paddingBottom: Math.max(insets.bottom / 2, 8),
      }
    ]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          if (!isFocused) {
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
    </View>
  );
};

export default function SimpleTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="Dashboard"
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Collection" component={CollectionNavigator} />
      <Tab.Screen 
        name="AddCoin" 
        component={AddCoinScreen}
        options={{ tabBarLabel: 'Add Coin' }}
      />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    height: 80,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.lg,
    backgroundColor: 'rgba(15, 15, 35, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
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