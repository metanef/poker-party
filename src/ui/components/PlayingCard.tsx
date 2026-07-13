import React from 'react';
import { Card, rankLabel, suitSymbol, isRedSuit } from '@/engine/model/Card';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PlayingCardProps {
  card?: Card | null; // if null/undefined, render face down
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PlayingCard({ card, selected, onClick, className, size = 'md' }: PlayingCardProps) {
  const isFaceUp = Boolean(card);
  const isRed = card ? isRedSuit(card.suit) : false;

  const sizeClasses = {
    sm: 'w-9 h-13 sm:w-12 sm:h-16 text-[10px] sm:text-xs',
    md: 'w-12 h-18 sm:w-16 sm:h-24 text-xs sm:text-base',
    lg: 'w-16 h-24 sm:w-24 sm:h-36 text-sm sm:text-xl',
  };

  const symbolSizeClasses = {
    sm: 'text-sm sm:text-lg',
    md: 'text-xl sm:text-3xl',
    lg: 'text-3xl sm:text-5xl',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-card overflow-hidden shadow-md transition-all duration-200 select-none cursor-pointer',
        sizeClasses[size],
        selected ? 'ring-2 ring-felt-accent -translate-y-2 shadow-lg shadow-felt-accent/20' : '',
        !onClick ? 'cursor-default' : '',
        className
      )}
    >
      {!isFaceUp ? (
        // Face down
        <div className="w-full h-full card-back-pattern border-2 border-table-border rounded-card" />
      ) : (
        // Face up
        <div className="w-full h-full bg-white flex flex-col justify-between p-1.5 border border-gray-200 rounded-card">
          <div
            className={cn(
              'font-title font-bold leading-none tracking-tighter',
              isRed ? 'text-red-500' : 'text-gray-900'
            )}
          >
            {rankLabel(card!.rank)}
          </div>
          <div
            className={cn(
              'self-end leading-none',
              symbolSizeClasses[size],
              isRed ? 'text-red-500' : 'text-gray-900'
            )}
          >
            {suitSymbol(card!.suit)}
          </div>
        </div>
      )}
    </div>
  );
}
