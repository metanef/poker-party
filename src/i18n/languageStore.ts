import { create } from 'zustand';
import { translations } from './translations';

export type Language = 'fr' | 'en';

interface LanguageStoreState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageStoreState>((set) => ({
  language: (localStorage.getItem('poker_party_lang') as Language) || 'fr',
  setLanguage: (language) => {
    localStorage.setItem('poker_party_lang', language);
    set({ language });
  },
}));

// Simple translate helper function
export function t(key: keyof typeof translations.fr, vars?: Record<string, string | number>): string {
  const lang = useLanguageStore.getState().language;
  const translationDict = translations[lang] || translations.fr;
  let text = translationDict[key] || translations.fr[key] || String(key);

  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      text = text.replace(new RegExp(`{${k}}`, 'g'), String(v));
    });
  }

  return text;
}

// Localized Card Rank label helper
const RANK_LABEL_EN: Record<number, string> = {
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'A',
};

const RANK_LABEL_FR: Record<number, string> = {
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'V',
  12: 'D',
  13: 'R',
  14: 'A',
};

export function getLocalizedRankLabel(rank: number, lang: Language): string {
  return lang === 'en' ? RANK_LABEL_EN[rank] : RANK_LABEL_FR[rank];
}

// System logs translator
export function translateSystemLog(logContent: string, lang: Language): string {
  if (lang === 'fr') return logContent; // already in French

  const text = logContent.trim();

  // 1. Join table
  // e.g., "PlayerName a rejoint la table." -> "PlayerName joined the table."
  if (text.endsWith(" a rejoint la table.")) {
    const pseudo = text.substring(0, text.length - " a rejoint la table.".length);
    return `${pseudo} joined the table.`;
  }

  // 2. Connected
  // e.g., "PlayerName s'est connecté." -> "PlayerName connected."
  if (text.endsWith(" s'est connecté.")) {
    const pseudo = text.substring(0, text.length - " s'est connecté.".length);
    return `${pseudo} connected.`;
  }

  // 3. Disconnected
  // e.g., "PlayerName s'est déconnecté."
  if (text.endsWith(" s'est déconnecté.")) {
    const pseudo = text.substring(0, text.length - " s'est déconnecté.".length);
    return `${pseudo} disconnected.`;
  }

  // 4. Changed cards
  // e.g., "PlayerName a changé 2 carte(s)." or "PlayerName a changé 2 cartes." or "PlayerName a changé 1 carte."
  const changeRegex = /^(.+?) a changé (\d+) cartes?\.$|^(.+?) a changé (\d+) carte\(s\)\.$/;
  const changeMatch = text.match(changeRegex);
  if (changeMatch) {
    const pseudo = changeMatch[1] || changeMatch[3];
    const count = changeMatch[2] || changeMatch[4];
    return `${pseudo} changed ${count} card${Number(count) > 1 ? 's' : ''}.`;
  }

  // 5. Kept cards
  // e.g., "PlayerName a gardé toutes ses cartes." -> "PlayerName kept all cards."
  if (text.endsWith(" a gardé toutes ses cartes.")) {
    const pseudo = text.substring(0, text.length - " a gardé toutes ses cartes.".length);
    return `${pseudo} kept all cards.`;
  }

  // 6. Round start
  // e.g., "Début de la Manche 3." -> "Start of Round 3."
  if (text.startsWith("Début de la Manche ")) {
    const match = text.match(/^Début de la Manche (\d+)\.$/);
    if (match) {
      return `Start of Round ${match[1]}.`;
    }
  }

  // 7. Round winner with hands
  // e.g., "PlayerName remporte la manche avec : Brelan de 8." -> "PlayerName wins the round with: Three of a Kind, 8s."
  const winSingleRegex = /^(.+?) remporte la manche avec : (.+?)\.$/;
  const winSingleMatch = text.match(winSingleRegex);
  if (winSingleMatch) {
    const name = winSingleMatch[1];
    const handFr = winSingleMatch[2];
    const handEn = translateHandLabelFrToEn(handFr);
    return `${name} wins the round with: ${handEn}.`;
  }

  const winPluralRegex = /^(.+?) remportent la manche avec : (.+?)\.$/;
  const winPluralMatch = text.match(winPluralRegex);
  if (winPluralMatch) {
    const names = winPluralMatch[1];
    const handFr = winPluralMatch[2];
    const handEn = translateHandLabelFrToEn(handFr);
    return `${names} win the round with: ${handEn}.`;
  }

  // 8. Loser removes clothing
  // e.g., "PlayerName perd la manche et retire un vêtement (👕 restants : 5)."
  if (text.includes(" perd la manche et retire un vêtement (👕 restants : ")) {
    const match = text.match(/^(.+?) perd la manche et retire un vêtement \(👕 restants : (\d+)\)\.$/);
    if (match) {
      return `${match[1]} loses the round and removes a clothing item (👕 remaining: ${match[2]}).`;
    }
  }

  // 9. Restored clothing
  // e.g., "PlayerName a racheté un vêtement (👕 +1, score : 4)."
  if (text.includes(" a racheté un vêtement (👕 +1, score : ")) {
    const match = text.match(/^(.+?) a racheté un vêtement \(👕 \+1, score : (\d+)\)\.$/);
    if (match) {
      return `${match[1]} bought back a clothing item (👕 +1, score: ${match[2]}).`;
    }
  }

  // 10. Restarted game
  if (text === "La partie a été relancée par l'hôte ! Bon jeu !") {
    return "The game has been restarted by the host! Good luck!";
  }
  if (text === "La partie commence ! Bon jeu à tous !") {
    return "The game starts! Good luck everyone!";
  }

  // 11. Game over
  // e.g., "Fin de la partie : PlayerName a gagné !" -> "Game over: PlayerName won!"
  if (text.startsWith("Fin de la partie : ")) {
    const message = text.substring("Fin de la partie : ".length);
    let translatedMsg = message;
    if (message.endsWith(" a gagné !")) {
      const pseudo = message.substring(0, message.length - " a gagné !".length);
      translatedMsg = `${pseudo} won!`;
    }
    return `Game over: ${translatedMsg}`;
  }

  return text;
}

// Translate hand description from French to English
export function translateHandLabelFrToEn(handFr: string): string {
  const text = handFr.trim();

  // Translate rank labels
  const frToEnRank = (r: string) => {
    const val = r.trim().toUpperCase();
    if (val === 'AS') return 'Ace';
    if (val === 'ROIS') return 'Kings';
    if (val === 'ROI') return 'King';
    if (val === 'DAMES') return 'Queens';
    if (val === 'DAME') return 'Queen';
    if (val === 'VALETS') return 'Jacks';
    if (val === 'VALET') return 'Jack';
    if (val === '10S') return '10s';
    if (val === '9S') return '9s';
    if (val === '8S') return '8s';
    if (val === '7S') return '7s';
    if (val === '6S') return '6s';
    if (val === '5S') return '5s';
    if (val === '4S') return '4s';
    if (val === '3S') return '3s';
    if (val === '2S') return '2s';
    return r;
  };

  // 1. Quinte flush au ...
  if (text.startsWith("Quinte flush au ")) {
    const rank = text.substring("Quinte flush au ".length);
    return `Straight Flush to the ${frToEnRank(rank)}`;
  }
  // 2. Carré de ...
  if (text.startsWith("Carré de ")) {
    const rank = text.substring("Carré de ".length);
    return `Four of a Kind, ${frToEnRank(rank)}`;
  }
  // 3. Full aux ... par les ...
  if (text.startsWith("Full aux ")) {
    const match = text.match(/^Full aux (.+?) par les (.+?)$/);
    if (match) {
      return `Full House, ${frToEnRank(match[1])} over ${frToEnRank(match[2])}`;
    }
  }
  // 4. Couleur au ...
  if (text.startsWith("Couleur au ")) {
    const rank = text.substring("Couleur au ".length);
    return `Flush, ${frToEnRank(rank)} high`;
  }
  // 5. Suite au ...
  if (text.startsWith("Suite au ")) {
    const rank = text.substring("Suite au ".length);
    return `Straight to the ${frToEnRank(rank)}`;
  }
  // 6. Brelan de ...
  if (text.startsWith("Brelan de ")) {
    const rank = text.substring("Brelan de ".length);
    return `Three of a Kind, ${frToEnRank(rank)}`;
  }
  // 7. Double paire, ... et ...
  if (text.startsWith("Double paire, ")) {
    const match = text.match(/^Double paire, (.+?) et (.+?)$/);
    if (match) {
      return `Two Pair, ${frToEnRank(match[1])} and ${frToEnRank(match[2])}`;
    }
  }
  // 8. Paire de ...
  if (text.startsWith("Paire de ")) {
    const rank = text.substring("Paire de ".length);
    return `Pair of ${frToEnRank(rank)}`;
  }
  // 9. Carte haute : ...
  if (text.startsWith("Carte haute : ")) {
    const rank = text.substring("Carte haute : ".length);
    return `High Card: ${frToEnRank(rank)}`;
  }

  return text;
}
