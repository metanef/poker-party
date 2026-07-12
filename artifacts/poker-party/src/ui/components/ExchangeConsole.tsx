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
      <div className="flex justify-center items-end h-48 space-x-2 md:space-x-4 mb-6">
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
            {selectedIndices.size > 0 ? (
              <button
                onClick={handleExchange}
                className="bg-felt-accent text-table-bg font-title font-semibold py-3 px-6 rounded-full hover:brightness-110 active:scale-95 transition-all shadow-lg flex-1 max-w-[240px]"
              >
                Changer {selectedIndices.size} carte{selectedIndices.size > 1 ? 's' : ''}
              </button>
            ) : (
              <button
                onClick={handleKeepAll}
                className="bg-table-panel text-white border border-table-border font-title font-semibold py-3 px-6 rounded-full hover:bg-white/5 active:scale-95 transition-all shadow-lg flex-1 max-w-[240px]"
              >
                Garder tout
              </button>
            )}
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
