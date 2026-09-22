import type { StorybookConfig } from '@storybook/react-native-web-vite';

const config: StorybookConfig = {
  // Fonte única: as stories do design system (packages/ui) e as dos componentes que só existem em cada app.
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../../../apps/*/src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs"
  ],
  "framework": {
    "name": "@storybook/react-native-web-vite",
    // Animações (reanimated) precisam do plugin de worklets, como no app.
    "options": { "pluginReactOptions": { "babel": { "plugins": ["react-native-worklets/plugin"] } } }
  },
  // Os pacotes do Expo importam coisas que só existem no celular (PlatformColor) ou só como tipo.
  // No navegador elas viram vazias, em vez de travar a compilação.
  async viteFinal(config) {
    const { mergeConfig } = await import('vite');
    return mergeConfig(config, {
      // Cada arquivo usa o tsconfig mais próximo: o "@/" das stories de um app aponta para o src daquele app.
      resolve: { tsconfigPaths: true },
      optimizeDeps: { rolldownOptions: { shimMissingExports: true } },
      build: { rolldownOptions: { shimMissingExports: true } },
    });
  },
};
export default config;
