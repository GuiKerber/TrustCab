// Chaves do Firebase e do Google. Vêm do arquivo .env (EXPO_PUBLIC_*), nunca do código.
// Sem elas, o login mostra o que falta em vez de fingir que entrou.

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

export const googleClientIds = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
};

// Versão de demonstração (ex.: o site na Vercel, para portfólio): entra sem conta, com os dados de exemplo.
// No celular, o app publicado continua exigindo login.
export const demoEnabled = __DEV__ || process.env.EXPO_PUBLIC_DEMO === '1';

export const authConfigured =Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);

export const missingAuthKeys = [
  ...Object.entries(firebaseConfig).filter(([, value]) => !value).map(([key]) => `Firebase ${key}`),
  ...(googleClientIds.webClientId ? [] : ['Google web client ID']),
];
