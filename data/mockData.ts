export interface Salesperson {
  id: string;
  name: string;
  nameEn: string;
  email: string;
  mobile: string;
  status: 'ACTIVE' | 'INACTIVE';
  todayVisits: number;
  todayOrders: number;
  assignedVillages: string[];
}

export interface Village {
  id: string;
  marathiName: string;
  englishName: string;
  taluka: string;
  district: string;
  shopsCount: number;
  visitsToday: number;
  ordersToday: number;
}

export interface Shop {
  id: string;
  name: string;
  nameEn: string;
  owner: string;
  ownerEn: string;
  mobile: string;
  villageId: string;
  address: string;
  addressEn: string;
  outstandingBalance: number;
}

export interface OrderItem {
  name: string;
  quantity: number;
  unit: string;
}

export interface Order {
  id: string;
  salespersonId: string;
  villageId: string;
  shopId: string;
  transcribedText: string;
  items: OrderItem[];
  status: 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
}

export const INITIAL_SALESPERSONS: Salesperson[] = [
  {
    id: 'sp-1',
    name: 'अमोल पाटील',
    nameEn: 'Amol Patil',
    email: 'amol@jain.com',
    mobile: '+91 98220 12345',
    status: 'ACTIVE',
    todayVisits: 8,
    todayOrders: 15,
    assignedVillages: ['v-1', 'v-2'],
  },
  {
    id: 'sp-2',
    name: 'संतोष शिंदे',
    nameEn: 'Santosh Shinde',
    email: 'santosh@jain.com',
    mobile: '+91 98220 23456',
    status: 'ACTIVE',
    todayVisits: 6,
    todayOrders: 11,
    assignedVillages: ['v-3', 'v-4'],
  },
  {
    id: 'sp-3',
    name: 'राहुल जाधव',
    nameEn: 'Rahul Jadhav',
    email: 'rahul@jain.com',
    mobile: '+91 98220 34567',
    status: 'INACTIVE',
    todayVisits: 0,
    todayOrders: 0,
    assignedVillages: ['v-5'],
  },
];

export const INITIAL_VILLAGES: Village[] = [
  {
    id: 'v-1',
    marathiName: 'सांगोला',
    englishName: 'Sangola',
    taluka: 'Sangola',
    district: 'Solapur',
    shopsCount: 18,
    visitsToday: 8,
    ordersToday: 15,
  },
  {
    id: 'v-2',
    marathiName: 'अकलूज',
    englishName: 'Akluj',
    taluka: 'Malshiras',
    district: 'Solapur',
    shopsCount: 14,
    visitsToday: 6,
    ordersToday: 11,
  },
  {
    id: 'v-3',
    marathiName: 'वाखरी',
    englishName: 'Wakhari',
    taluka: 'Pandharpur',
    district: 'Solapur',
    shopsCount: 17,
    visitsToday: 7,
    ordersToday: 12,
  },
  {
    id: 'v-4',
    marathiName: 'मंगळवेढा',
    englishName: 'Mangalwedha',
    taluka: 'Mangalwedha',
    district: 'Solapur',
    shopsCount: 16,
    visitsToday: 7,
    ordersToday: 8,
  },
  {
    id: 'v-5',
    marathiName: 'पंढरपूर',
    englishName: 'Pandharpur',
    taluka: 'Pandharpur',
    district: 'Solapur',
    shopsCount: 22,
    visitsToday: 4,
    ordersToday: 6,
  },
];

export const INITIAL_SHOPS: Shop[] = [
  {
    id: 's-1',
    name: 'श्री गणेश किराणा स्टोअर्स',
    nameEn: 'Shri Ganesh Kirana Stores',
    owner: 'गणेश कुलकर्णी',
    ownerEn: 'Ganesh Kulkarni',
    mobile: '+91 94230 11223',
    villageId: 'v-1',
    address: 'मेन रोड, बस स्टँड जवळ, सांगोला',
    addressEn: 'Near Bus Stand, Main Road, Sangola',
    outstandingBalance: 4500,
  },
  {
    id: 's-2',
    name: 'साई किराणा स्टोअर्स',
    nameEn: 'Sai Kirana Stores',
    owner: 'विष्णू कदम',
    ownerEn: 'Vishnu Kadam',
    mobile: '+91 94230 44556',
    villageId: 'v-1',
    address: 'शिवाजी चौक, सांगोला',
    addressEn: 'Shivaji Chowk, Sangola',
    outstandingBalance: 1200,
  },
  {
    id: 's-3',
    name: 'माऊली ट्रेडर्स',
    nameEn: 'Mauli Traders',
    owner: 'दत्तात्रय पवार',
    ownerEn: 'Dattatray Pawar',
    mobile: '+91 94230 77889',
    villageId: 'v-1',
    address: 'मार्केट यार्ड, सांगोला',
    addressEn: 'Market Yard, Sangola',
    outstandingBalance: 0,
  },
  {
    id: 's-4',
    name: 'समर्थ किराणा भंडार',
    nameEn: 'Samarth Kirana Bhandar',
    owner: 'सुरेश देशमुख',
    ownerEn: 'Suresh Deshmukh',
    mobile: '+91 98500 12345',
    villageId: 'v-2',
    address: 'स्टेशन रोड, अकलूज',
    addressEn: 'Station Road, Akluj',
    outstandingBalance: 3100,
  },
  {
    id: 's-5',
    name: 'जय भवानी किराणा',
    nameEn: 'Jai Bhavani Kirana',
    owner: 'आनंद शिंदे',
    ownerEn: 'Anand Shinde',
    mobile: '+91 98500 67890',
    villageId: 'v-2',
    address: 'गांधी चौक, अकलूज',
    addressEn: 'Gandhi Chowk, Akluj',
    outstandingBalance: 850,
  },
  {
    id: 's-6',
    name: 'विठ्ठल कृपा प्रोव्हिजन',
    nameEn: 'Vitthal Krupa Provision',
    owner: 'पांडुरंग काळे',
    ownerEn: 'Pandurang Kale',
    mobile: '+91 97630 11223',
    villageId: 'v-3',
    address: 'मंदिर रस्ता, वाखरी',
    addressEn: 'Temple Road, Wakhari',
    outstandingBalance: 2400,
  },
  {
    id: 's-7',
    name: 'कृष्णा ट्रेडर्स',
    nameEn: 'Krishna Traders',
    owner: 'महादेव जाधव',
    ownerEn: 'Mahadev Jadhav',
    mobile: '+91 98600 99887',
    villageId: 'v-4',
    address: 'नगरपालिका चौक, मंगळवेढा',
    addressEn: 'Municipality Chowk, Mangalwedha',
    outstandingBalance: 5200,
  },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-101',
    salespersonId: 'sp-1',
    villageId: 'v-1',
    shopId: 's-1',
    transcribedText: 'दहा किलो साखर आणि पाच किलो तांदूळ द्या.',
    items: [
      { name: 'साखर (Sugar)', quantity: 10, unit: 'किलो (kg)' },
      { name: 'तांदूळ (Rice)', quantity: 5, unit: 'किलो (kg)' },
    ],
    status: 'CONFIRMED',
    createdAt: '2026-10-25 09:45 AM',
  },
  {
    id: 'ORD-102',
    salespersonId: 'sp-1',
    villageId: 'v-1',
    shopId: 's-2',
    transcribedText: 'दहा किलो रवा, पार्ले बिस्किट वीस पॅकेट, पन्नास किलो गूळ आणि डाबर टूथपेस्ट पाच बॉक्स.',
    items: [
      { name: 'रवा (Rava)', quantity: 10, unit: 'किलो (kg)' },
      { name: 'पार्ले बिस्किट (Parle Biscuit)', quantity: 20, unit: 'पॅकेट (Packet)' },
      { name: 'गूळ (Jaggery)', quantity: 50, unit: 'किलो (kg)' },
      { name: 'डाबर टूथपेस्ट (Dabur Toothpaste)', quantity: 5, unit: 'बॉक्स (Box)' },
    ],
    status: 'CONFIRMED',
    createdAt: '2026-10-25 10:15 AM',
  },
  {
    id: 'ORD-103',
    salespersonId: 'sp-2',
    villageId: 'v-3',
    shopId: 's-6',
    transcribedText: 'पाच लिटर शेंगदाणा तेल आणि दोन किलो चहा पावडर.',
    items: [
      { name: 'शेंगदाणा तेल (Cooking Oil)', quantity: 5, unit: 'लिटर (Ltr)' },
      { name: 'चहा पावडर (Tea Powder)', quantity: 2, unit: 'किलो (kg)' },
    ],
    status: 'CONFIRMED',
    createdAt: '2026-10-25 11:20 AM',
  },
];
