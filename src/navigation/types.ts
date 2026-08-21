import { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Home: { filter?: string; filterId?: string; filterName?: string };
  JobsTab: undefined;
  Requests: undefined;
  Post: undefined;
  Account: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  Category: undefined;
  ProductDetails: { product: any };
  Cart: undefined;
  PostProperty: { allowedTransactionTypes?: ('rent' | 'sale')[] } | undefined;
  SignUp: { refCode?: string } | undefined;
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
  OtpVerifyRegistration: { phone: string; verificationId: string };
  ResetPassword: { phone: string };
  Favorites: undefined;
  Messages: undefined;
  Chat: { conversation: any };
  Notification: undefined;
  PostRequest: { allowedRequestTypes?: ('buy' | 'rent')[] } | undefined;
  SupplierHome: undefined;
  EditProfile: undefined;
  MyListings: undefined;
  Followings: undefined;
  Followers: undefined;
  MyRequests: undefined;
  MyJobs: { mode?: 'applied' | 'posted' } | undefined;
  MyPackages: { selectedPlan?: any; txRef?: string; serviceType?: string; returnTo?: string } | undefined;
  OperatorRegistration: undefined;
  EditOperatorProfile: { operatorId: string };
  EditListing: { productId: string };
  TermsAndPrivacy: undefined;
  PostJob: { job?: any } | undefined;
  JobApplicants: { jobId: string; jobTitle?: string };
  AppSettings: undefined;
  Feedback: undefined;
};
