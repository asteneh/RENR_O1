export type TabParamList = {
  Home: undefined;
  Cart: undefined;
  Login: undefined; 
  Profile: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  ProductDetails: { product: any };
  PostProperty: undefined;   
  SignUp: undefined;      
  Login: undefined;   
  Search: undefined;         
  Filter: undefined;        
  SearchResults: {          
    query?: string; 
    filters?: any; 
  };   
};