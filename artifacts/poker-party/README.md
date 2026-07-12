# Poker Party 🃏

Jeu de cartes inspiré du poker avec déshabillage progressif — version multijoueur en temps réel via Firebase Realtime Database, déployable comme site statique sur GitHub Pages.

---

## Lancer en local

```bash
# Installer les dépendances (depuis la racine du repo)
pnpm install

# Démarrer le serveur de développement
pnpm run dev

# Lancer les tests unitaires
pnpm run test
```

> En développement local sans variables Firebase, l'application bascule automatiquement en mode solo (IA) sans configuration supplémentaire.

---

## Configuration Firebase

### 1. Créer un projet Firebase gratuit

1. Rendez-vous sur [https://console.firebase.google.com](https://console.firebase.google.com).
2. Cliquez sur **Ajouter un projet**, donnez-lui un nom, désactivez Google Analytics si souhaité.
3. Une fois le projet créé, cliquez sur **Continuer**.

### 2. Activer Realtime Database

1. Dans le menu gauche, allez dans **Construire > Realtime Database**.
2. Cliquez sur **Créer une base de données**.
3. Choisissez la région (ex. `europe-west1`).
4. Sélectionnez le mode **Test** pour commencer (vous appliquerez les règles sécurisées juste après).
5. Notez l'URL de votre base (`https://PROJET-default-rtdb.europe-west1.firebasedatabase.app`).

### 3. Activer l'authentification anonyme

1. Dans le menu gauche, allez dans **Construire > Authentication**.
2. Cliquez sur **Commencer**, puis sur l'onglet **Mode de connexion**.
3. Activez le fournisseur **Anonyme**.

### 4. Récupérer les clés de configuration

1. Dans les paramètres du projet (engrenage ⚙️), allez dans **Paramètres du projet**.
2. Faites défiler jusqu'à **Vos applications** > **Application Web**, puis enregistrez une nouvelle app si nécessaire.
3. Copiez les valeurs `apiKey`, `authDomain`, `databaseURL`, `projectId`, `appId`.

### 5. Variables d'environnement en local

```bash
cp .env.example .env
```

Remplissez le fichier `.env` avec vos valeurs :

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=mon-projet.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://mon-projet-default-rtdb.europe-west1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=mon-projet
VITE_FIREBASE_APP_ID=1:123456789:web:abc...
```

> ⚠️ Ne commitez jamais le fichier `.env` dans Git (il est déjà dans `.gitignore`).

---

## Déploiement sur GitHub Pages

### 1. Secrets du dépôt GitHub

Dans votre dépôt GitHub : **Settings > Secrets and variables > Actions > New repository secret**.

Créez un secret pour chaque variable :

| Nom du secret                | Valeur                              |
|------------------------------|-------------------------------------|
| `VITE_FIREBASE_API_KEY`      | Votre clé API Firebase              |
| `VITE_FIREBASE_AUTH_DOMAIN`  | Votre domaine d'auth Firebase       |
| `VITE_FIREBASE_DATABASE_URL` | L'URL de votre Realtime Database    |
| `VITE_FIREBASE_PROJECT_ID`   | L'identifiant de votre projet       |
| `VITE_FIREBASE_APP_ID`       | L'identifiant de votre app Firebase |

### 2. Adapter le nom du dépôt dans la config Vite

Dans `vite.config.github-pages.ts`, remplacez `'/NOM-DU-REPO/'` par le nom réel de votre dépôt :

```ts
base: '/poker-party/',  // ou '/' si repo racine *.github.io
```

### 3. Activer GitHub Pages

Dans votre dépôt : **Settings > Pages > Source**, sélectionnez **GitHub Actions**.  
Le workflow `.github/workflows/deploy.yml` se déclenche automatiquement à chaque push sur `main`.

---

## Règles de sécurité Firebase

Après avoir créé la base de données, appliquez les règles du fichier `firebase.rules.json` :

1. Dans la console Firebase, allez dans **Realtime Database > Règles**.
2. Remplacez le contenu par celui du fichier `firebase.rules.json` fourni dans ce dépôt.
3. Cliquez sur **Publier**.

---

## Limites de sécurité (à lire avant de jouer en ligne)

### Ce que les règles protègent

- Un joueur **ne peut pas lire les cartes privées d'un autre** via les DevTools ou directement dans Firebase : chaque nœud `/private/{uid}` n'est lisible que par l'utilisateur dont l'UID correspond.
- Un joueur ne peut envoyer des intents que pour son propre UID.

### Ce que les règles ne protègent pas

- **L'hôte reste de confiance.** Le moteur de jeu tourne entièrement dans le navigateur de l'hôte : un hôte techniquement malveillant qui modifie son propre code JavaScript client pourrait altérer l'état du jeu (cartes, points…) avant de le publier dans Firebase. Ce modèle **n'est pas résistant à un hôte adversaire**, seulement à des joueurs non-hôtes normalement curieux.
- Ce jeu est conçu pour des parties entre amis. Il ne convient pas à un contexte compétitif avec enjeux réels.

---

## Simplifications des règles du jeu

- **Égalités :** En cas d'ex aequo pour la meilleure ou la pire main, personne ne gagne de point et personne ne perd de vêtement de ce côté-là. Les joueurs « au milieu » du classement dans les parties à 3-4 joueurs ne sont pas affectés.
- **Règle des 3 points :** Lorsqu'un joueur atteint 3 points, il peut choisir de remettre un vêtement en échange d'une remise à zéro de ses points (c'est un choix explicite, jamais automatique).
- **Fin de partie :** La partie se termine lorsqu'un joueur n'a plus aucun vêtement à retirer.
- **Pas de système de mise ni de pot** : l'ordre de main du poker est utilisé pour déterminer gagnant et perdant, mais sans enjeux de jetons.
