import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

/**
 * Initialise l'application Firebase de façon paresseuse (singleton).
 * Les variables d'environnement Vite (VITE_FIREBASE_*) doivent être
 * définies au moment de la build ; sans elles, cette fonction lève une
 * erreur explicite en français.
 */
function createFirebaseApp(): FirebaseApp {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined;
  const databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL as string | undefined;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID as string | undefined;

  if (!apiKey || !authDomain || !databaseURL || !projectId || !appId) {
    throw new Error(
      'Configuration Firebase incomplète : vérifiez que les variables ' +
        'VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, ' +
        'VITE_FIREBASE_DATABASE_URL, VITE_FIREBASE_PROJECT_ID et ' +
        'VITE_FIREBASE_APP_ID sont bien définies dans votre fichier .env.',
    );
  }

  const existing = getApps();
  if (existing.length > 0) {
    return existing[0];
  }

  return initializeApp({ apiKey, authDomain, databaseURL, projectId, appId });
}

let _app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!_app) _app = createFirebaseApp();
  return _app;
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export function getFirebaseDatabase() {
  return getDatabase(getFirebaseApp());
}
