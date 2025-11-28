import React from 'react';
import { ShopItem } from '../types';

interface ShopItemCardProps {
  item: ShopItem;
  onClick: (item: ShopItem) => void;
  isSelected: boolean;
}

export const ShopItemCard: React.FC<ShopItemCardProps> = ({ item, onClick, isSelected }) => {
  return (
    <div 
      onClick={() => onClick(item)}
      className={`
        relative flex flex-col items-center justify-center p-3 rounded-2xl cursor-pointer transition-all duration-300 select-none
        ${isSelected 
          ? 'bg-white border-4 border-yellow-400 shadow-xl scale-105 z-10' 
          : 'bg-white hover:bg-gray-50 border-2 border-gray-100 shadow-md hover:-translate-y-1'
        }
      `}
    >
      <div className={`
        text-4xl mb-2 p-3 rounded-full 
        ${item.imageColor} bg-opacity-50
        transition-transform duration-500 ${isSelected ? 'rotate-12 scale-110' : ''}
      `}>
        {item.emoji}
      </div>
      
      <h3 className="font-bold text-gray-700 text-center text-sm md:text-base leading-tight font-comic">{item.name}</h3>
      <p className="text-xs text-gray-400 mt-1 font-medium">{item.chineseName}</p>
      
      {isSelected && (
        <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-bounce">
          ✓
        </div>
      )}
    </div>
  );
};
