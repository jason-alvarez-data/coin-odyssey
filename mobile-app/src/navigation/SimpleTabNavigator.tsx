// src/navigation/SimpleTabNavigator.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../styles';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import CollectionListScreen from '../screens/collection/CollectionListScreen';
import CameraScreen from '../screens/camera/CameraScreen';
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

const TabBarIcon = ({ routeName, focused }: { routeName: string; focused: boolean }) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'Dashboard': return '🏠';
      case 'Collection': return '🪙';
      case 'Camera': return '📸';
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
      <Tab.Screen name="Collection" component={CollectionListScreen} />
      <Tab.Screen name="Camera" component={CameraScreen} />
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
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.background.cardBorder,
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