import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alaujan.app',
  appName: 'Al-Awajan Travel',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;