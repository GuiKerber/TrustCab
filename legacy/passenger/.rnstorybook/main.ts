import type { StorybookConfig } from '@storybook/react-native';

const main: StorybookConfig = {
  // Stories do design system (packages/ui) e as deste app: o mesmo Storybook do navegador.
  stories: ['../../../packages/ui/src/**/*.stories.?(ts|tsx|js|jsx)', '../src/**/*.stories.?(ts|tsx|js|jsx)'],
  deviceAddons: ['@storybook/addon-ondevice-controls', '@storybook/addon-ondevice-actions'],
};

export default main;
