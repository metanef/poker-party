# Poker Party 🃏

Une application web moderne, dynamique et élégante de jeu de cartes inspiré des règles du Poker avec un enjeu de déshabillage progressif (purement textuel et symbolique). Le jeu est conçu pour être joué entre amis, en temps réel, grâce à une architecture décentralisée basée sur **Firebase Realtime Database** et hébergée de manière 100 % statique sur **GitHub Pages**.

En cas d'absence de configuration Firebase, l'application bascule automatiquement en mode **Solo/Hors-ligne** vous permettant de jouer contre des intelligences artificielles locales.

---

## 🎨 Caractéristiques & Design
- **Esthétique Soignée** : Interface inspirée des tapis de casino haut de gamme (couleurs feutre vert/sombre, animations fluides des cartes via `framer-motion`, design responsive fluide adapté aux mobiles).
- **Temps Réel Multijoueur** : Synchronisation immédiate des actions des joueurs grâce au Realtime Database de Firebase.
- **Mode Solo Intégré** : IA locale simulant le comportement d'adversaires pour s'entraîner ou tester l'application hors-ligne.
- **Fonctionnalités Interactives** : Émoticônes animés en direct, minuteur de tour dynamique, gestion de la pause par l'hôte.
- **Sécurité et Consentement** : Écran d'avertissement et consentement explicite obligatoire avant de rejoindre une table de jeu.

---

## 🕹️ Déroulement et Règles du Jeu

Le jeu utilise l'ordre standard des combinaisons du Poker (Paire, Double Paire, Brelan, Suite, Couleur, Full, Carré, Quinte Flush), mais sans aucun système de jetons ou de mises.

1. **La Donne** : Chaque joueur reçoit 5 cartes fermées (visibles uniquement par lui).
2. **Les Rues d'Échange** : À chaque phase de dévoilement du tableau (Flop, Turn, River), chaque joueur choisit de garder ou d'échanger un certain nombre de cartes de sa main pour tenter d'améliorer sa combinaison :
   - **Flop** (3 cartes communes révélées) : Premier échange (choix de 0 à 5 cartes à jeter et remplacer).
   - **Turn** (4e carte commune révélée) : Deuxième échange.
   - **River** (5e carte commune révélée) : Troisième et dernier échange.
3. **Le Showdown** : Les mains privées sont dévoilées.
   - **Le Gagnant** : Le joueur avec la meilleure combinaison de 5 cartes (cartes privées + cartes communes) gagne **+1 point**.
   - **Le Perdant** : Le joueur avec la moins bonne combinaison **perd un vêtement** (représenté par un compteur numérique).
4. **La Règle des 3 points** : Lorsqu'un joueur accumule **3 points**, il peut choisir de les échanger pour *remettre un vêtement* (remettant son compteur de points à zéro).
5. **Fin de partie** : La partie prend fin dès qu'un joueur n'a plus aucun vêtement.

*Note sur les Égalités : En cas d'ex aequo pour la meilleure ou la pire main, personne ne gagne de point ou ne perd de vêtement pour ce tour.*

---

## 🚀 Lancement Rapide en Local

### Prérequis
Vous devez disposer de [Node.js](https://nodejs.org/) (v18+) et de [pnpm](https://pnpm.io/) installés sur votre machine.

```bash
# 1. Installer les dépendances
pnpm install

# 2. Lancer le serveur de développement local (Vite)
pnpm run dev

# 3. Lancer les tests unitaires (Vitest)
pnpm run test
```

Une fois le serveur démarré, ouvrez `http://localhost:5173` dans votre navigateur. Sans configuration de base de données, vous jouerez directement contre des bots.

---

## 🔧 Configuration Firebase pour le Multijoueur

Pour jouer à plusieurs sur internet, vous devez connecter l'application à un projet Firebase.

### 1. Créer le Projet Firebase
1. Rendez-vous sur la [Firebase Console](https://console.firebase.google.com/).
2. Cliquez sur **Ajouter un projet**, attribuez-lui un nom (ex: `poker-party`), et finalisez la création.

### 2. Activer l'Authentification Anonyme
1. Dans le menu de gauche, allez dans **Build > Authentication**.
2. Cliquez sur **Commencer**, puis sous l'onglet **Méthode de connexion**, activez le fournisseur **Anonyme**.

### 3. Créer la Realtime Database
1. Dans le menu de gauche, allez dans **Build > Realtime Database**.
2. Cliquez sur **Créer une base de données**.
3. **IMPORTANT** : Choisissez la région la plus proche (ex: `europe-west1` pour l'Europe).
4. Sélectionnez le mode **Test** pour commencer (l'écriture/lecture sera ouverte temporairement).

### 4. Configurer les variables d'environnement
Créez un fichier nommé `.env` à la racine du projet (copiez `.env.example` si besoin) :

```env
VITE_FIREBASE_API_KEY=AIzaSyCHICjg1iz6-_...
VITE_FIREBASE_AUTH_DOMAIN=poker-party-XXXX.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://poker-party-XXXX-default-rtdb.europe-west1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=poker-party-XXXX
VITE_FIREBASE_APP_ID=1:1016193433912:web:46745...
```

*Relancez votre serveur de développement local (`pnpm run dev`) pour charger ces nouvelles variables.*

---

## 🛡️ Règles de Sécurité de la Base de Données

Afin d'éviter la triche (comme le fait qu'un joueur lise les cartes d'un autre dans la console réseau), appliquez les règles de sécurité incluses :

1. Dans votre Firebase Console, allez dans **Realtime Database > Règles** (Rules).
2. Remplacez le code existant par le contenu du fichier `firebase.rules.json` présent à la racine de ce dépôt.
3. Cliquez sur **Publier**.

> [!TIP]
> **Problème de Permission Denied ?**
> Si Firebase refuse des accès, assurez-vous d'avoir bien sélectionné la bonne instance de base de données dans le menu déroulant de la console Firebase (si vous avez créé votre base de données en Belgique, sélectionnez l'onglet `europe-west1` au lieu de `us-central1` par défaut en haut de l'écran des Règles).

---

## 🌐 Déploiement sur GitHub Pages

L'application intègre un déploiement automatisé via **GitHub Actions**.

### 1. Configuration sur GitHub
Dans les paramètres de votre dépôt GitHub (**Settings > Secrets and variables > Actions**), ajoutez les secrets suivants avec les valeurs de votre Firebase :
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_DATABASE_URL`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

### 2. Base Path du Projet
Dans le fichier `vite.config.github-pages.ts`, assurez-vous que la clé `base` correspond au nom de votre dépôt GitHub :
```ts
base: '/poker-party/', // Remplacez par le nom de votre dépôt
```

### 3. Activation
Dans votre dépôt GitHub, allez dans **Settings > Pages**. Sous **Build and deployment > Source**, sélectionnez **GitHub Actions**.

Désormais, à chaque fois que vous ferez un `git push` sur la branche `main`, le site sera automatiquement compilé et mis en ligne.

---

## 🗺️ TODO / Évolutions Futures

Voici une liste d'améliorations prévues ou recommandées pour enrichir l'expérience utilisateur et la robustesse de l'application :

- [x] **Optimisation Responsivité Mobile complète** : Ajuster la disposition de la table de jeu (notamment les sièges des adversaires et le plateau central) sur les petits écrans en mode portrait.
- [x] **Historique des mains & Chat textuel** : Ajouter un panneau latéral pour lire le déroulement des actions passées (ex. *"Joueur 1 a changé 2 cartes"*, *"Joueur 2 a remporté la main avec un Brelan"*) et discuter en direct.
- [ ] **Retour Haptique & Effets Sonores** : Ajouter des bruitages subtils lors de la donne des cartes, du minuteur de tour et des émotes, avec vibration sur smartphone pour renforcer l'immersion.
- [ ] **Statistiques Joueurs** : Suivi des scores globaux et taux de victoires par session de jeu.
- [ ] **Gestion avancée des Déconnexions** : Faciliter la reconnexion automatique en cours de manche sans bloquer la FSM (Machine à États) et attribuer le statut de bot temporaire en cas d'absence.

