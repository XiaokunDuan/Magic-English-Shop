import React, { useState, useRef, useEffect } from 'react';
import { SHOP_ITEMS, SHOPKEEPER_NAME, SHOPKEEPER_EMOJI } from './constants';
import { ShopItem, Message, GameState } from './types';
import { ShopItemCard } from './components/ShopItemCard';
import { ChatMessage } from './components/ChatMessage';
import { sendMessageToGemini } from './services/geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.WELCOME);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [missions, setMissions] = useState({
    'a few': false,
    'a little': false,
    'a lot of': false
  });
  const [showCelebration, setShowCelebration] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatHistoryRef = useRef<{ role: 'user' | 'model'; parts: [{ text: string }] }[]>([]);

  // Sound effect helper
  const playSound = (type: 'pop' | 'success' | 'click' | 'win') => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const now = audioContext.currentTime;

    if (type === 'pop') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, now);
      gainNode.gain.setValueAtTime(0.1, now);
      oscillator.start();
      oscillator.stop(now + 0.1);
    } else if (type === 'success') {
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(400, now);
      oscillator.frequency.linearRampToValueAtTime(800, now + 0.1);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      oscillator.start();
      oscillator.stop(now + 0.5);
    } else if (type === 'win') {
      // Victory fanfare sequence simulated with multiple oscillators would be complex, simplified here
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(523.25, now); // C5
      oscillator.frequency.setValueAtTime(659.25, now + 0.2); // E5
      oscillator.frequency.setValueAtTime(783.99, now + 0.4); // G5
      oscillator.frequency.setValueAtTime(1046.50, now + 0.6); // C6
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 1.5);
      oscillator.start();
      oscillator.stop(now + 1.5);
    } else {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(400, now);
      gainNode.gain.setValueAtTime(0.05, now);
      oscillator.start();
      oscillator.stop(now + 0.05);
    }
  };

  // Speak helper using Web Speech API
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel previous speech to avoid queue buildup
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1.2; 
      window.speechSynthesis.speak(utterance);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const startGame = () => {
    playSound('success');
    setGameState(GameState.SHOPPING);
    const initialMessage = `Hello! Welcome to the Magic Shop! 🌟 What would you like to buy?`;
    setMessages([{ 
      id: 'init', 
      sender: 'shopkeeper', 
      text: initialMessage
    }]);
    chatHistoryRef.current.push({
      role: 'model',
      parts: [{ text: initialMessage }]
    });
    speak(initialMessage);
  };

  const checkMissionProgress = (userText: string, aiText: string) => {
    // If shopkeeper sold the item (look for "Here you go" or similar confirmation)
    const isSuccess = /Here you go/i.test(aiText) || /euros/i.test(aiText);
    
    if (isSuccess) {
      const lowerUserText = userText.toLowerCase();
      let newMissions = { ...missions };
      let changed = false;

      if (lowerUserText.includes('a few') && !missions['a few']) {
        newMissions['a few'] = true;
        changed = true;
      }
      if (lowerUserText.includes('a little') && !missions['a little']) {
        newMissions['a little'] = true;
        changed = true;
      }
      if (lowerUserText.includes('a lot of') && !missions['a lot of']) {
        newMissions['a lot of'] = true;
        changed = true;
      }

      if (changed) {
        setMissions(newMissions);
        if (Object.values(newMissions).every(Boolean)) {
          setTimeout(() => {
            setShowCelebration(true);
            playSound('win');
          }, 1000);
        } else {
          playSound('success');
        }
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    playSound('pop');
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    // Update history for Gemini
    chatHistoryRef.current.push({
      role: 'user',
      parts: [{ text: userMsg.text }]
    });

    try {
      const responseText = await sendMessageToGemini(userMsg.text, chatHistoryRef.current);
      
      const shopkeeperMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'shopkeeper',
        text: responseText
      };

      setMessages(prev => [...prev, shopkeeperMsg]);
      chatHistoryRef.current.push({
        role: 'model',
        parts: [{ text: responseText }]
      });
      
      speak(responseText);
      checkMissionProgress(userMsg.text, responseText);

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const insertPhrase = (phrase: string) => {
    playSound('click');
    setInputText(prev => {
        if (!prev) return phrase;
        if (prev.endsWith(' ')) return prev + phrase;
        return prev + ' ' + phrase;
    });
    // Focus input after click
    const input = document.querySelector('input');
    input?.focus();
  };

  const resetGame = () => {
    setMissions({ 'a few': false, 'a little': false, 'a lot of': false });
    setShowCelebration(false);
    setMessages([]);
    chatHistoryRef.current = [];
    setInputText('');
    setSelectedItem(null);
    startGame();
  };

  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gradient-to-b from-sky-200 to-sky-50 font-comic">
      <div className="text-8xl mb-6 animate-wiggle drop-shadow-lg">🏪</div>
      <h1 className="text-5xl md:text-7xl font-black text-blue-600 mb-2 tracking-tight drop-shadow-sm font-comic">Magic Shop</h1>
      <h2 className="text-2xl text-blue-400 font-bold mb-6">魔法商店英语大冒险</h2>
      
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-[2rem] shadow-xl max-w-lg w-full mb-8 border-4 border-yellow-300 transform transition hover:scale-105 duration-300">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-center gap-2">
          <span>🎮</span> 玩法介绍 (How to Play)
        </h3>
        
        <ul className="text-left space-y-4 text-lg text-gray-700">
          <li className="flex items-center bg-white p-3 rounded-xl shadow-sm">
            <span className="bg-green-100 text-green-600 w-10 h-10 flex items-center justify-center rounded-full mr-4 font-bold text-xl shrink-0">1</span>
            <div>
              <p className="font-bold text-gray-800">Choose an item</p>
              <p className="text-sm text-gray-500">选择一个你想买的商品</p>
            </div>
          </li>
          <li className="flex items-center bg-white p-3 rounded-xl shadow-sm">
            <span className="bg-blue-100 text-blue-600 w-10 h-10 flex items-center justify-center rounded-full mr-4 font-bold text-xl shrink-0">2</span>
            <div>
              <p className="font-bold text-gray-800">Use a quantifier</p>
              <p className="text-sm text-gray-500">使用 <span className="text-blue-500 font-bold">a few</span>, <span className="text-blue-500 font-bold">a little</span>, 或 <span className="text-blue-500 font-bold">a lot of</span></p>
            </div>
          </li>
          <li className="flex items-center bg-white p-3 rounded-xl shadow-sm">
            <span className="bg-pink-100 text-pink-600 w-10 h-10 flex items-center justify-center rounded-full mr-4 font-bold text-xl shrink-0">3</span>
            <div>
              <p className="font-bold text-gray-800">Ask "How much?"</p>
              <p className="text-sm text-gray-500">别忘了问价格哦！</p>
            </div>
          </li>
        </ul>
      </div>

      <button 
        onClick={startGame}
        className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-black text-3xl py-4 px-12 rounded-full shadow-[0_6px_0_rgb(180,83,9)] hover:shadow-[0_3px_0_rgb(180,83,9)] hover:translate-y-1 transition-all active:translate-y-2 active:shadow-none"
      >
        GO! 开始游戏 🚀
      </button>
    </div>
  );

  const renderCelebration = () => (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[3rem] p-8 max-w-md w-full text-center animate-bounce-slow border-8 border-yellow-300 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-yellow-50 -z-10 opacity-50 bg-[radial-gradient(circle,_#fbbf24_2px,_transparent_2.5px)] bg-[length:20px_20px]"></div>
        <div className="text-8xl mb-4 animate-bounce">🏆</div>
        <h2 className="text-4xl font-black text-yellow-500 mb-2">YOU WIN!</h2>
        <p className="text-2xl text-gray-600 font-bold mb-8">太棒了！你买到了所有东西！</p>
        <button 
          onClick={resetGame}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-xl py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105"
        >
          Play Again (再玩一次) 🔄
        </button>
      </div>
    </div>
  );

  const renderShop = () => (
    <div className="flex flex-col h-screen bg-sky-50 font-comic relative overflow-hidden">
      {showCelebration && renderCelebration()}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md p-3 flex justify-between items-center shadow-sm border-b-4 border-blue-100 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="text-4xl bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center border-2 border-blue-200">{SHOPKEEPER_EMOJI}</div>
          <div>
            <h2 className="font-bold text-lg md:text-xl text-gray-800 leading-tight">Mr. Panda's Shop</h2>
            <p className="text-xs text-gray-500 font-medium">熊猫先生的魔法商店</p>
          </div>
        </div>
        
        {/* Mission Board */}
        <div className="flex gap-2 bg-blue-50 px-3 py-2 rounded-2xl border-2 border-blue-100">
           {Object.entries(missions).map(([key, completed]) => (
             <div key={key} className={`flex flex-col items-center justify-center w-14 md:w-20 transition-all duration-500 ${completed ? 'scale-110' : 'opacity-60 grayscale'}`}>
                <div className="text-2xl mb-1">{completed ? '⭐' : '⚪'}</div>
                <span className="text-[10px] md:text-xs font-bold text-blue-800 whitespace-nowrap">{key}</span>
             </div>
           ))}
        </div>
      </header>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden max-w-7xl mx-auto w-full">
        
        {/* Left: Shelf (Items) */}
        <div className="w-full md:w-1/3 lg:w-1/4 bg-white/50 p-4 overflow-y-auto scrollbar-hide border-r border-blue-100">
          <h3 className="text-blue-400 font-bold uppercase text-xs mb-3 tracking-widest flex items-center gap-2">
            <span>🛍️</span> Goods (商品)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-4">
            {SHOP_ITEMS.map((item) => (
              <ShopItemCard 
                key={item.id} 
                item={item} 
                isSelected={selectedItem?.id === item.id}
                onClick={(i) => {
                  setSelectedItem(i);
                  playSound('click');
                }}
              />
            ))}
          </div>

          {/* Grammar Cheat Sheet - Sticky Note Style */}
          <div className="mt-2 bg-yellow-100 p-4 rounded-xl shadow-md rotate-1 border-t-8 border-yellow-200/50">
            <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-1 text-sm">
              <span>💡</span> Magic Words (魔法咒语)
            </h4>
            <div className="text-xs space-y-3 text-gray-700">
               <div>
                 <p className="font-bold text-green-700 mb-1">可数 (Countable):</p>
                 <div className="flex gap-1 flex-wrap">
                   <span className="bg-white px-2 py-1 rounded-md border border-green-200">a few (一点)</span>
                   <span className="bg-white px-2 py-1 rounded-md border border-green-200">a lot of (很多)</span>
                 </div>
                 <p className="mt-1 text-gray-500 italic">Example: apples, sweets</p>
               </div>
               <div className="h-px bg-yellow-300/50"></div>
               <div>
                 <p className="font-bold text-blue-700 mb-1">不可数 (Uncountable):</p>
                 <div className="flex gap-1 flex-wrap">
                   <span className="bg-white px-2 py-1 rounded-md border border-blue-200">a little (一点)</span>
                   <span className="bg-white px-2 py-1 rounded-md border border-blue-200">a lot of (很多)</span>
                 </div>
                 <p className="mt-1 text-gray-500 italic">Example: milk, lemonade</p>
               </div>
            </div>
          </div>
        </div>

        {/* Right: Chat Area */}
        <div className="flex-1 flex flex-col relative bg-gradient-to-br from-white to-blue-50">
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4 animate-pulse">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-2 border-2 border-gray-200 shadow-sm text-2xl">
                  {SHOPKEEPER_EMOJI}
                </div>
                <div className="bg-white px-6 py-4 rounded-3xl rounded-tl-none border border-gray-100 shadow-sm text-gray-400 flex items-center gap-1">
                  Typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 md:p-4 bg-white border-t border-blue-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
            
            {/* Helper Chips */}
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-1 items-center">
              <span className="text-xs font-bold text-gray-400 uppercase shrink-0">Hints:</span>
              {['I would like', 'How much', 'a few', 'a little', 'a lot of'].map((phrase) => (
                <button 
                  key={phrase}
                  onClick={() => insertPhrase(phrase)}
                  className="whitespace-nowrap bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full text-sm font-bold hover:bg-indigo-100 border border-indigo-100 transition-colors shadow-sm"
                >
                  {phrase}
                </button>
              ))}
              {selectedItem && (
                 <button 
                  onClick={() => insertPhrase(selectedItem.name.toLowerCase())}
                  className="whitespace-nowrap bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full text-sm font-bold hover:bg-orange-100 border border-orange-100 transition-colors shadow-sm animate-bounce-slow"
                >
                  {selectedItem.name.toLowerCase()}
                </button>
              )}
            </div>

            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask here... (例如: I would like a few...)"
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-3xl px-5 py-3 pr-10 focus:outline-none focus:border-blue-400 focus:bg-white transition-all text-lg shadow-inner"
                />
              </div>
              <button 
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full w-12 h-12 md:w-auto md:h-auto md:px-8 md:py-3 font-bold shadow-lg transition-transform active:scale-90 flex items-center justify-center"
              >
                <span className="hidden md:inline">Send</span>
                <span className="md:hidden">➤</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  return gameState === GameState.WELCOME ? renderWelcome() : renderShop();
};

export default App;
