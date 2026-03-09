
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alaujan.app',
  appName: 'Al-Awajan Travel',
  webDir: 'out', // توجيه Capacitor لمجلد التصدير الخاص بـ Next.js
  bundledWebRuntime: false
};

export default config;
