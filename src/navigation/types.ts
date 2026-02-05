import { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Home: { filter?: string };
  JobsTab: undefined;
  Category: undefined;
  Post: undefined;
  Account: undefined;
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
  Jobs: undefined;
  ForgotPassword: undefined;
  VerifyPhone: { phone: string; verificationId: string };
  ResetPassword: { phone: string };
  Favorites: undefined;
  Messages: undefined;
  Chat: { conversation: any };
  Notification: undefined;
  PostRequest: undefined;
  SupplierHome: undefined;
  EditProfile: undefined;
  MyListings: undefined;
  Followings: undefined;
  MyRequests: undefined;
  MyJobs: undefined;
  MyPackages: undefined;
  OperatorRegistration: undefined;
};