<div align="center">

  <img src="public/logo.svg" width="110" height="110" alt="Poker Party Logo" />

  # Poker Party 🃏

  **Un jeu de cartes multijoueur en temps réel moderne avec enjeu de déshabillage symbolique.**

  [![Live Demo](https://img.shields.io/badge/LIVE_DEMO-JOUEUR_EN_LIGNE-22c55e?style=for-the-badge&logo=githubpages&logoColor=white)](https://metanef.github.io/poker-party/)
  [![v1.0](https://img.shields.io/badge/VERSION-1.0_FINALE-8b5cf6?style=for-the-badge)](https://github.com/metanef/poker-party)

  <br />

  [![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](#)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript&logoColor=white)](#)
  [![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite&logoColor=white)](#)
  [![Firebase](https://img.shields.io/badge/Firebase-Realtime_DB-FFCA28?style=flat-square&logo=firebase&logoColor=black)](#)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)](#)
  [![Zustand](https://img.shields.io/badge/Zustand-4.5-764ABC?style=flat-square)](#)

</div>

---

## ✨ Caractéristiques

- 🎴 **Poker d'échange** : 5 cartes en main + 5 cartes communes. Échanges stratégiques à chaque étape (Flop, Turn, River).
- 👔 **Système de vêtements & points** : Le perdant de la manche retire 1 vêtement. Accumuler 3 points permet de racheter un vêtement.
- 📱 **100% Mobile & iOS Responsive** : Interface fluide pensée pour smartphones (iPhone / Android) et PC.
- ⚡ **Temps réel ou Solo** : Jouez à plusieurs en direct ou contre des IA locales en mode hors-ligne.
- 🔥 **Animations de Showdown** : Animation dramatique de vêtement qui prend feu lorsqu'un joueur se retrouve nu.

---

## 🕹️ Règles rapides

1. **Donne initiale** : 5 cartes privées par joueur.
2. **Phase d'échange** : Échangez de 0 à 5 cartes au Flop, au Turn et à la River pour former la meilleure combinaison.
3. **Showdown** : 
   - **Gagnant** : +1 point.
   - **Perdant** : Retire 1 vêtement (👕).
4. **Rachat** : 3 points accumulés permettent de récupérer 1 vêtement.
5. **Fin de partie** : La partie se termine dès qu'un joueur n'a plus aucun vêtement.

---

## 🛠️ Stack Technique

| Technologie | Usage |
| :--- | :--- |
| **React 18** | Framework UI composable |
| **TypeScript** | Typage strict du moteur de jeu et des données |
| **Vite** | Build tool ultra-rapide |
| **Firebase Realtime DB** | Synchronisation multijoueur décentralisée en temps réel |
| **Zustand** | Gestion de l'état global léger |
| **Tailwind CSS** | Styling modern dark casino & animations CSS |

---

## 🚀 Lancement local

```bash
# 1. Installer les dépendances
pnpm install

# 2. Lancer le serveur de développement
pnpm run dev
```

Ouvrez `http://localhost:5173` dans votre navigateur.

---

## 🗺️ Roadmap & TODO

### ✅ Fait (Done)
- [x] **Responsivité Mobile & iPhone** : Adaptation de la table de jeu, encoches iOS (`viewport-fit=cover`, `pt-safe-game`, `pb-safe-game`).
- [x] **Historique des mains & Chat textuel** : Panneau latéral déroulant avec logs d'actions et chat en direct.
- [x] **Gestion des Déconnexions** : Reconnexion automatique sans blocage de la FSM et attribution de bots temporaires.
- [x] **Optimisation des Réactions / Émotes** : Volet dépliable latéral à 4 émotes avec apparition temporaire.
- [x] **Affichage des Cartes Adverses** : Cartes agrandies au Showdown et vue épurée à 2 cartes cachées pendant les manches.
- [x] **Écran de Fin de Partie** : Classement final ordonné par victoires, statut nu mis en avant, boutons Relancer et Quitter.
- [x] **Paramètres In-Game** : Configuration complète dans le lobby (joueurs, vêtements initiaux, coût de rachat).
- [x] **Validation Manche Suivante** : Bouton Prêt obligatoire pour les joueurs avant le lancement par l'hôte.
- [x] **Effets Visuels de Showdown** : Animation dramatique de vêtement qui prend feu et brûle lorsqu'un joueur finit nu.

### 🔄 À venir (Planned)
- [ ] **Version Anglaise (i18n)** : Traduction bilingue Français / Anglais.
