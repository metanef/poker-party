import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

/**
 * Configuration Vite pour la build de production GitHub Pages.
 *
 * IMPORTANT : remplacez 'NOM-DU-REPO' par le nom réel de votre dépôt GitHub,
 * par exemple '/poker-party/' si le dépôt s'appelle "poker-party".
 * Si le site est publié depuis un repo *.github.io racine (ex. monpseudo.github.io),
 * utilisez '/' à la place.
 *
 * Cette config est indépendante de l'environnement Replit : elle ne lit aucune
 * variable PORT ou BASE_PATH propre à Replit.
 */
export default defineConfig({
  base: '/NOM-DU-REPO/',

  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
    dedupe: ['react', 'react-dom'],
  },

  root: path.resolve(import.meta.dirname),

  build: {
    outDir: path.resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
  },
});
