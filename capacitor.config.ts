import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alaujan.app',
  appName: 'alaujan',
  webDir: 'out' // تم التغيير من public إلى out لتتوافق مع Next.js Static Export
};

export default config;
