import { ShopItem, ItemType } from './types';

export const SHOP_ITEMS: ShopItem[] = [
  { 
    id: 'tomatoes', 
    name: 'Tin of Tomatoes', 
    chineseName: '番茄罐头 (countable)',
    price: 2.50, 
    type: ItemType.COUNTABLE, 
    emoji: '🥫',
    imageColor: 'bg-red-100'
  },
  { 
    id: 'lemonade', 
    name: 'Lemonade', 
    chineseName: '柠檬水 (uncountable)',
    price: 3.00, 
    type: ItemType.UNCOUNTABLE, 
    emoji: '🍋',
    imageColor: 'bg-yellow-100'
  },
  { 
    id: 'sweets', 
    name: 'Sweets', 
    chineseName: '糖果 (countable)',
    price: 1.20, 
    type: ItemType.COUNTABLE, 
    emoji: '🍬',
    imageColor: 'bg-pink-100'
  },
  { 
    id: 'apples', 
    name: 'Apples', 
    chineseName: '苹果 (countable)',
    price: 0.80, 
    type: ItemType.COUNTABLE, 
    emoji: '🍎',
    imageColor: 'bg-red-200'
  },
  { 
    id: 'milk', 
    name: 'Milk', 
    chineseName: '牛奶 (uncountable)',
    price: 2.10, 
    type: ItemType.UNCOUNTABLE, 
    emoji: '🥛',
    imageColor: 'bg-blue-100'
  }
];

export const SHOPKEEPER_NAME = "Mr. Panda";
export const SHOPKEEPER_EMOJI = "🐼";
