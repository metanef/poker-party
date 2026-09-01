<div align="center">

  <img src="public/logo.svg" width="110" height="110" alt="Poker Party Logo" />

  # Poker Party 🃏

  **A modern real-time multiplayer card game where every life counts.**

  [![Live Demo](https://img.shields.io/badge/LIVE_DEMO-PLAY_ONLINE-22c55e?style=for-the-badge&logo=githubpages&logoColor=white)](https://metanef.github.io/poker-party/)
  [![v1.3](https://img.shields.io/badge/VERSION-1.3_STABLE-8b5cf6?style=for-the-badge)](https://github.com/metanef/poker-party)

  <br />

  [![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](#)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript&logoColor=white)](#)
  [![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite&logoColor=white)](#)
  [![Firebase](https://img.shields.io/badge/Firebase-Realtime_DB-FFCA28?style=flat-square&logo=firebase&logoColor=black)](#)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)](#)
  [![Zustand](https://img.shields.io/badge/Zustand-4.5-764ABC?style=flat-square)](#)

</div>

---

## ✨ Features

- 🎴 **Draw Poker**: 5 hole cards + 5 community cards. Strategic exchange phases at each street (Flop, Turn, River).
- ❤️ **Life & Point System**: The loser of the round loses 1 life (❤️). Accumulating points (typically 3) allows you to buy back a life.
- 📱 **100% Mobile & iOS Responsive**: Smooth interface designed for smartphones (iPhone / Android) and desktop screens.
- ⚡ **Real-time or Solo**: Play with friends in real-time online or against local bots in offline mode.
- 💔 **Showdown Animations**: A dramatic animation of breaking hearts when a player loses a life.

---

## 🕹️ Quick Rules

1. **Initial Deal**: 5 private cards per player.
2. **Exchange Phase**: Swap between 0 and 5 cards at the Flop, Turn, and River to form the best combination.
3. **Showdown**: 
   - **Winner**: +1 point.
   - **Loser**: Loses 1 life (❤️).
4. **Buyback**: Accumulating enough points allows you to recover 1 life.
5. **Game Over**: The game ends as soon as any player runs out of lives (0 ❤️).

---

## 🛠️ Tech Stack

| Technology | Usage |
| :--- | :--- |
| **React 18** | Composable UI framework |
| **TypeScript** | Strict typing for game engine and database models |
| **Vite** | Ultra-fast frontend build tool |
| **Firebase Realtime DB** | Decentralized, real-time multiplayer synchronization |
| **Zustand** | Lightweight global state management |
| **Tailwind CSS** | Modern dark casino styling & custom CSS animations |

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
pnpm install

# 2. Start development server
pnpm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🗺️ Roadmap & TODO

### ✅ Done
- [x] **Mobile & iPhone Responsiveness**: Game table adaptations, iOS safe area notch support (`viewport-fit=cover`, `pt-safe-game`, `pb-safe-game`).
- [x] **Hand History & Text Chat**: Sidebar log containing actions and real-time messaging.
- [x] **Disconnections Handling**: Automatic reconnection without locking the game FSM and temporary bot allocation.
- [x] **Reactions / Emotes**: Collapsible sidebar with 4 temporary emotes.
- [x] **Opponent Cards Visibility**: Enlarged cards shown at Showdown, sleek hidden card-backs during rounds.
- [x] **Game Over Screen**: Final leaderboard sorted by wins, eliminated status highlights (💀), Restart and Quit buttons.
- [x] **In-Game Settings**: Complete configuration options in the lobby (max players, starting lives, buyback cost).
- [x] **Next Round Validation**: Mandatory "Ready" check-in before the host launches the next round.
- [x] **Showdown Visual Effects**: Dramatic life loss animation (💔) when a player loses a life.
- [x] **Pause screen management**: Ensure the pause button doesn't get stuck in the paused state.
- [x] **English Translation (i18n)**: Bilingual French / English translations.
- [x] **Link Sharing Fix**: Correctly include repository base path in shared URL and add `404.html` redirection for GitHub Pages routing.
- [x] **Connection & Disconnection System**: Disabled temporary bot replacement on player disconnection (such as tab/app switching), allowing players to reconnect and act during the standard 20-second exchange timeout.
- [x] **v1.3 Life Mechanics System Migration**: Complete migration from strip poker mechanics to a life-based poker mechanics system (❤️ Lives, buybacks, eliminated state 💀, broken heart showdown animations 💔, updated i18n & log translation).

### 🔄 Planned
