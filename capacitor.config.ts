import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shivamApps.splitzy',
  appName: 'Splitzy',
  // webDir: 'public'
  webDir: 'out',               // Next.js static export folder
  server: {
    url: 'http://localhost:3000', // For live-reload in development
    cleartext: true,           // Allows HTTP (disable in production)
  },
};

export default config;
