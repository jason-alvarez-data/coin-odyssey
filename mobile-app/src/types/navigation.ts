// src/types/navigation.ts
import { NavigatorScreenParams } from '@react-navigation/native';

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
  Dashboard: undefined;
  Collection: NavigatorScreenParams<CollectionStackParamList>;
  Camera: undefined;
  Analytics: undefined;
  Profile: undefined;
};

export type CollectionStackParamList = {
  CollectionList: undefined;
  CoinDetail: { coinId: string };
  AddCoin: undefined;
  EditCoin: { coinId: string };
};