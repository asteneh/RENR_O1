export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  location: string;
  type: 'Sale' | 'Rent';
  specs: string;
}

export interface CartItem extends Product {
  quantity: number;
}