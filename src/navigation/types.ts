import { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Home: { filter?: string };
  Category: undefined;
  Post: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  ProductDetails: { product: any };
  PostProperty: undefined;
  SignUp: undefined;
  Login: undefined;
  Profile: undefined; // Move Profile to Stack
  Search: undefined;
  Filter: undefined;
  SearchResults: {
    query?: string;
    filters?: any;
  };
};