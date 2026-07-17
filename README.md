# Poker Party 🃏

🔗 **Jouer en ligne** : [https://metanef.github.io/poker-party/](https://metanef.github.io/poker-party/)

**Poker Party** est une application web moderne et responsive de jeu de cartes inspiré du Poker avec un enjeu de déshabillage symbolique. Jouable en temps réel entre amis via **Firebase** ou en mode **Solo contre des bots**.

---

## ✨ Caractéristiques

- 🎴 **Poker d'échange** : 5 cartes en main + 5 cartes communes. Échanges à chaque étape (Flop, Turn, River).
- 👔 **Système de vêtements & points** : Le perdant de la manche retire 1 vêtement. Gagner 3 manches permet de racheter un vêtement.
- 📱 **100% Mobile & Responsive** : Interface fluide pensée pour smartphones (iOS / Android) et PC.
- ⚡ **Temps réel ou Solo** : Jouez à plusieurs en direct ou entraînez-vous contre des bots locaux.
- 🔥 **Animations de Showdown** : Effets visuels lorsqu'un joueur finit nu.

---

## 🕹️ Règles rapides

1. **Donne initiale** : 5 cartes privées par joueur.
2. **Phase d'échange** : Échangez jusqu'à 5 cartes au Flop, au Turn et à la River pour former la meilleure combinaison de 5 cartes.
3. **Showdown** : 
   - **Gagnant** : +1 point.
   - **Perdant** : Retire 1 vêtement (👕).
4. **Rachat** : 3 points accumulés permettent de récupérer 1 vêtement.
5. **Fin de partie** : La partie se termine dès qu'un joueur n'a plus aucun vêtement.

---

## 🚀 Lancement local

```bash
# Installer les dépendances
pnpm install

# Lancer le serveur local
pnpm run dev
```

Ouvrez `http://localhost:5173` dans votre navigateur.

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

