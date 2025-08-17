// src/types/navigation.ts
import { NavigatorScreenParams } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: NavigatorScreenParams<DashboardStackParamList>;
  Collection: NavigatorScreenParams<CollectionStackParamList>;
  AddCoin: undefined;
  Analytics: undefined;
  Profile: undefined;
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
  Map: undefined;
};

export type CollectionStackParamList = {
  CollectionList: undefined;
  CoinDetail: { 
    coin: any; // Coin type
  };
  AddCoin: undefined;
  EditCoin: { coinId: string };
};

// Screen props types
export type RootStackScreenProps<T extends keyof RootStackParamList> = StackScreenProps<
  RootStackParamList,
  T
>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = StackScreenProps<
  AuthStackParamList,
  T
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = BottomTabScreenProps<
  MainTabParamList,
  T
>;

export type CollectionStackScreenProps<T extends keyof CollectionStackParamList> = StackScreenProps<
  CollectionStackParamList,
  T
>;

export type DashboardStackScreenProps<T extends keyof DashboardStackParamList> = StackScreenProps<
  DashboardStackParamList,
  T
>;