import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alaujan.app',
  appName: 'Al-Awajan Travel',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Geolocation: {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  }
};

export default config;