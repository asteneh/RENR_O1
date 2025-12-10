// src/constants/data.ts
import { Product } from '../types';

export const MACHINES: Product[] = [
  {
    id: '1',
    name: 'Caterpillar 320D Excavator',
    price: 8500000,
    location: 'Kality, Addis Ababa',
    type: 'Sale', // For Sale
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: 'Heavy duty CAT excavator in excellent condition.',
    specs: '2018 | 22 Tons',
  },
  {
    id: '2',
    name: 'Komatsu D85 Dozer',
    price: 45000, // Monthly Rent
    location: 'Bole, Addis Ababa',
    type: 'Rent', // For Rent
    image: 'https://images.unsplash.com/photo-1520106212299-d99c443e4568?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: 'Powerful dozer ready for construction sites.',
    specs: '2020 | 250 HP',
  },
  {
    id: '3',
    name: 'JCB 3CX Backhoe Loader',
    price: 4200000,
    location: 'Adama, Ethiopia',
    type: 'Sale',
    image: 'https://plus.unsplash.com/premium_photo-1661909858385-f5b2b2a61e38?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: 'Versatile backhoe loader.',
    specs: '2019 | 4x4',
  },
  {
    id: '4',
    name: 'Volvo Motor Grader',
    price: 60000,
    location: 'Gondar',
    type: 'Rent',
    image: 'https://images.unsplash.com/photo-1626727650391-7663e2363577?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: 'Precision grading machine.',
    specs: '2021 | 14ft Blade',
  },
  {
    id: '5',
    name: 'SANY Truck Crane',
    price: 12500000,
    location: 'Lebu, Addis Ababa',
    type: 'Sale',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: '50 Ton lifting capacity.',
    specs: '2022 | 50 Ton',
  },
];