import React from 'react';
import { Message } from '../types';
import { SHOPKEEPER_EMOJI } from '../constants';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-2xl shadow-md mr-3 border-2 border-blue-100 shrink-0 self-end mb-1">
          {SHOPKEEPER_EMOJI}
        </div>
      )}
      
      <div 
        className={`
          relative max-w-[85%] px-6 py-4 text-lg shadow-sm
          ${isUser 
            ? 'bg-blue-500 text-white rounded-3xl rounded-br-none' 
            : 'bg-white text-gray-800 rounded-3xl rounded-bl-none border-2 border-gray-100'}
        `}
      >
        {message.text}
      </div>

      {isUser && (
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl shadow-md ml-3 border-2 border-blue-200 shrink-0 self-end mb-1">
          🧒
        </div>
      )}
    </div>
  );
};
