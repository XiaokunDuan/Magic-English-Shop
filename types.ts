export enum ItemType {
  COUNTABLE = 'countable',
  UNCOUNTABLE = 'uncountable'
}

export interface ShopItem {
  id: string;
  name: string; // English name
  chineseName: string;
  price: number;
  type: ItemType;
  emoji: string;
  imageColor: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'shopkeeper';
  text: string;
  isCorrection?: boolean; // If true, it means the shopkeeper is correcting grammar
}

export enum GameState {
  WELCOME,
  SHOPPING,
  SUCCESS
}