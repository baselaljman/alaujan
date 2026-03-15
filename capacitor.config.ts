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
      // إعدادات إضافية للموقع لضمان الدقة
    }
  }
};

export default config;