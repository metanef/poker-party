import React, { useState } from 'react';
import { getTransport } from '@/ui/hooks/useTableSocket';
import { Smile, ChevronLeft } from 'lucide-react';

const EMOTES = ['❤️', '😎', '🤬', '😂'];

export function EmotePicker({ className = '' }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmote = (emoji: string) => {
    getTransport().sendEmote(emoji).catch(console.error);
    setIsOpen(false);
  };

  return (
    <div className={`flex items-center ${className}`}>
      {/* Mobile view: Collapsible drawer/volet unfolding to the right */}
      <div className="flex sm:hidden items-center relative">
        <div 
          className={`flex items-center bg-table-panel border border-table-border rounded-full shadow-lg transition-all duration-300 ease-out overflow-hidden h-12 ${
            isOpen ? 'w-[200px] px-2' : 'w-12 px-0 justify-center'
          }`}
        >
          {isOpen ? (
            <div className="flex items-center gap-2 w-full justify-between">
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 active:scale-95 transition-all"
                title="Fermer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 flex-1 justify-around">
                {EMOTES.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmote(emoji)}
                    className="w-8 h-8 flex items-center justify-center text-lg rounded-full hover:bg-white/10 active:scale-95 transition-all"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsOpen(true)}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-table-panel text-felt-accent hover:brightness-110 active:scale-95 transition-all"
              title="Réagir"
            >
              <Smile className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Desktop view: Always visible toolbar */}
      <div className="hidden sm:flex items-center gap-2 p-2 bg-table-panel rounded-full border border-table-border shadow-lg">
        {EMOTES.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleEmote(emoji)}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-xl rounded-full hover:bg-white/10 active:scale-95 transition-all"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
