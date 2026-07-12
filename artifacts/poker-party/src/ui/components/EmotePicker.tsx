import React from 'react';
import { getTransport } from '@/ui/hooks/useTableSocket';

const EMOTES = ['😂', '😅', '🤬', '😭', '😎', '🥵', '👀', '🎉'];

export function EmotePicker({ className = '' }: { className?: string }) {
  const handleEmote = (emoji: string) => {
    getTransport().sendEmote(emoji).catch(console.error);
  };

  return (
    <div className={`flex items-center gap-2 p-2 bg-table-panel rounded-full border border-table-border shadow-lg overflow-x-auto scrollbar-hide max-w-full ${className}`}>
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
  );
}
