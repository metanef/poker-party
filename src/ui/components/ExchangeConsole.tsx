import React, { useState, useEffect } from 'react';
import { Card } from '@/engine/model/Card';
import { PlayingCard } from './PlayingCard';
import { getTransport } from '@/ui/hooks/useTableSocket';

interface ExchangeConsoleProps {
  cards: Card[];
  isExchangeActive: boolean;
  hasActed: boolean;
  className?: string;
}

export function ExchangeConsole({ cards, isExchangeActive, hasActed, className = '' }: ExchangeConsoleProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // Reset selection when stage changes or acted
  useEffect(() => {
    if (!isExchangeActive || hasActed) {
      setSelectedIndices(new Set());
    }
  }, [isExchangeActive, hasActed]);

  const toggleCard = (index: number) => {
    if (!isExchangeActive || hasActed) return;
    
    const next = new Set(selectedIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedIndices(next);
  };

  const handleExchange = () => {
    if (selectedIndices.size === 0) return;
    getTransport().sendExchangeChoice({
      type: 'change',
      cardIndices: Array.from(selectedIndices)
    }).catch(console.error);
  };

  const handleKeepAll = () => {
    getTransport().sendExchangeChoice({
      type: 'keep'
    }).catch(console.error);
  };

  return (
    <div className={`flex flex-col items-center w-full max-w-2xl mx-auto ${className}`}>
      {/* Cards Row */}
      <div className="flex justify-center items-end h-32 sm:h-48 space-x-1.5 sm:space-x-4 mb-4 sm:mb-6">
        {cards.map((card, idx) => (
          <PlayingCard
            key={idx}
            card={card}
            size="lg"
            selected={selectedIndices.has(idx)}
            onClick={() => toggleCard(idx)}
            className={!isExchangeActive || hasActed ? 'cursor-default opacity-90' : 'cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all'}
          />
        ))}
      </div>

      {/* Action Area */}
      <div className="h-16 flex items-center justify-center w-full">
        {isExchangeActive && !hasActed ? (
          <div className="flex gap-4 w-full px-4 justify-center">
            {/* Changer les cartes button */}
            <button
              onClick={handleExchange}
              disabled={selectedIndices.size === 0}
              className={`font-title font-semibold py-3 px-6 rounded-full transition-all shadow-lg flex-1 max-w-[240px] ${
                selectedIndices.size > 0
                  ? 'bg-felt-accent text-table-bg hover:brightness-110 active:scale-95 cursor-pointer'
                  : 'bg-table-panel/50 text-gray-500 border border-table-border/40 cursor-not-allowed opacity-50'
              }`}
            >
              Changer {selectedIndices.size > 0 ? selectedIndices.size : ''} carte{selectedIndices.size > 1 ? 's' : ''}
            </button>

            {/* Garder tout button */}
            <button
              onClick={handleKeepAll}
              disabled={selectedIndices.size > 0}
              className={`font-title font-semibold py-3 px-6 rounded-full transition-all shadow-lg flex-1 max-w-[240px] ${
                selectedIndices.size === 0
                  ? 'bg-table-panel text-white border border-table-border hover:bg-white/5 active:scale-95 cursor-pointer'
                  : 'bg-table-panel/50 text-gray-500 border border-table-border/40 cursor-not-allowed opacity-50'
              }`}
            >
              Garder tout
            </button>
          </div>
        ) : hasActed ? (
          <div className="text-gray-400 font-medium italic animate-pulse">
            En attente des autres joueurs...
          </div>
        ) : null}
      </div>
    </div>
  );
}
